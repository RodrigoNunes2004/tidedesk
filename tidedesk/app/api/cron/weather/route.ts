import { NextRequest } from "next/server";
import { runWeatherJob } from "@/jobs/weatherJob";

/**
 * Vercel Cron – fetches weather, caches it, sends WEATHER_ALERT when conditions warrant.
 * Configure in vercel.json. Runs every 6 hours to stay within Stormglass free tier.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runWeatherJob();
    return Response.json(result);
  } catch (err) {
    console.error("Weather job error:", err);
    return Response.json({ error: "Job failed" }, { status: 500 });
  }
}
