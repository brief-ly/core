import { db } from "@/api/lib/data/db";
import { REQUEST_STATUS } from "@/api/lib/constants";

export const expireOldRequests = () => {
  try {
    const now = new Date().toISOString();

    const result = db
      .query(
        `
      UPDATE group_requests 
      SET status = ?, completed_at = CURRENT_TIMESTAMP 
      WHERE status = ? AND expires_at < ?
    `
      )
      .run(REQUEST_STATUS.EXPIRED, REQUEST_STATUS.PENDING, now);

    if (result.changes > 0) {
      console.log(`Expired ${result.changes} old requests`);
    }
  } catch (error) {
    console.error("Error expiring old requests:", error);
  }
};

export const startRequestExpirationJob = () => {
  console.log("Starting request expiration job...");

  setInterval(() => {
    expireOldRequests();
  }, 60 * 1000);

  expireOldRequests();
};
