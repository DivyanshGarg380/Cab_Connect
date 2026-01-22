import express from 'express';
import Ride from '../models/Ride.model.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { mongo } from 'mongoose';
import { isNonEmptyString, isValidDate } from '../utils/validate.js';
import { io } from '../server.js';
import banMiddleware from "../middleware/ban.middleware.js";
import { expireOldRides } from '../jobs/expireRides.job.js';
import Message from '../models/Message.model.js';
import User from '../models/User.model.js';
import Notification from "../models/Notification.model.js";
import { cache } from "../middleware/cache.middleware.js";
import { invalidateRideCache } from "../utils/cacheInvalidate.js";
import { rideExpiryQueue } from "../queues/rideExpiry.queue.js";
import { cancelRideExpiryJob } from '../utils/cancelRideExpiryJob.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Rides
 *   description: Ride related APIs
 */

/**
 * @swagger
 * /rides:
 *   get:
 *     summary: Get all rides
 *     tags: [Rides]
 *     responses:
 *       200:
 *         description: List of rides
 */

/**
 * @swagger
 * /rides/recommended:
 *   get:
 *     summary: Get recommended rides
 *     tags: [Rides]
 *     responses:
 *       200:
 *         description: Recommended rides
 */

/**
 * @swagger
 * /rides:
 *   post:
 *     summary: Create a new ride
 *     tags: [Rides]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from: { type: string }
 *               to: { type: string }
 *               dateTime: { type: string }
 *               seats: { type: integer }
 *     responses:
 *       201:
 *         description: Ride created
 */

/**
 * @swagger
 * /rides/{rideId}/join:
 *   post:
 *     summary: Join a ride
 *     tags: [Rides]
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Joined ride
 *       404:
 *         description: Ride not found
 */

/*
    Create Ride 
    Creator auto join so 1/4
*/

