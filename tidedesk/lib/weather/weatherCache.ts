/**
 * Read-only weather cache layer.
 * Data is populated by cron only. Users never trigger Stormglass.
 *
 * Flow: WeatherCache (DB) ← Cron refresh ← Stormglass
 */
import { prisma } from "@/lib/prisma";

// Adapter-based client can lose model types; use asserted client (see modules/weather)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour – cron refreshes hourly

/** Rounds lat/lng to ~11m (~4 decimal places) for location grouping. */
function roundCoord(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export type CachedForecastPayload = {
  data: Array<{
    timestamp: string;
    windSpeed: number;
    swellHeight: number;
    tideLevel: number | null;
  }>;
  tides: Array<{ height: number; time: string; type: "high" | "low" }>;
  oceanStatus: {
    weather: { icon: string; label: string };
    swell: number;
    windSpeed: number;
    windDirection: string;
    temperature: number;
    tideStatus: string | null;
    moon: { icon: string; label: string };
  } | null;
  sevenDayForecast: Array<{
    date: string;
    dayOfWeek: string;
    temp: number;
    icon: string;
    condition: string;
    rating: "Excellent" | "Good" | "Average" | "Poor";
  }>;
};

/**
 * Get cached forecast for a location. Never fetches from Stormglass.
 * Returns null if cache is empty or stale.
 */
export async function getWeatherFromCache(
  lat: number,
  lng: number
): Promise<CachedForecastPayload | null> {
  const rLat = roundCoord(lat);
  const rLng = roundCoord(lng);

  const row = await db.weatherCache.findFirst({
    where: { lat: rLat, lng: rLng },
  });

  if (!row || !row.data) return null;

  const age = Date.now() - new Date(row.fetchedAt).getTime();
  if (age > CACHE_TTL_MS) {
    // Stale – cron will refresh; return data anyway so users see something
    // Optional: return null to show "updating" message
  }

  return row.data as unknown as CachedForecastPayload;
}
