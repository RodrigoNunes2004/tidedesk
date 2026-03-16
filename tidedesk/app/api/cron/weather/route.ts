import { NextRequest } from "next/server";
import {
  refreshWeatherForLocation,
  getUniqueWeatherLocations,
} from "@/lib/weather/refreshWeatherCache";
import { runWeatherJob } from "@/jobs/weatherJob";

/**
 * Vercel Cron – refreshes WeatherCache (Stormglass), then sends WEATHER_ALERT when warranted.
 * Runs hourly. Users never trigger Stormglass; all pages read cached data.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Warm cache for all unique locations (only Stormglass calls happen here)
    const locations = await getUniqueWeatherLocations();
    let refreshed = 0;
    for (const loc of locations) {
      const result = await refreshWeatherForLocation(loc.lat, loc.lng);
      if (result.ok) refreshed++;
    }

    // 2. Send alerts from cached data (no API calls)
    const alertResult = await runWeatherJob();

    return Response.json({
      locations: locations.length,
      refreshed,
      ...alertResult,
    });
  } catch (err) {
    console.error("Weather cron error:", err);
    return Response.json({ error: "Job failed" }, { status: 500 });
  }
}