router.post('/', authMiddleware, banMiddleware, async (req, res) => {
    try {
        const { destination, departureTime } = req.body;
        const rideDate = new Date(departureTime);
        const date = rideDate.toISOString().split('T')[0];

        if (
            !isNonEmptyString(destination) ||
            isNaN(rideDate.getTime())
        ) {
        return res.status(400).json({
            message: 'Invalid ride input',
        });
        }

        if(rideDate <= new Date()) {
            return res.status(400).json({ message: 'Departure time must be in the future' });
        }

        if(rideDate >= new Date(Date.now() + 40*24*60*60*1000)){
            return res.status(400).json({
                message: 'Select a closer Departure Date'
            });
        }

        // Edge Case 1: A user can create max 2 rides ( to airport or back to campus ).. so both rides cant have same dest
        const activeRides = await Ride.find({
            creator: req.userId,
            status: { $in: ['open', 'full']},
        });

        // max 2 allowed
        if(activeRides.length >= 2){
            return res.status(400).json({
                message: 'You can create at most 2 active rides at a time',
            })
        }

        // unique destination
        const sameDestination = activeRides.some(
            (ride) => ride.destination === destination
        );
        if(sameDestination){
            return res.status(400).json({
                message: `You already have an active ride scheduled to ${destination}`,
            });
        }

        // Edge case 2: Block creation if already a part of a ride
        const conflictingRide = await Ride.findOne({
            destination,
            status: { $in : ['open', 'full']},
            $or: [
                { creator: req.userId },
                { participants: req.userId },
            ],
        });

        if (conflictingRide) {
            return res.status(400).json({
                message: `You are already part of an active ride to ${destination}.`,
            });
        }
        
        const ride = await Ride.create({
            creator: req.userId,
            destination,
            departureTime: rideDate,
            date,
            participants: [req.userId],
            status: 'open',
        });

        const delay = new Date(ride.departureTime).getTime() - Date.now();
        await rideExpiryQueue.add("expire-ride", {
            rideId: ride._id.toString()
        },{
            delay: Math.max(delay, 0),
            jobId: `ride-expire-${ride._id.toString()}`, // duplicates prvented
            removeOnComplete: true,
            removeOnFail: 50,
        });

        await invalidateRideCache(ride._id.toString());

        io.emit("ride:updated", {
            rideId: ride._id.toString(),
            type: "create",
            ride
        });

        res.status(201).json({
            message: 'Ride created successfully',
            ride,
        });
    } catch (error) {
        console.log('Create Ride Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.post('/:id/join', authMiddleware, async (req, res) => {
    try{
        // Edge case 2: "Creator" cannot other join other rides -> Delete current ride to join other
        const activeCreatedRide = await Ride.findOne({
            creator: req.userId,
            status: { $in: ['open', 'full'] },
            _id: { $ne: req.params.id },
        });

        if(activeCreatedRide){
            return res.status(400).json({
                message: 'You have an active ride posted. Delete it before joining another ride.'
            })
        }
        
        const rideId = req.params.id;
        const userId = new mongo.ObjectId(req.userId);


        // Edge case 3: "User ( Not creator )" cant join more than 1 rides going to the same Destination
        const rideToJoin = await Ride.findById(rideId);
        if(!rideToJoin){
            return res.status(404).json({ message: "Ride not found" });
        }

        const conflictingRide = await Ride.findOne({
            _id: { $ne: rideId },
            destination: rideToJoin.destination,
            status: { $in: ["open", "full"] },
            $or: [
                { creator: userId },
                { participants: userId },
            ],
        });

        if(conflictingRide){
            return res.status(400).json({
                message: `You are already part of another active ride to ${rideToJoin.destination}. Leave it first.`,
            })
        }

        const ride = await Ride.findOneAndUpdate(
            {
                _id: rideId,
                status: 'open',
                isLocked: false,
                participants: { $ne: userId },
                $expr: { $lt: [ { $size: "$participants" }, 4 ] }
            },
            { $push: { participants: userId } },
            { new: true }
        );

        if(!ride) {
            return res.status(400).json({ message: 'Unable to join ride. It may be full, locked, expired, or you are already a participant.' });
        }

        if(ride.participants.length === 4 && ride.status !== 'full') {
            ride.status = 'full';
            await ride.save();
        }

        await invalidateRideCache(rideId);

        io.to(rideId).emit("ride:updated", {
            rideId,
            type: "join",
            ride
        });


        const user = await User.findById(req.userId).select('email');
        const userEmail = user?.email || 'Someone';

        const systemMessage = await Message.create({
            ride: rideId,
            text: `${userEmail} joined the Chat`,
            type: 'system',
        });

        io.to(rideId).emit('new-message', systemMessage);

        res.json({
            message: 'Joined ride successfully',
            ride,
        });
    } catch(error) {
        console.log('Join Ride Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.post('/:id/leave', authMiddleware, async (req, res) => {
    try{
        const rideId = req.params.id;
        const userId = new mongo.ObjectId(req.userId);

        const ride = await Ride.findById(rideId);
        if(!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        // creator cant leave -> He/She can only cancel the ride ( later integration )
        if(ride.creator.toString() === userId.toString()){
            return res.status(400).json({ message: 'Creator cannot leave the ride. Delete it instead' });
        }

        // so now all checks are done and its for sure a new member alrady in the ride
        if (!ride.participants.some(p => p.toString() === userId.toString())) {
            return res.status(403).json({ message: 'You are not part of this ride' });
        }

        ride.participants = ride.participants.filter(p => p.toString() !== userId.toString());

        // changing status to open if prior full
        if(ride.status === 'full' && ride.participants.length < 4) {
            ride.status = 'open';
        }

        io.to(rideId).emit("ride:updated", {
            rideId,
            type: "status",
            ride
        });

        await ride.save();

        await invalidateRideCache(rideId);

        io.to(rideId).emit("ride:updated", {
            rideId,
            type: "leave",
            ride
        });

        const user = await User.findById(req.userId).select('email');
        const userEmail = user?.email || 'Someone';

        const systemMessage = await Message.create({
            ride: rideId,
            text: `${userEmail} left the Chat`,
            type: 'system',
        });

        io.to(rideId).emit('new-message', systemMessage);

        res.json({
            message: 'Left ride successfully',
            ride,
        });

    }catch(error) {
        console.log('Leave Ride Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try{
        const rideId = req.params.id;
        const userId = new mongo.ObjectId(req.userId);

        const ride = await Ride.findById(rideId);
        if(!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }
        // Only creator can delete the ride he/she has created
        if(ride.creator.toString() !== userId.toString()){
            return res.status(403).json({ message: 'Only the creator can delete this ride' });
        }
        
        await cancelRideExpiryJob(rideId);

        await Ride.findByIdAndDelete(rideId);

        await invalidateRideCache(rideId);

        io.to(rideId).emit('ride-ended', {
            message: 'Ride was deleted by the creator',
        });

        io.in(rideId.toString()).socketsLeave(rideId.toString());

        io.emit("ride:updated", {
            rideId,
            type: "delete",
            ride: null
        });
        
        res.json({ message: 'Ride deleted successfully' });

    }catch(error) {
        console.log('Delete Ride Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get(
  "/suggestions",
  authMiddleware,
  cache((req) => {
    const { destination, departureTime, window } = req.query;
    return `rides:suggestions:${req.userId}:${destination}:${departureTime}:${window || 15}`;
  }, 20),
  async (req, res) => {
    try {
      const { destination, departureTime } = req.query;

      if (!destination || !["airport", "campus"].includes(destination)) {
        return res.status(400).json({ message: "Invalid destination" });
      }

      if (!departureTime) {
        return res.status(400).json({ message: "Missing departureTime" });
      }

      const targetTime = new Date(departureTime);
      if (isNaN(targetTime.getTime())) {
        return res.status(400).json({ message: "Invalid departureTime" });
      }

      const window = Number(req.query.window || 15);
      const WINDOW_MINUTES = Math.min(Math.max(window, 5), 60);

      const fromTime = new Date(targetTime.getTime() - WINDOW_MINUTES * 60 * 1000);
      const toTime = new Date(targetTime.getTime() + WINDOW_MINUTES * 60 * 1000);

      const userId = new mongo.ObjectId(req.userId);

      const alreadyInActiveRide = await Ride.exists({
        destination,
        status: "open",
        $or: [{ creator: userId }, { participants: userId }],
      });

      if (alreadyInActiveRide) {
        return res.json({
          message: "User already part of an open ride. Suggestions disabled.",
          suggestions: [],
          meta: {
            destination,
            windowMinutes: WINDOW_MINUTES,
            targetTime,
            fromTime,
            toTime,
            disabled: true,
            reason: "already_in_open_ride",
          },
        });
      }

      const rawSuggestions = await Ride.aggregate([
        {
          $match: {
            destination,
            status: "open",
            isLocked: false,
            departureTime: { $gte: fromTime, $lte: toTime },
            creator: { $ne: userId },
            participants: { $nin: [userId] },
          },
        },
        {
          $addFields: {
            seatsAvailable: { $subtract: [4, { $size: "$participants" }] },
            timeDiff: { $abs: { $subtract: ["$departureTime", targetTime] } },
          },
        },
        { $sort: { timeDiff: 1, seatsAvailable: -1 } },
        { $limit: 10 },
      ]);

      const ids = rawSuggestions.map((r) => r._id);

      const populated = await Ride.find({ _id: { $in: ids } })
        .populate("creator", "email")
        .populate("participants", "email");

      // keep aggregation sorting order
      const map = new Map(populated.map((r) => [r._id.toString(), r]));
      const finalSuggestions = ids.map((id) => map.get(id.toString())).filter(Boolean);


      return res.json({
        message: "Ride suggestions fetched",
        suggestions: finalSuggestions,
        meta: {
          destination,
          windowMinutes: WINDOW_MINUTES,
          targetTime,
          fromTime,
          toTime,
        },
      });
    } catch (error) {
      console.log("Ride Suggestions Error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.get(
  "/:id",
  authMiddleware,
  cache((req) => `rides:${req.params.id}`, 20),
  async (req, res) => {
    try {
      const ride = await Ride.findById(req.params.id)
        .populate("creator", "email")
        .populate("participants", "email");

      if (!ride) return res.status(404).json({ message: "Ride not found" });

      return res.json({ ride });
    } catch (error) {
      console.log("Fetch Ride Error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.get(
  "/",
  authMiddleware,
  cache(() => `rides:all`, 10),
  async (req, res) => {
    const rides = await Ride.find({
        status: { $in: ["open", "full"] },
    })
      .populate("creator", "email")
      .populate("participants", "email");

    return res.json({ rides });
  }
);

router.get(
  "/:id/messages",
  authMiddleware,
  banMiddleware,
  cache((req) => `rides:${req.params.id}:messages`, 15),
  async (req, res) => {
    try {
      const rideId = req.params.id;

      const messages = await Message.find({ ride: rideId })
        .populate("sender", "email")
        .sort({ createdAt: 1 });

      return res.json({ messages });
    } catch (err) {
      console.log("Fetch Messages Error: ", err);
      return res.status(500).json({ message: "Server Error" });
    }
  }
);

router.post('/:id/messages', authMiddleware, banMiddleware, async (req, res) => {
    try{
        const rideId = req.params.id;
        const rideExists = await Ride.findById(rideId);
        if (!rideExists) {
            return res.status(404).json({ message: 'Ride not found' });
        }
        const { text } = req.body;

        if(!text || !text.trim()){
            return res.status(400).json({ message: 'Message text Required '});
        }

        const message = await Message.create({
            ride: rideId,
            sender: req.userId,
            text,
        });

        const populatedMessage = await message.populate('sender', 'email');

        await invalidateRideCache(rideId);

        io.to(rideId).emit('new-message', populatedMessage);
        res.status(201).json({ message: populatedMessage });
    }catch( err){
        console.error('Send Message Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/:id/kick', authMiddleware, async (req, res) => {
    try {
        const rideId = req.params.id;
        const { participantId } = req.body;
        const creatorId = req.userId;

        const ride = await Ride.findById(rideId).populate('creator', 'email').populate('participants', 'email');
        if(!ride){
            return res.status(400).json({ message: 'Ride not found' });
        }
        if(ride.creator._id.toString() !== creatorId){
            return res.status(403).json({ message: 'Only creator can Kick Users' });
        }
        if(participantId.toString() == creatorId.toString()){
            return res.status(400).json({ message: 'Creator cannot kick themselves' });
        }

        const participantIndex = ride.participants.findIndex(
            p => p._id.toString() === String(participantId)
        );

        if (participantIndex === -1) {
            return res.status(400).json({ message: 'User not in ride' });
        }

        const participant = ride.participants[participantIndex];

        ride.participants = ride.participants.filter(
            p => p._id.toString() !== String(participantId)
        );

        if (ride.status === 'full' && ride.participants.length < 4) {
            ride.status = 'open';
        }

        io.to(rideId).emit("ride:updated", {
            rideId,
            type: "status",
            ride
        });

        await ride.save();

        await invalidateRideCache(rideId);

        io.to(rideId).emit("ride:updated", {
            rideId,
            type: "kick",
            ride
        });

        const getDisplayName = (email) => {
            const localPart = email.split('mit')[0];

            return localPart
            .replace(/\d+/g, '')               
            .replace(/[._]/g, ' ')            
            .trim()
            .replace(/\b\w/g, (c) => c.toUpperCase());
        };

        const systemMessage = await Message.create({
            ride: rideId,
            text: `${getDisplayName(ride.creator.email)} removed ${getDisplayName(participant.email)}`,
            type: 'system',
        });

        io.to(rideId).emit('new-message', systemMessage);

        const time = new Date(ride.departureTime).toLocaleString();

        const formattedTime = new Date(ride.departureTime).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

        const notif = await Notification.create({
            user: participantId,
            message: `You were removed from a cab ride...

            Removed by: ${ride.creator.email}

            Destination: ${ride.destination === "airport" ? "Airport" : "Campus"}
            Departure: ${formattedTime}

            If this was a mistake, please contact the ride creator.`,
            type: "ride",
            meta: {
                action: "kick",
                rideId: rideId.toString(),
                destination: ride.destination,
            },
        });

        io.to(participantId.toString()).emit("notification:new", notif);

        io.in(participantId.toString()).socketsLeave(rideId.toString());

        res.json({ message: 'Participant removed' });
    } catch( error ){
        console.log('Kick Error: ', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.patch("/:id/lock", authMiddleware, async(req, res) => {
    try {
        const rideId = req.params.id;
        const userId = new mongo.ObjectId(req.userId);

        const ride = await Ride.findOneAndUpdate(
            {
                _id: rideId,
                creator: userId,
                status: { $in: ["open", "full"] },
                isLocked: false,
                $expr: { $gte: [{ $size:  "$participants" }, 2]},
            },
            {
                $set: {
                    isLocked: true,
                    lockedAt: new Date(),
                },
            },
            { new : true }
        )
        .populate("creator", "email")
        .populate("participants", "email")

        if(!ride){
            return res.status(400).json({
                message: "Unable to lock ride. Either ride not found, already locked, expired or participants are less than 2.",
            });
        }

        await invalidateRideCache(rideId);

        io.to(rideId.toString()).emit("ride:updated", {
            rideId: rideId.toString(),
            type: "lock",
            ride,
        });

        io.emit("ride:updated", {
            rideId: rideId.toString(),
            type: "lock",
            ride,
        });

        return res.json({ message: "Ride Locked Successfully ", ride });
    }catch (err){
        console.log("Lock Ride Error:", err);
        return res.status(500).json({ message: "Server Error" });
    }
});

router.patch("/:id/unlock", authMiddleware, async(req, res) => {
    try {
        const rideId = req.params.id;
        const userId = new mongo.ObjectId(req.userId);

        const ride = await Ride.findOneAndUpdate(
            {
                _id: rideId,
                creator: userId,
                status: { $in: ["open", "full" ]},
                isLocked: true,
            },
            {
                $set: {
                    isLocked: false,
                    lockedAt: null,
                },
            },
            { new: true }
        )
        .populate("creator", "email")
        .populate("participants", "email")

        if(!ride){
            return res.status(400).json({
                message: "Unable to unlock ride. Either not found expired or already unlocked.",
            });
        }

        await invalidateRideCache(rideId);

        io.to(rideId.toString()).emit("ride:updated", {
            rideId: rideId.toString(),
            type: "unlock",
            ride,
        });

        io.emit("ride:updated", {
            rideId: rideId.toString(),
            type: "unlock",
            ride
        });

        return res.json({ message: "Ride unlocked successfully ", ride});
    }catch(err){
        console.log("Unlock Ride Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
})

export default router;