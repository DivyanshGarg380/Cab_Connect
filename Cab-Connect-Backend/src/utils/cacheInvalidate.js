import redisClient from "../config/redis.js";

// SCAN + DEL in a single pipeline pass instead of multiple round-trips
async function delByPattern(pattern) {
  if (!redisClient.isOpen) return;

  const keysToDelete = [];
  let cursor = 0;

  // Collect all matching keys first
  do {
    const result = await redisClient.scan(cursor, {
      MATCH: pattern,
      COUNT: 200, // larger COUNT = fewer round-trips
    });
    cursor = result.cursor;
    keysToDelete.push(...result.keys);
  } while (cursor !== 0);

  if (keysToDelete.length === 0) return;

  // Delete in a single pipeline call (one network round-trip)
  const pipeline = redisClient.multi();
  for (const key of keysToDelete) pipeline.del(key);
  await pipeline.exec();
}

export const invalidateRideCache = async (rideId) => {
  if (!redisClient.isOpen) return;

  try {
    // Pipeline the known-key deletes — one round-trip instead of 3
    const pipeline = redisClient.multi();
    pipeline.del("rides:all");
    if (rideId) {
      pipeline.del(`rides:${rideId}`);
      pipeline.del(`rides:${rideId}:messages`);
    }
    await pipeline.exec();

    // Pattern scan is separate (can't pipeline SCAN)
    await delByPattern("rides:suggestions:*");
  } catch (err) {
    console.error("Redis cache invalidate error:", err.message);
  }
};

export const invalidateRideMessagesCache = async (rideId) => {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.del(`rides:${rideId}:messages`);
  } catch (err) {
    console.error("Redis message cache invalidate error:", err.message);
  }
};
