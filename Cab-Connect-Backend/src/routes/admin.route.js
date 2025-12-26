import express from 'express';
import Ride from '../models/Ride.model.js';
import authMiddleware from '../middleware/auth.middleware.js';
import adminMiddleware from '../middleware/admin.middleware.js';

const router = express.Router();

/*
    Admin can view all rides

*/

router.get('/rides', authMiddleware, adminMiddleware, async (req, res) => {
    try{
        const rides = (await Ride.find()).toSorted({ createdAt: -1 });
        res.json({ rides });
    } catch {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;