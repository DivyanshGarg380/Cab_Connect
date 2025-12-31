import express from 'express';
import Ride from '../models/Ride.model.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { mongo } from 'mongoose';
import { isNonEmptyString, isValidDate } from '../utils/validate.js';
import { io } from '../server.js';
import banMiddleware from "../middleware/ban.middleware.js"

const router = express.Router();

/*
    Create Ride 
    Creator auto join so 1/4
*/

router.post('/', authMiddleware, banMiddleware, async (req, res) => {
    try {
        const { destination, departureTime } = req.body;
        const rideDate = new Date(departureTime);
        const date = rideDate.toISOString().split('T')[0];

        console.log(`${destination} , ${departureTime}`)

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
        
        const ride = await Ride.create({
            creator: req.userId,
            destination,
            departureTime: rideDate,
            date,
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

router.post('/:id/join', authMiddleware, async (req, res) => {
    try{
        const rideId = req.params.id;
        const userId = new mongo.ObjectId(req.userId);

        const ride = await Ride.findOneAndUpdate(
            {
                _id: rideId,
                status: 'open',
                participants: { $ne: userId },
                $expr: { $lt: [ { $size: "$participants" }, 4 ] }
            },
            { $push: { participants: userId } },
            { new: true }
        );

        if(!ride) {
            return res.status(400).json({ message: 'Unable to join ride. It may be full, expired, or you are already a participant.' });
        }

        if(ride.participants.length === 4 && ride.status !== 'full') {
            ride.status = 'full';
            await ride.save();
        }

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
        
        await ride.save();
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

        await Ride.findByIdAndDelete(rideId);

        io.to(rideId).emit('ride-ended', {
            message: 'Ride was deleted by the creator',
        });
        
        res.json({ message: 'Ride deleted successfully' });

    }catch(error) {
        console.log('Delete Ride Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/', authMiddleware, async (req, res) => {
  const rides = await Ride.find()
    .populate('creator', 'email')
    .populate('participants', 'email');

  res.json({ rides });
});

export default router;