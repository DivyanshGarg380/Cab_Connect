import express from 'express';
import Ride from '../models/Ride.model.js';
import authMiddleware from '../middleware/auth.middleware.js';
import adminMiddleware from '../middleware/admin.middleware.js';
import Notification from "../models/Notification.model.js";
import { io } from "../server.js"

const router = express.Router();

/*
    Admin can view all rides
*/

router.get('/rides', authMiddleware, adminMiddleware, async (req, res) => {
    try{
        const rides = await Ride.find().sort({ createdAt: -1 });
        res.json({ rides });
    } catch(error) {
        console.error('ADMIN /rides error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.delete(
    '/rides/:id',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const ride = await Ride.findById(req.params.id);

            if(!ride){
                return res.status(404).json({ message: 'Ride not found' });
            }
            const creatorId = ride.creator.toString();
            const message = 'Your ride was removed by the administrator due to policy reasons';
            await Notification.create({
                user: creatorId,
                message,
            });

            io.to(creatorId).emit('admin-notification', {
                message,
            });
            // notify all ride participants that this ride has been cancelled by me :)
            io.to(ride._id.toString()).emit('ride-ended',{
                message: 'This ride was removed by the administrator',
            });

            await Ride.deleteOne({ _id: ride._id });
            res.json({ message: 'Ride was deleted by the admin' });
        }catch (error){
            console.error('Admin delete ride error: ', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

export default router;