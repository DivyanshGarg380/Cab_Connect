import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { createReport } from "../controllers/report.controller.js";

const router = express.Router();

router.post("/", authMiddleware, createReport);

export default router;