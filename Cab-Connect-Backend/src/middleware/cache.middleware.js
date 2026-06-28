import redisClient from "../config/redis.js";

// Pre-serialize common headers to avoid repeated work
const CACHE_HIT_HEADER  = 'HIT';
const CACHE_MISS_HEADER = 'MISS';

export const cache = (keyBuilder, ttl = 60) => {
  return async (req, res, next) => {
    if (!redisClient.isOpen) return next();

    const key = typeof keyBuilder === "function" ? keyBuilder(req) : keyBuilder;

    try {
      const cached = await redisClient.get(key);
      if (cached) {
        res.setHeader('X-Cache', CACHE_HIT_HEADER);
        // setHeader + end in one shot — avoids double-write overhead
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.end(cached); // send raw string — skip JSON.parse + re-stringify
      }
    } catch (e) {
      console.error('Redis GET error:', e.message);
      return next();
    }

    res.setHeader('X-Cache', CACHE_MISS_HEADER);

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode < 400) {
        const serialized = JSON.stringify(body);
        // Fire-and-forget: don't await, don't block response
        redisClient.setEx(key, ttl, serialized)
          .catch(e => console.error('Redis SET error:', e.message));
      }
      return originalJson(body);
    };

    next();
  };
};
