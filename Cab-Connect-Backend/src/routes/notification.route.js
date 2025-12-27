import express from 'express'
import Notification from '../models/Notification.model.js'
import authMiddleware from '../middleware/auth.middleware.js'

const router = express.Router();

router.get('/', authMiddleware, async (req,res) => {
    try{
        const notifications = await Notification.find({
            user: req.userId,
        }).sort({ createdAt: -1 }).limit(50);

        res.json({ notifications });
    }catch( error ){
        console.log('Fetch notification error: ', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;