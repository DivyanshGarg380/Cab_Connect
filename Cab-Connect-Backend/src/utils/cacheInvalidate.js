import redisClient from "../config/redis.js";

async function delByPattern(pattern) {
  if(!redisClient.isOpen) return;
  let cursor = "0";

  do {
    const { cursor: nextCursor, keys } = await redisClient.scan(cursor, {
      MATCH: pattern,
      COUNT: 100,
    });

    cursor = nextCursor;

    if(keys.length){
      await redisClient.del(keys);
    }
  }while(cursor !== "0");
}

export const invalidateRideCache = async (rideId) => {
  try {
    if (!redisClient.isOpen) return;

    await redisClient.del("rides:all");

    if (rideId) {
      await redisClient.del(`rides:${rideId}`);
      await redisClient.del(`rides:${rideId}:messages`);
    }

    await delByPattern("rides:suggestions:*");

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
