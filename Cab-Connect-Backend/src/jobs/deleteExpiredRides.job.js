import Ride from "../models/Ride.model.js";
import { io } from '../server.js';
import Message from "../models/Message.model.js";

export const deleteExpiredRides = async () => {
    try {

        const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;
        const cutoff = new Date(Date.now() - TWO_DAYS);

        // finding expored rides first
        const expiredRides = await Ride.find(
            {
                status: 'expired',
                departureTime: { $lt: cutoff },
            },
            { _id: 1 }
        );

        if(expiredRides.length === 0) return;
        const rideIds = expiredRides.map(r => r._id);

        // deleting messages first
        await Message.deleteMany({
            ride: { $in: rideIds },
        });

        // deleting ride now
        await Ride.deleteMany({
           _id: { $in: rideIds },
        });

        rideIds.forEach((id) => {
            io.to(id.toString()).emit('ride-ended', {
                message: 'Ride deleted',
            });
        });

        console.log(`Cleanup: deleted ${rideIds.length} expired rides`);
    } catch (error) {
        console.log('Error deleting expired rides: ', error);
    }
}