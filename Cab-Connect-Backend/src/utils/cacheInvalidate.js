import redisClient from "../config/redis.js";

export const invalidateRideCache = async (rideId) => {
  try {
    if (!redisClient.isOpen) return;

    await redisClient.del("rides:all");

    if (rideId) {
      await redisClient.del(`rides:${rideId}`);
      await redisClient.del(`rides:${rideId}:messages`);
    }

    const suggestionKeys = await redisClient.keys("rides:suggestions:*");
    if(suggestionKeys.length){
      await redisClient.del(suggestionKeys);
    }

  } catch (err) {
    console.log("Redis cache invalidate error:", err.message);
  }
};

export const invalidateRideMessagesCache = async (rideId) => {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.del(`rides:${rideId}:messages`);
  } catch (err) {
    console.log("Redis message cache invalidate error:", err.message);
  }
};
