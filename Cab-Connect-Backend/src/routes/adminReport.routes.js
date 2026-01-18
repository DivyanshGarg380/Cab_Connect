import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import adminMiddleware from "../middleware/admin.middleware.js";
import { getAllReports, takeActionOnReport, getReportChat} from "../controllers/adminReport.controller.js";

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: AdminReports
 *   description: Admin reports APIs
 */

/**
 * @swagger
 * /admin/reports:
 *   get:
 *     summary: Get all reports (admin)
 *     tags: [AdminReports]
 *     responses:
 *       200:
 *         description: Reports list
 */

/**
 * @swagger
 * /admin/reports/{reportId}/resolve:
 *   post:
 *     summary: Resolve report (admin)
 *     tags: [AdminReports]
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Resolved
 */


/*
  Admin inbox - view all reports
*/

router.get("/", authMiddleware, adminMiddleware, getAllReports);

/*
  Admin Action on Report
*/

router.patch("/:reportId", authMiddleware, adminMiddleware, takeActionOnReport);
router.get("/:reportId/chat", authMiddleware, adminMiddleware, getReportChat);


export default router;
