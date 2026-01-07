import Ride from "../models/Ride.model.js";
import { io } from "../server.js";


export const expireOldRides = async () => {
    try{
        const now = new Date();

        const ridesToExpire  = await Ride.find(
            {
                departureTime : { $lt: now },
                status: { $ne: 'expired' },
            }
        );

        for(const ride of ridesToExpire){
            ride.status = "expired";
            await ride.save();

            io.emit("ride:updated", {
                rideId: ride._id.toString(),
                type: "expire",
                ride,
            });

            io.to(ride._id.toString()).emit("ride:updated", {
                rideId: ride._id.toString(),
                type: "expire",
                ride,
            });
        }
        if (ridesToExpire.length > 0) {
            console.log(`Expired ${ridesToExpire.length} ride(s)`);
        }
    } catch (error) {
        console.log('Error expiring rides: ', error);
    }
}