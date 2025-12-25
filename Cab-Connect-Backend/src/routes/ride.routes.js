import express from 'express';
import Ride from '../models/Ride.model.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

/*
    Create Ride 
    Creator auto join so 1/4
*/

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { source, destination, departureTime } = req.body;

        if (!source || !destination || !departureTime) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const rideDate = new Date(departureTime);
        if(rideDate <= new Date()) {
            return res.status(400).json({ message: 'Departure time must be in the future' });
        }
        
        const ride = await Ride.create({
            creator: req.userId,
            source,
            destination,
            departureTime: rideDate,
            participants: [req.userId],
            status: 'open',
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

export default router;