import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { createReport } from "../controllers/report.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: User reports APIs
 */

/**
 * @swagger
 * /reports:
 *   post:
 *     summary: Create a report
 *     tags: [Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportedUserId: { type: string }
 *               reason: { type: string }
 *             required: [reportedUserId, reason]
 *     responses:
 *       201:
 *         description: Report created
 */

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: Get my reports
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Reports fetched
 */


router.post("/", authMiddleware, createReport);

export default router;