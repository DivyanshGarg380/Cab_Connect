import express from 'express'
import Ride from "../models/Ride.model.js"
import Notification from "../models/Notification.model.js"
import authMiddleware from "../middleware/auth.middleware.js"

const router = express.Router();

