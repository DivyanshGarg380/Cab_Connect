import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "../config/redis.js";

const makeRedisStore = (prefix) =>
  new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix,
});

export const apiLimit = rateLimit({
  windowMs: 30 * 1000,
  max: 100,
  standardHeaders: true,  
  legacyHeaders: false,
  store: makeRedisStore("rl:api:"),
  message: { message: "Too many requests, please try again later" },
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
