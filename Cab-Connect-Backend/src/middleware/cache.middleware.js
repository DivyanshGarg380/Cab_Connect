import redisClient from "../config/redis.js";

export const cache = (keyBuilder, ttl = 60) => {
  return async (req, res, next) => {
    try {
      if (!redisClient.isOpen) return next();

      const key = typeof keyBuilder === "function" ? keyBuilder(req) : keyBuilder;

      const cached = await redisClient.get(key);

      if (cached) {
        try {
          return res.status(200).json(JSON.parse(cached));
        } catch (e) {
          await redisClient.del(key);
        }
      }

      const originalJson = res.json.bind(res);
      res.json = async (body) => {
        try {
          if (res.statusCode >= 400) return originalJson(body);

          await redisClient.setEx(key, ttl, JSON.stringify(body));
        } catch (e) {
          console.log("Redis cache set error:", e.message);
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.log("Redis Middleware Error:", err?.message || err);
      return next();
    }
  };
};
