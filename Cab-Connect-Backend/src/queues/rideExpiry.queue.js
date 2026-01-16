import { Queue } from "bullmq";
import { connection } from "../config/bullmq.connection.js";

export const rideExpiryQueue = new Queue("ride-expiry", {
    connection,
});

