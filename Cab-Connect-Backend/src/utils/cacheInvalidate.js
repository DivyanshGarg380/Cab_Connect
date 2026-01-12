import redisClient from "../config/redis.js";

export const invalidateRideCache = async (rideId) => {
  try {
    // all rides list cache
    await redisClient.del("rides:all");

    if (rideId) {
      await redisClient.del(`rides:${rideId}`);
      await redisClient.del(`rides:${rideId}:messages`);
    }
  } catch (err) {
    console.log("Redis cache invalidate error:", err.message);
  }
};
