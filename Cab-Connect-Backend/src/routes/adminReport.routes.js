import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import adminMiddleware from "../middleware/admin.middleware.js";
import { getAllReports } from "../controllers/adminReport.controller.js";

const router = express.Router();

/*
  Admin inbox - view all reports
*/

router.get("/", authMiddleware, adminMiddleware, getAllReports);

export default router;
