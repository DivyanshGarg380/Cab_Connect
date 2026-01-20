import { rideExpiryQueue } from "../queues/rideExpiry.queue.js";

export const cancelRideExpiryJob = async (rideId) => {
    const jobId = `ride-expire-${rideId}`;
    const job = await rideExpiryQueue.getJob(jobId);
    if(job) await job.remove();
};