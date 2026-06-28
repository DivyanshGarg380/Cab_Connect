import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) return new Error("Redis reconnect failed");
      return Math.min(retries * 100, 3000);
    },
    keepAlive: 5000,
    noDelay: true,
  },
});

redisClient.on("connect", () => console.log("Redis connected"));
redisClient.on("error", (err) => console.error("Redis.error:", err.message));
redisClient.on("reconnecting", () => console.log("Redis reconnecting..."));

export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) await redisClient.connect();
  } catch (err) {
    console.error("Redis connection failed:", err.message);
    throw err;
  }
};

export default redisClient;
