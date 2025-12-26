import rateLimit from "express-rate-limit";

export const apiLimit = rateLimit({
    windowMs:  15 * 60 * 1000,
    max: 100,
    message: {
        message: 'Too mny requests, Please try again later',
    },
});

export const otpLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: {
        message: 'Too many OTP requests. Please wait.',
    },
});