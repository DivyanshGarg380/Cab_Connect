import Ride from "../models/Ride.model.js";

export const expireOldRides = async () => {
    try{
        const now = new Date();

        const result = await Ride.updateMany(
            {
                departureTime : { $lt: now },
                status: { $ne: 'expired' },
            },
            {
                $set: { status: 'expired' },
            }
        );

        if(result.modifiedCount > 0){
            console.log(`Expired ${result.modifiedCount} ride(s)`);
        }
    } catch (error) {
        console.log('Error expiring rides: ', error);
    }
}