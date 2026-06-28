import { Worker } from "bullmq";
import { connection } from "../config/bullmq.connection.js";
import Ride from "../models/Ride.model.js";
import Message from "../models/Message.model.js";
import Notification from "../models/Notification.model.js";
import { invalidateRideCache } from "../utils/cacheInvalidate.js";

export const rideExpiryWorker = new Worker(
  "ride-expiry",
  async (job) => {
    const { rideId } = job.data;

    const ride = await Ride.findOneAndUpdate(
      { _id: rideId, status: { $ne: "expired" } },
      { $set: { status: "expired" } },
      { new: true, lean: true }
    );

    if (!ride) return;

    await Promise.all([
      Message.deleteMany({ ride: rideId }),
      invalidateRideCache(rideId.toString()),
    ]);

    const { default: app } = await import('../app.js');
    const io = app.get('io');

    if (io) {
      io.to(rideId.toString()).emit("ride-ended", { message: "Ride expired automatically" });
      io.to('rides:list').emit("ride:updated", { rideId: rideId.toString(), type: "expired", ride: null });

      const notifDocs = ride.participants.map(userId => ({
        user: userId,
        message: `Ride to ${ride.destination} expired automatically.`,
        type: "ride",
        meta: { rideId: rideId.toString(), destination: ride.destination },
      }));

      const notifs = await Notification.insertMany(notifDocs, { lean: true });

      notifs.forEach((notif, i) => {
        io.to(ride.participants[i].toString()).emit("notification:new", notif);
      });
    }
  },
  {
    connection,
    concurrency: 5,
  }
);
