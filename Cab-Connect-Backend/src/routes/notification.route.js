import express from 'express';
import Notification from '../models/Notification.model.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

// BEFORE: find() returns full Mongoose docs + separate countDocuments
// AFTER:  lean() everywhere, and inbox uses a single $facet aggregate for data+count in 1 query

router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.userId, read: false })
      .sort({ createdAt: -1 })
      .limit(1)
      .lean();

    return res.json({ notifications });
  } catch (error) {
    console.error('Fetch notification error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/inbox', authMiddleware, async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page)  || 1,   1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip  = (page - 1) * limit;

    // BEFORE: find() + countDocuments() — 2 round-trips
    // AFTER:  $facet — data + total in 1 round-trip
    const [result] = await Notification.aggregate([
      { $match: { user: req.userId } },
      {
        $facet: {
          data:  [{ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit }],
          total: [{ $count: 'n' }],
        },
      },
      {
        $project: {
          notifications: '$data',
          total: { $ifNull: [{ $arrayElemAt: ['$total.n', 0] }, 0] },
        },
      },
    ]);

    const { notifications, total } = result;
    return res.json({
      notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Inbox fetch error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    // countDocuments hits the index directly — fast, no change needed
    const count = await Notification.countDocuments({ user: req.userId, read: false });
    return res.json({ count });
  } catch (err) {
    console.error('Unread count error:', err);
    return res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const TWO_DAYS = 2 * 86400_000;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: { read: true, readAt: new Date(), deleteAt: new Date(Date.now() + TWO_DAYS) } },
      { new: true, lean: true }
    );

    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    return res.json({ message: 'Notification marked as read', notification });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ message: 'Failed to update notification' });
  }
});

router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    const TWO_DAYS = 2 * 86400_000;
    const result = await Notification.updateMany(
      { user: req.userId, read: false },
      { $set: { read: true, readAt: new Date(), deleteAt: new Date(Date.now() + TWO_DAYS) } }
    );
    return res.json({ message: 'All notifications marked as read', modified: result.modifiedCount });
  } catch (err) {
    console.error('Read-all error:', err);
    return res.status(500).json({ message: 'Failed to mark all read' });
  }
});

export default router;
