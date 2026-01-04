import express from 'express'
import Notification from '../models/Notification.model.js'
import authMiddleware from '../middleware/auth.middleware.js'

const router = express.Router();

router.get('/', authMiddleware, async (req,res) => {
    try{
        const notifications = await Notification.find({
            user: req.userId,
            read: false,
        }).sort({ createdAt: -1 }).limit(1);

        res.json({ notifications });
    }catch( error ){
        console.log('Fetch notification error: ', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      read: true,
    });

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

export default router;