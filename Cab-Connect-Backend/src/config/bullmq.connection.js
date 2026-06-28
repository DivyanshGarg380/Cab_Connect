import IORedis from "ioredis";

export const connection = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
  // Keep BullMQ worker connections alive under load
  enableReadyCheck: false,
  // Larger command buffer for burst job ingestion
  commandTimeout: 5000,
});
