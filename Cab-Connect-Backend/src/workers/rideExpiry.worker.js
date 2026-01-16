import { Worker } from "bullmq";
import { connection } from "../config/bullmq.connection.js";
import Ride from "../models/Ride.model.js";
import Message from "../models/Message.model.js";
import { io } from "../server.js";
import Notification from "../models/Notification.model.js";
import { invalidateRideCache } from "../utils/cacheInvalidate.js";

export const rideExpiryWorker = new Worker(
    "ride-expiry",
    async (job) => {
        const { rideId } = job.data;
        const ride = await Ride.findById(rideId);
        if(!ride) return;

        // mark expired
        ride.status = "expired";
        await ride.save();

        await Message.deleteMany({ ride: rideId });
        await invalidateRideCache(rideId.toString());

        // notifyinf users now ( socket )
        io.to(rideId.toString().emit("ride-ended", {
            message: "Ride expired automatically",
        }));

        io.emit("ride:updated", {
            rideId: rideId.toString(),
            type: "expired",
            ride: null,
        });

        for(const userId of ride.participants){
            await Notification.create({
                user: userId,
                message: `Ride to ${ride.destination} expired automatically.`,
            });

            io.to(userId.toString()).emit("notification:new", {
                message: `Ride to ${ride.destination} expired automatically.`,
            });
        }
    },
    { connection }
);