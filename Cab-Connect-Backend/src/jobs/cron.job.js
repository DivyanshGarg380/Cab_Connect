import cron from "node-cron";
import { expireOldRides } from "./deleteExpiredRides.job.js";
import { deleteExpiredRides } from "./expireRides.job.js";

export const startCronJobs = () => {
  
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("[CRON] Running expireOldRides...");
      await expireOldRides();
    } catch (err) {
      console.error("[CRON] expireOldRides failed:", err.message);
    }
  });

  cron.schedule("*/30 * * * *", async () => {
    try {
      console.log("[CRON] Running deleteExpiredRides...");
      await deleteExpiredRides();
    } catch (err) {
      console.error("[CRON] deleteExpiredRides failed:", err.message);
    }
  });

  console.log("Cron jobs scheduled");
};
