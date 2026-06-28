import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "../config/redis.js";

// Redis-backed store so limits are shared across all Node processes/workers.
// The default in-memory store resets on restart and doesn't work with clustering.
const makeRedisStore = (prefix) =>
  new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix,
  });

export const apiLimit = rateLimit({
  windowMs: 30 * 1000,
  max: 100,
  standardHeaders: true,   // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  store: makeRedisStore("rl:api:"),
  message: { message: "Too many requests, please try again later" },
  // Skip failed requests from counting against limit
  skipFailedRequests: true,
});

export const otpLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore("rl:otp:"),
  message: { message: "Too many OTP requests. Please wait." },
});
