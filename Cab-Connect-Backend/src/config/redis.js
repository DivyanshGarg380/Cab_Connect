import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) return new Error("Redis reconnect failed");
      return Math.min(retries * 200, 2000);
    },
  },
});

redisClient.on("connect", () => console.log("Redis connected "));
redisClient.on("error", (err) => console.error("Redis.error: ", err));

export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) await redisClient.connect();
  } catch (err) {
    console.log("Redis connection skipped (Redis not running)");
  }
};

export default redisClient;
