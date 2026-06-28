import express from 'express';
import Ride from '../models/Ride.model.js';
import authMiddleware from '../middleware/auth.middleware.js';
import adminMiddleware from '../middleware/admin.middleware.js';
import Notification from "../models/Notification.model.js";
import User from "../models/User.model.js";

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/rides', async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page)  || 1,   1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);

    const rides = await Ride.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({ rides, page, limit });
  } catch (error) {
    console.error('ADMIN /rides error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page)  || 1,   1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);

    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({ users, page, limit });
  } catch (error) {
    console.error('ADMIN /users error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.delete('/rides/:id', async (req, res) => {
  try {
    const ride = await Ride.findByIdAndDelete(req.params.id).lean();

    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    const io = req.app.get('io');
    io.to(ride._id.toString()).emit('ride-ended', { message: 'This ride was removed by the administrator' });

    setImmediate(async () => {
      try {
        const notif = await Notification.create({
          user: ride.creator,
          message: 'Your ride was removed by the administrator due to policy reasons.',
          type: 'admin',
          meta: { action: 'ride_deleted', rideId: ride._id.toString(), destination: ride.destination, departureTime: ride.departureTime },
        });
        io.to(ride.creator.toString()).emit('notification:new', notif);
      } catch (err) {
        console.error('Admin delete notification failed:', err.message);
      }
    });

    return res.json({ message: 'Ride deleted by admin' });
  } catch (error) {
    console.error('Admin delete ride error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/ban/:userId', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      [
        {
          $set: {
            banCount: { $add: ['$banCount', 1] },
            isPermanantlyBanned: { $gte: [{ $add: ['$banCount', 1] }, 3] },
            banUntil: {
              $cond: [
                { $gte: [{ $add: ['$banCount', 1] }, 3] },
                null,
                { $dateAdd: { startDate: '$$NOW', unit: 'day', amount: 7 } },
              ],
            },
          },
        },
      ],
      { new: true, lean: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({
      message: user.isPermanantlyBanned ? 'User permanently banned' : 'User banned for 7 days',
      banCount: user.banCount,
    });
  } catch (error) {
    console.error('Ban user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/unban/:userId', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.userId, isPermanantlyBanned: false },
      { $set: { banUntil: null } },
      { new: true, lean: true }
    );

    if (!user) {
      const exists = await User.exists({ _id: req.params.userId });
      if (!exists) return res.status(404).json({ message: 'User not found' });
      return res.status(400).json({ message: 'Cannot unban permanently banned user' });
    }

    return res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    console.error('Unban user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
