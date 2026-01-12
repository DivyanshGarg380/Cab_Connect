import redisClient from "../config/redis.js";
import { redisKeys } from "../utils/redisKeys.js";

export const saveOtp = async (email, otpHash) => {
    // opt vaoid 5mins
    await redisClient.setEx(redisKeys.otp(email), 300, otpHash);

    // cooldown 60sec
    await redisClient.setEx(redisKeys.otpCooldown(email), 60, "1");

    // reset attempts
    await redisClient.del(redisKeys.otpAttempts(email));
};

export const getOtpHash = async (email) => {
    return await redisClient.get(redisKeys.otp(email));
};

export const getCooldownLeft = async (email) => {
  return await redisClient.ttl(redisKeys.otpCooldown(email));
};

export const incrementOtpAttempts = async (email) => {
  const attempts = await redisClient.incr(redisKeys.otpAttempts(email));
  if (attempts === 1) {
    await redisClient.expire(redisKeys.otpAttempts(email), 300); // same as OTP expiry
  }
  return attempts;
};

export const clearOtp = async (email) => {
  await redisClient.del(redisKeys.otp(email));
  await redisClient.del(redisKeys.otpAttempts(email));
};