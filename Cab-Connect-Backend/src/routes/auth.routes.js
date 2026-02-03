import express from 'express';
import bcrypt from 'bcrypt';
import { generateOtp } from '../utils/generateOtp.js';
import User from '../models/User.model.js';
import { generateRefreshToken, generateAccessToken } from '../utils/token.js';
import  jwt  from 'jsonwebtoken';
import { otpLimit } from '../middleware/rateLimit.middleware.js';
import authMiddleware from "../middleware/auth.middleware.js";
import { saveOtp, getOtpHash, getCooldownLeft, incrementOtpAttempts, clearOtp } from "../services/otpRedis.service.js";
import { sendOtpEmail } from "../EmailService/sendOtpEmail.js";

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication APIs
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *             required: [name, email, password]
 *     responses:
 *       201:
 *         description: User registered
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *             required: [email, password]
 *     responses:
 *       200:
 *         description: Logged in
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out
 */

const router = express.Router();

router.post('/request-otp', otpLimit ,  async (req, res) => {
    try {
        let { email } = req.body;
        if(!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        email  = email.trim().toLowerCase();
        const collegeEmailRegex = new RegExp(
            '^[a-z0-9._%+-]+@learner\\.manipal\\.edu$'
        );
        // strict college email check
        if (!collegeEmailRegex.test(email)) {
            return res.status(400).json({ message: 'College email required' });
        }
        // prevent OTP spam (cooldown)
        const cooldownLeft = await getCooldownLeft(email);
        if (cooldownLeft > 0) {
          return res.status(429).json({
            message: `Please wait ${cooldownLeft} seconds before requesting a new OTP`,
          });
        }

        const otpCode = generateOtp();
        const hashedOtp = await bcrypt.hash(otpCode, 10);

        await saveOtp(email, hashedOtp);

        //await sendOtpEmail(email, otpCode);

        console.log(`OTP for ${email}: ${otpCode}`);

        res.json({ message: 'OTP sent successfully' });

    }catch (error) {
        console.error('Error in /request-otp:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/verify-otp', async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email and OTP are required',
      });
    }

    email = email.trim().toLowerCase();

    const otpHash = await getOtpHash(email);

    if (!otpHash) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
        code: "OTP_EXPIRED",
      });
    }

    const isValid = await bcrypt.compare(String(otp), otpHash);

    if (!isValid) {
      const attempts = await incrementOtpAttempts(email);

      if (attempts >= 3) {
        await clearOtp(email);
        return res.status(403).json({
          message:
            "OTP expired due to too many incorrect attempts. Please request a new OTP.",
          code: "OTP_ATTEMPTS_EXCEEDED",
        });
      }

      return res.status(401).json({
        message: `Invalid OTP. You have ${3 - attempts} attempt(s) left.`,
      });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { $set: { isVerified: true } },
      { upsert: true, new: true }
    );

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    await clearOtp(email);

    return res.json({
      message: 'OTP verified successfully',
      userId: user._id,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Error in /verify-otp:', error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
});

router.post('/refresh', async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }
    
    try {
        const decoded  = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const newAccessToken = generateAccessToken(decoded.userId);
        res.json({ accessToken: newAccessToken });
    }catch (error) {
        console.error('Error in /refresh:', error);
        res.status(403).json({ message: 'Invalid refresh token' });
    }
})

router.post('/admin-login', authMiddleware, async (req, res)=> {
    const adminPassword = req.body?.adminPassword;
    console.log(adminPassword);
    if(!adminPassword){
        return res.status(400).json({
            message: 'Admin password required',
        });
    }
    
    if(adminPassword !== process.env.ADMIN_PASSWORD){
        return res.status(403).json({
            message: 'Invalid admin credentials',
        });
    }

    await User.findByIdAndUpdate(req.userId,{
        role: 'admin',
    });

    res.json({
        message: 'Admin access granted',
    });
});

router.get('/me', authMiddleware, async (req, res) => {
    try {
    const user = await User.findById(req.userId).select(
      '_id email role'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('/auth/me error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
