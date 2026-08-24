import cron from "node-cron";
import db from "../config/db.js";

// Runs every 30 minutes
function clearExpiredSessions() {
cron.schedule("0 0 * * *", async () => {
  try {
    const [result] = await db.query(`DELETE FROM sessions WHERE expires_at < NOW()`);
    if (result.affectedRows > 0) {
      console.log(`🧹 Cleaned ${result.affectedRows} expired sessions`);
    }
  } catch (err) {
    console.error("❌ Session cleanup failed:", err);
  }
});
}

function clearExpiredLoginAttempts() {
    

cron.schedule("*/30  * * * *", async () => {
    try{
 const [result] = await db.query(
        `DELETE FROM login_attempts 
         WHERE (blocked_until_ms IS NOT NULL AND blocked_until_ms < ?) 
         OR (blocked_until IS NOT NULL AND blocked_until < NOW())`,
        [Date.now()]
      );
        if (result.affectedRows > 0) {
            console.log(`🧹 Cleaned ${result.affectedRows} expired login attempts`);
        }
    } catch (err) {
        console.error("❌ Login attempt cleanup failed:", err);
    }
    });
}
export { clearExpiredSessions, clearExpiredLoginAttempts };