export const redisKeys = {
  otp: (email) => `otp:${email}`,
  otpCooldown: (email) => `otp:cooldown:${email}`,
  otpAttempts: (email) => `otp:attempts:${email}`,
};
