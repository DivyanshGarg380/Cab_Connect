import Report from "../models/Report.model.js";
import Ride from "../models/Ride.model.js";
import User from "../models/User.model.js";
import Notification from "../models/Notification.model.js";
import { io } from "../server.js";

export const createReport = async (req, res) => {
    try{
        const { rideId, reportedUserEmail, description } = req.body;
        const reporterId = req.userId;

        if (!reporterId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if(!rideId || !reportedUserEmail || !description){
            return res.status(400).json({ message: "Missing required fields" });
        }

        if(description.length > 30){
            return res.status(400).json({
                message: "Description must be only 30 characters",
            });
        }

        const ride = await Ride.findById(rideId).populate("participants");
        
        if(!ride){
            return res.status(404).json({ message: "Ride not found" });
        }

        // reporter is a part of the ride ofc
        if(!ride.participants.some(p => p._id.toString() === reporterId)){
            return res.status(403).json({
                message: "You are not part of this ride",
            });
        }

        const reportedUser = await User.findOne({
            email: reportedUserEmail.toLowerCase(),
        });

        if(!reportedUser){
            return res.status(404).json({ message: "Reported user not found" });
        }

        // reporter must be in the same ride ofc :)
        if(
            !ride.participants.some(
                p => p._id.toString() === reportedUser._id.toString()
            )
        ){
            return res.status(400).json({
                message: "Reported user was not part of this ride",
            });
        }

        if(reportedUser._id.toString() === reporterId){
            return res.status(400).json({
                message: "You cannot report yourself :)",
            });
        }

        const report = await Report.create({
            reporter: reporterId,
            reportedUser: reportedUser._id,
            ride: ride._id,
            rideDate: ride.date,
            destination: ride.destination,
            description,
        });

        const admins = await User.find({ role: "admin" });

        for(const admin of admins){
            await Notification.create({
                user: admin._id,
                message: "New user report submitted. Review required.",
            });

            io.to(admin._id.toString()).emit("admin-notification", {
                message: "New user report submitted",
            });
        }

        return res.status(201).json({
            message: "Report submitted successfully",
            reportId: report._id,
        });

    }catch(err){
        if(err.code === 11000){
            return res.status(409).json({
                message: "You have already reported this user for this ride",
            });     
        }
        console.error("Create report error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}