import Report from "../models/Report.model.js";

export const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "email")
      .populate("reportedUser", "email")
      .populate("ride", "date destination departureTime")
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (error) {
    console.error("Admin get reports error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
