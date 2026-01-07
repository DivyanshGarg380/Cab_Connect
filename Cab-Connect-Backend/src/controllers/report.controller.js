import Report from "../models/Report.model.js";
import Ride from "../models/Ride.model.js";
import User from "../models/User.model.js";

export const createReport = async (req, res) => {
    try{

        const { rideId, reportedUserEmail, description } = req.body;
        const reportedId = req.userId;

        if(!rideId || !reportedUserEmail || !description){
            return res.status(400).json({ message: "Missing required fields" });
        }

        if(description.length < 30){
            return res.status(400).json({
                message: "Description must be atleast 30 characters",
            });
        }

        const ride = await Ride.findById(rideId).populate("participants");
        if(!ride){
            return res.status(404).json({ message: "Ride not found" });
        }

        // reporter is a part of the ride ofc
        if(!ride.participants.some(p => p._id.toString() === reportedId)){
            return res.status(403).json({
                message: "You are not part of this ride",
            });
        }
        const reportedUser = await User.findOne({
            email: reportedUserEmail.toLowercase(),
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

        if(reportedUser._id.toString() === reportedId){
            return res.status(400).json({
                message: "You cannot report yourself :)",
            });
        }

        const report = await Report.create({
            report: reportedId,
            reportedUser: reportedUser._id,
            ride: ride._id,
            rideDate: ride.date,
            destination: ride.destination,
            description,
        });

        return res.status(201).json({
            message: "Report submitted successfully",
            reportId: report._id,
        });

    }catch(err){
        if(err.code === 11000){
            return res.status(409).json({
                message: "You have already reported a user for this ride",
            });     
        }
        console.error("Create report error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}