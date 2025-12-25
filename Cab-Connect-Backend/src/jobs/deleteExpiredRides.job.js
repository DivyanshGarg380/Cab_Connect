import Ride from "../models/Ride.model.js"
import Message  from "../models/Message.model.js"

export const deleteExpiredRides = async () => {
    try {
        // finding expored rides first
        const expiredRides = await Ride.find(
            { status: 'expired' },
            { _id: 1 }
        );

        if(expiredRides.length === 0) return;
        const rideIds = expiredRides.map(r => r._id);

        // deleting messages first
        const msgResult = await Message.deleteMany({
            ride: { $in: rideIds },
        });

        // deleting ride now
        const rideResult = await Ride.deleteMany({
            _id: { $in: rideIds },
        });

        console.log(
            `Cleanup: deleted ${rideResult.deletedCount} rides and ${msgResult.deletedCount} messages`
        );
    } catch (error) {
        console.log('Error deleting expired rides: ', error);
    }
}