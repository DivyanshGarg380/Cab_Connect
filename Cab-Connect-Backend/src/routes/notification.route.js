import express from 'express'
import Notification from '../models/Notification.model.js'
import authMiddleware from '../middleware/auth.middleware.js'

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification APIs
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Notifications fetched
 */

/**
 * @swagger
 * /notifications/read:
 *   post:
 *     summary: Mark notifications as read
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Marked as read
 */

router.get("/", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.userId,
      read: false,
    })
      .sort({ createdAt: -1 })
      .limit(1);

    return res.json({ notifications });
  } catch (error) {
    console.log("Fetch notification error: ", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/inbox", authMiddleware, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const notifications = await Notification.find({
      user: req.userId,
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Notification.countDocuments({ user: req.userId });

    return res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.log("Inbox fetch error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/unread-count", authMiddleware, async(req, res) => {
  try{
    const count = await Notification.countDocuments({
      user: req.userId,
      read: false,
    });
    res.json({ count });
  }catch(err){
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
});

router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {

    const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      {
        $set: {
          read: true,
          readAt: new Date(),
          deleteAt: new Date(Date.now() + TWO_DAYS),
        },
      },
      { new: true }
    );

    if(!notification){
      return res.status(404).json({ messafe: "Noification not found" });
    }

    res.json({ message: "Notification marked as read", notification});
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

router.patch("/read-all", authMiddleware, async(req, res) => {
  try {
    const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;
    const result = await Notification.updateMany(
      { user: req.userId, read: false },
      {
        $set: {
          read: true,
          readAt: new Date(),
          deleteAt: new Date(Date.now() + TWO_DAYS),
        },
      }
    );

    res.json({
      message: "All notifications marked as read",
      modified: result.modifiedCount,
    });
  }catch(err){
    res.status(500).json({ message: "Failed to mark all read" });
  }
});

export default router;