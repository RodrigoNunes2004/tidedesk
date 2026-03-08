import { NextRequest } from "next/server";
import { runNotificationJob } from "@/jobs/notificationJob";

/**
 * Vercel Cron – sends booking reminders (24h before).
 * Configure in vercel.json: "crons": [{ "path": "/api/cron/notifications", "schedule": "0 * * * *" }]
 * Runs every hour; job filters to bookings starting in next 24h.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runNotificationJob();
    return Response.json(result);
  } catch (err) {
    console.error("Notification job error:", err);
    return Response.json({ error: "Job failed" }, { status: 500 });
  }
}
