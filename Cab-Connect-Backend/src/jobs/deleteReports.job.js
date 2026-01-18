import Report from "../models/Report.model.js";

export const deleteReports = async() => {
    const cutoff = new Date(Date.now() - 24*60*60*1000);
    const result = await Report.deleteMany({
        status: { $in: ["action_taken", "dismissed"] },
        updatedAt: { $lte: cutoff },
    });

    console.log(`[CRON] Deleted ${result.deletedCount} resolved reports`);
}