import redisClient from "../config/redis.js";

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
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.end(cached); 
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
        redisClient.setEx(key, ttl, serialized)
          .catch(e => console.error('Redis SET error:', e.message));
      }
      return originalJson(body);
    };

    next();
  };
};
