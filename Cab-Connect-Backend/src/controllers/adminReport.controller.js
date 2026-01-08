import Report from "../models/Report.model.js";
import User from "../models/User.model.js";
import Notification from "../models/Notification.model.js";
import { io } from "../server.js";

export const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "email")
      .populate("reportedUser", "email")
      .populate("ride", "date destination departureTime")
      .populate("reportedUser", "email banCount isPermanantlyBanned banUntil")
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (error) {
    console.error("Admin get reports error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const takeActionOnReport = async (req, res) => {
  try{
    const { reportId } = req.params;
    const { action, adminNote } = req.body;
    
    if(!action){
      return res.status(400).json({
        message: "Action is Required"
      });
    }

    const report = await Report.findById(reportId);
    if(!report){
      return res.status(404).json({
        message: "Report not found"
      });
    }

    // preventing double action 
    if(report.status === 'action_taken' || report.status === "dismissed"){
      return res.status(400).json({
        message: "Action already taken on this report",
      });
    }

    // dismiss

    if(action == "dismiss"){
      report.status = "dismissed";
      report.adminNote = adminNote || "";
      await report.save();

      await Notification.create({
        user: report.reporter,
        message: "Your report has been reviewed and dismissed by admin.",
      });

      io.to(report.reporter.toString()).emit("user-notification", {
        message: "Your report was dismissed",
      });

      return res.json({
        message: "Report dismissed"
      });
    }

    // Ban user ( 1 report => 1 strike ( 1/3))
    if(action == "ban"){
      const user = await User.findById(report.reportedUser);

      if(!user){
        return res.status(404).json({ message: "Reported user not found" });
      }

      user.banCount += 1;

      if(user.banCount >= 3){
        user.isPermanantlyBanned = true;
        user.banUntil = null;
      }else{
        user.banUntil = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        );
      }

      await user.save();

      report.status = "action_taken";
      report.adminNote = adminNote || "User banned based on report";
      await report.save();

      await Notification.create({
        user: report.reporter,
        message: "Your report was reviewed and the reported user has been banned."
      });

      io.to(report.reporter.toString()).emit("user-notification", {
        message: "Admin took action on your report",
      });

      await Notification.create({
        user: user._id,
        message: user.isPermanantlyBanned
            ? "You have been permanently banned due to policy violations."
            : "You have been termporarily banned for 7 days due to policy violations.",
      });

      io.to(user._id.toString()).emit("user-notification", {
        message: "Admin action taken on your account",
      });

      return res.json({
        message: user.isPermanantlyBanned 
          ? "User permanently banned"
          : "User banned for 7 days",
          banCount: user.banCount,
      });
    }
    return res.status(400).json({ message: "Invalid action type" });
  }catch (error) {
    console.error("Admin report action error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
