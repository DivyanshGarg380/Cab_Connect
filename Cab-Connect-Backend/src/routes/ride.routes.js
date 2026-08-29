import express from 'express';
import Ride from '../models/Ride.model.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { mongo, mongoose } from 'mongoose';
import { isNonEmptyString } from '../utils/validate.js';
import banMiddleware from "../middleware/ban.middleware.js";
import Message from '../models/Message.model.js';
import User from '../models/User.model.js';
import Notification from "../models/Notification.model.js";
import { cache, cacheWithAuth  } from "../middleware/cache.middleware.js";
import { invalidateRideCache } from "../utils/cacheInvalidate.js";
import { rideExpiryQueue } from "../queues/rideExpiry.queue.js";
import { cancelRideExpiryJob } from '../utils/cancelRideExpiryJob.js';

const router = express.Router();

router.post('/', authMiddleware, banMiddleware, async (req, res) => {
  try {
    const { destination, departureTime } = req.body;
    const rideDate = new Date(departureTime);

    if (!isNonEmptyString(destination) || isNaN(rideDate.getTime())) {
      return res.status(400).json({ message: 'Invalid ride input' });
    }
    const now = Date.now();
    if (rideDate.getTime() <= now) {
      return res.status(400).json({ message: 'Departure time must be in the future' });
    }
    if (rideDate.getTime() >= now + 40 * 86400_000) {
      return res.status(400).json({ message: 'Select a closer Departure Date' });
    }

    const userId = req.userId;

    const [activeRides, conflictingRide] = await Promise.all([
      Ride.find({ creator: userId, status: { $in: ['open', 'full'] } })
          .select('destination')
          .lean(),
      Ride.exists({
        destination,
        status: { $in: ['open', 'full'] },
        $or: [{ creator: userId }, { participants: userId }],
      }),
    ]);

    if (activeRides.length >= 2) {
      return res.status(400).json({ message: 'You can create at most 2 active rides at a time' });
    }
    if (activeRides.some(r => r.destination === destination)) {
      return res.status(400).json({ message: `You already have an active ride scheduled to ${destination}` });
    }
    if (conflictingRide) {
      return res.status(400).json({ message: `You are already part of an active ride to ${destination}.` });
    }

    const date = rideDate.toISOString().split('T')[0];
    const ride = await Ride.create({
      creator: userId,
      destination,
      departureTime: rideDate,
      date,
      participants: [userId],
      status: 'open',
    });

    const delay = rideDate.getTime() - Date.now();

    await Promise.all([
      rideExpiryQueue.add('expire-ride', { rideId: ride._id.toString() }, {
        delay: Math.max(delay, 0),
        jobId: `ride-expire-${ride._id.toString()}`,
        removeOnComplete: true,
        removeOnFail: 50,
      }),
      invalidateRideCache(ride._id.toString()),
    ]);

    const io = req.app.get('io');
    io.to('rides:list').emit('ride:updated', { rideId: ride._id.toString(), type: 'create', ride });

    return res.status(201).json({ message: 'Ride created successfully', ride });
  } catch (error) {
    console.error('Create Ride Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const rideId = req.params.id;
    const userId = new mongoose.Types.ObjectId(req.userId);

    const [activeCreatedRide, rideToJoin] = await Promise.all([
      Ride.exists({
        creator: req.userId,
        status: { $in: ['open', 'full'] },
        _id: { $ne: rideId },
      }),
      Ride.findById(rideId).select('destination status isLocked participants').lean(),
    ]);

    if (activeCreatedRide) {
      return res.status(400).json({ message: 'You have an active ride posted. Delete it before joining another ride.' });
    }
    if (!rideToJoin) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const conflictingRide = await Ride.exists({
      _id: { $ne: rideId },
      destination: rideToJoin.destination,
      status: { $in: ['open', 'full'] },
      $or: [{ creator: userId }, { participants: userId }],
    });

    if (conflictingRide) {
      return res.status(400).json({
        message: `You are already part of another active ride to ${rideToJoin.destination}. Leave it first.`,
      });
    }

    const ride = await Ride.findOneAndUpdate(
      {
        _id: rideId,
        status: 'open',
        isLocked: false,
        participants: { $ne: userId },
        $expr: { $lt: [{ $size: '$participants' }, 4] },
      },
      [{
        $set: {
          participants: { $concatArrays: ['$participants', [userId]] },
          status: {
            $cond: [{ $eq: [{ $add: [{ $size: '$participants' }, 1] }, 4] }, 'full', '$status'],
          },
        },
      }],
      { new: true, updatePipeline: true }
    );

    if (!ride) {
      return res.status(400).json({ message: 'Unable to join ride. It may be full, locked, expired, or you are already a participant.' });
    }

    const [user] = await Promise.all([
      User.findById(req.userId).select('email').lean(),
      invalidateRideCache(rideId),
    ]);

    const userEmail = user?.email || 'Someone';
    const systemMessage = await Message.create({
      ride: rideId,
      text: `${userEmail} joined the Chat`,
      type: 'system',
    });

    const io = req.app.get('io');
    io.to(rideId).emit('ride:updated', { rideId, type: 'join', ride });
    io.to(rideId).emit('new-message', systemMessage);
    io.to('rides:list').emit('ride:updated', { rideId, type: 'join', ride });

    return res.json({ message: 'Joined ride successfully', ride });
  } catch (error) {
    console.error('Join Ride Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const rideId = req.params.id;
    const userId = new mongo.ObjectId(req.userId);

    const ride = await Ride.findOneAndUpdate(
      {
        _id: rideId,
        status: { $ne: 'expired' },
        creator: { $ne: userId },     
        participants: userId,    
      },
      [{
        $set: {
          participants: {
            $filter: { input: '$participants', as: 'p', cond: { $ne: ['$$p', userId] } },
          },
          status: {
            $cond: [
              { $and: [{ $eq: ['$status', 'full'] }, { $lt: [{ $size: '$participants' }, 5] }] },
              'open',
              '$status',
            ],
          },
        },
      }],
      { new: true, updatePipeline: true }
    );

    if (!ride) {
      const exists = await Ride.exists({ _id: rideId });
      if (!exists) return res.status(404).json({ message: 'Ride not found' });
      const isCreator = await Ride.exists({ _id: rideId, creator: userId });
      if (isCreator) return res.status(400).json({ message: 'Creator cannot leave the ride. Delete it instead.' });
      return res.status(403).json({ message: 'You are not part of this ride' });
    }

    const [user] = await Promise.all([
      User.findById(req.userId).select('email').lean(),
      invalidateRideCache(rideId),
    ]);

    const userEmail = user?.email || 'Someone';
    const systemMessage = await Message.create({
      ride: rideId,
      text: `${userEmail} left the Chat`,
      type: 'system',
    });

    const io = req.app.get('io');
    io.to(rideId).emit('ride:updated', { rideId, type: 'leave', ride });
    io.to(rideId).emit('new-message', systemMessage);
    io.to('rides:list').emit('ride:updated', { rideId, type: 'leave', ride });

    return res.json({ message: 'Left ride successfully', ride });
  } catch (error) {
    console.error('Leave Ride Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const rideId = req.params.id;
    const userId = req.userId;

    const ride = await Ride.findOneAndDelete({ _id: rideId, creator: userId });

    if (!ride) {
      const exists = await Ride.exists({ _id: rideId });
      if (!exists) return res.status(404).json({ message: 'Ride not found' });
      return res.status(403).json({ message: 'Only the creator can delete this ride' });
    }

    const io = req.app.get('io');
    await Promise.all([
      cancelRideExpiryJob(rideId),
      invalidateRideCache(rideId),
    ]);

    io.to(rideId).emit('ride-ended', { message: 'Ride was deleted by the creator' });
    io.in(rideId).socketsLeave(rideId);
    io.to('rides:list').emit('ride:updated', { rideId, type: 'delete', ride: null });

    return res.json({ message: 'Ride deleted successfully' });
  } catch (error) {
    console.error('Delete Ride Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get(
  '/suggestions',
  authMiddleware,
  cache((req) => {
    const { destination, departureTime, window } = req.query;
    return `rides:suggestions:${req.userId}:${destination}:${departureTime}:${window || 15}`;
  }, 20),
  async (req, res) => {
    try {
      const { destination, departureTime } = req.query;

      if (!destination || !['airport', 'campus'].includes(destination)) {
        return res.status(400).json({ message: 'Invalid destination' });
      }
      if (!departureTime) {
        return res.status(400).json({ message: 'Missing departureTime' });
      }

      const targetTime = new Date(departureTime);
      if (isNaN(targetTime.getTime())) {
        return res.status(400).json({ message: 'Invalid departureTime' });
      }

      const WINDOW_MINUTES = Math.min(Math.max(Number(req.query.window || 15), 5), 60);
      const fromTime = new Date(targetTime.getTime() - WINDOW_MINUTES * 60_000);
      const toTime   = new Date(targetTime.getTime() + WINDOW_MINUTES * 60_000);
      const userId   = new mongo.ObjectId(req.userId);

      const alreadyIn = await Ride.exists({
        destination,
        status: 'open',
        $or: [{ creator: userId }, { participants: userId }],
      });

      if (alreadyIn) {
        return res.json({
          message: 'User already part of an open ride. Suggestions disabled.',
          suggestions: [],
          meta: { destination, windowMinutes: WINDOW_MINUTES, targetTime, fromTime, toTime, disabled: true, reason: 'already_in_open_ride' },
        });
      }

      const suggestions = await Ride.aggregate([
        {
          $match: {
            destination,
            status: 'open',
            isLocked: false,
            departureTime: { $gte: fromTime, $lte: toTime },
            creator: { $ne: userId },
            participants: { $nin: [userId] },
          },
        },
        {
          $addFields: {
            seatsAvailable: { $subtract: [4, { $size: '$participants' }] },
            timeDiff: { $abs: { $subtract: ['$departureTime', targetTime] } },
          },
        },
        { $sort: { timeDiff: 1, seatsAvailable: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: 'creator',
            foreignField: '_id',
            pipeline: [{ $project: { email: 1 } }],
            as: 'creatorInfo',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'participants',
            foreignField: '_id',
            pipeline: [{ $project: { email: 1 } }],
            as: 'participantsInfo',
          },
        },
        {
          $addFields: {
            creator: { $arrayElemAt: ['$creatorInfo', 0] },
            participants: '$participantsInfo',
          },
        },
        { $project: { creatorInfo: 0, participantsInfo: 0 } },
      ]);

      return res.json({
        message: 'Ride suggestions fetched',
        suggestions,
        meta: { destination, windowMinutes: WINDOW_MINUTES, targetTime, fromTime, toTime },
      });
    } catch (error) {
      console.error('Ride Suggestions Error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get(
  '/:id',
  authMiddleware,
  cacheWithAuth((req) => `rides:${req.params.id}`, 20),
  async (req, res) => {
    try {
      const [ride] = await Ride.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
        {
          $lookup: {
            from: 'users', localField: 'creator', foreignField: '_id',
            pipeline: [{ $project: { email: 1 } }], as: 'creatorArr',
          },
        },
        {
          $lookup: {
            from: 'users', localField: 'participants', foreignField: '_id',
            pipeline: [{ $project: { email: 1 } }], as: 'participantsArr',
          },
        },
        {
          $addFields: {
            creator: { $arrayElemAt: ['$creatorArr', 0] },
            participants: '$participantsArr',
          },
        },
        { $project: { creatorArr: 0, participantsArr: 0 } },
      ]);

      if (!ride) return res.status(404).json({ message: 'Ride not found' });
      return res.json({ ride });
    } catch (error) {
      console.error('Fetch Ride Error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get(
  '/',
  authMiddleware,
  cacheWithAuth((req) => {
    const page = parseInt(req.query.page) || 1;
    return `rides:all:page:${page}`;
  }, 10),
  async (req, res) => {
    const page  = Math.max(parseInt(req.query.page)  || 1,   1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const rides = await Ride.aggregate([
      { $match: { status: { $in: ['open', 'full'] } } },
      { $sort: { departureTime: 1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'users', localField: 'creator', foreignField: '_id',
          pipeline: [{ $project: { email: 1 } }], as: 'creatorArr',
        },
      },
      {
        $lookup: {
          from: 'users', localField: 'participants', foreignField: '_id',
          pipeline: [{ $project: { email: 1 } }], as: 'participantsArr',
        },
      },
      {
        $addFields: {
          creator: { $arrayElemAt: ['$creatorArr', 0] },
          participants: '$participantsArr',
        },
      },
      { $project: { creatorArr: 0, participantsArr: 0 } },
    ]);

    return res.json({ rides, page, limit });
  }
);

router.get(
  '/:id/messages',
  authMiddleware,
  banMiddleware,
  cache((req) => `rides:${req.params.id}:messages`, 15),
  async (req, res) => {
    try {
      const messages = await Message.aggregate([
        { $match: { ride: new mongoose.Types.ObjectId(req.params.id) } },
        { $sort: { createdAt: 1 } },
        {
          $lookup: {
            from: 'users', localField: 'sender', foreignField: '_id',
            pipeline: [{ $project: { email: 1 } }], as: 'senderArr',
          },
        },
        { $addFields: { sender: { $arrayElemAt: ['$senderArr', 0] } } },
        { $project: { senderArr: 0 } },
      ]);

      return res.json({ messages });
    } catch (err) {
      console.error('Fetch Messages Error:', err);
      return res.status(500).json({ message: 'Server Error' });
    }
  }
);

router.post('/:id/messages', authMiddleware, banMiddleware, async (req, res) => {
  try {
    const rideId = req.params.id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text required' });
    }

    const [rideExists] = await Promise.all([
      Ride.exists({ _id: rideId }),
    ]);
    if (!rideExists) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const message = await Message.create({ ride: rideId, sender: req.userId, text: text.trim() });

    const sender = await User.findById(req.userId).select('email').lean();
    const populatedMessage = { ...message.toObject(), sender };

    invalidateRideCache(rideId).catch(() => {});

    const io = req.app.get('io');
    io.to(rideId).emit('new-message', populatedMessage);

    return res.status(201).json({ message: populatedMessage });
  } catch (err) {
    console.error('Send Message Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/kick', authMiddleware, async (req, res) => {
  try {
    const rideId = req.params.id;
    const { participantId } = req.body;
    const creatorId = req.userId;

    if (String(participantId) === String(creatorId)) {
      return res.status(400).json({ message: 'Creator cannot kick themselves' });
    }

    const participantObjId = new mongoose.Types.ObjectId(participantId);

    const ride = await Ride.findOneAndUpdate(
      {
        _id: rideId,
        creator: creatorId,
        participants: participantObjId,
      },
      [{
        $set: {
          participants: {
            $filter: { input: '$participants', as: 'p', cond: { $ne: ['$$p', participantObjId] } },
          },
          status: {
            $cond: [
              { $and: [{ $eq: ['$status', 'full'] }, { $lt: [{ $size: '$participants' }, 5] }] },
              'open',
              '$status',
            ],
          },
        },
      }],
      { new: true, updatePipeline: true }
    );

    if (!ride) {
      const exists = await Ride.exists({ _id: rideId });
      if (!exists) return res.status(404).json({ message: 'Ride not found' });
      const isCreator = await Ride.exists({ _id: rideId, creator: creatorId });
      if (!isCreator) return res.status(403).json({ message: 'Only creator can kick users' });
      return res.status(400).json({ message: 'User not in ride' });
    }

    const [creator, participant] = await Promise.all([
      User.findById(creatorId).select('email').lean(),
      User.findById(participantId).select('email').lean(),
      invalidateRideCache(rideId),
    ]);

    const getDisplayName = (email) =>
      email.split('mit')[0].replace(/\d+/g, '').replace(/[._]/g, ' ').trim()
        .replace(/\b\w/g, c => c.toUpperCase());

    const formattedTime = new Date(ride.departureTime).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
    });

    const [systemMessage, notif] = await Promise.all([
      Message.create({
        ride: rideId,
        text: `${getDisplayName(creator.email)} removed ${getDisplayName(participant.email)}`,
        type: 'system',
      }),
      Notification.create({
        user: participantId,
        message: `You were removed from a cab ride.\n\nRemoved by: ${creator.email}\nDestination: ${ride.destination === 'airport' ? 'Airport' : 'Campus'}\nDeparture: ${formattedTime}\n\nIf this was a mistake, please contact the ride creator.`,
        type: 'ride',
        meta: { action: 'kick', rideId: rideId.toString(), destination: ride.destination },
      }),
    ]);

    const io = req.app.get('io');
    io.to(rideId).emit('ride:updated', { rideId, type: 'kick', ride });
    io.to(rideId).emit('new-message', systemMessage);
    io.to('rides:list').emit('ride:updated', { rideId, type: 'kick', ride });
    io.to(participantId.toString()).emit('notification:new', notif);
    io.in(participantId.toString()).socketsLeave(rideId);

    return res.json({ message: 'Participant removed' });
  } catch (error) {
    console.error('Kick Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/lock', authMiddleware, async (req, res) => {
  try {
    const rideId = req.params.id;
    const userId = new mongo.ObjectId(req.userId);

    const ride = await Ride.findOneAndUpdate(
      {
        _id: rideId,
        creator: userId,
        status: { $in: ['open', 'full'] },
        isLocked: false,
        $expr: { $gte: [{ $size: '$participants' }, 2] },
      },
      { $set: { isLocked: true, lockedAt: new Date() } },
      { new: true }
    );

    if (!ride) {
      return res.status(400).json({ message: 'Unable to lock ride. Either not found, already locked, expired, or fewer than 2 participants.' });
    }

    await invalidateRideCache(rideId);

    const io = req.app.get('io');
    io.to(rideId.toString()).emit('ride:updated', { rideId: rideId.toString(), type: 'lock', ride });
    io.to('rides:list').emit('ride:updated', { rideId: rideId.toString(), type: 'lock', ride });

    return res.json({ message: 'Ride locked successfully', ride });
  } catch (err) {
    console.error('Lock Ride Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


router.patch('/:id/unlock', authMiddleware, async (req, res) => {
  try {
    const rideId = req.params.id;
    const userId = new mongo.ObjectId(req.userId);

    const ride = await Ride.findOneAndUpdate(
      {
        _id: rideId,
        creator: userId,
        status: { $in: ['open', 'full'] },
        isLocked: true,
      },
      { $set: { isLocked: false, lockedAt: null } },
      { new: true }
    );

    if (!ride) {
      return res.status(400).json({ message: 'Unable to unlock ride. Either not found, expired, or already unlocked.' });
    }

    await invalidateRideCache(rideId);

    const io = req.app.get('io');
    io.to(rideId.toString()).emit('ride:updated', { rideId: rideId.toString(), type: 'unlock', ride });
    io.to('rides:list').emit('ride:updated', { rideId: rideId.toString(), type: 'unlock', ride });

    return res.json({ message: 'Ride unlocked successfully', ride });
  } catch (err) {
    console.error('Unlock Ride Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;