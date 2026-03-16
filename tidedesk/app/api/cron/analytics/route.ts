import { NextRequest } from "next/server";
import { runAnalyticsJob } from "@/jobs/analyticsJob";

/**
 * Vercel Cron – computes daily analytics for all businesses.
 * Runs at 02:00 UTC daily.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAnalyticsJob();
    return Response.json(result);
  } catch (err) {
    console.error("Analytics cron error:", err);
    return Response.json({ error: "Job failed" }, { status: 500 });
  }
}
