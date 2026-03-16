/**
 * Cron-only weather refresh. The ONLY place that calls Stormglass for forecast data.
 * Populates WeatherCache so user requests never hit the API.
 *
 * Flow: Cron → refreshWeatherForLocation → Stormglass → WeatherCache
 */
import { prisma } from "@/lib/prisma";
import {
  fetchWeatherForecast,
  fetchTideExtremes,
  fetchSevenDayWeather,
  type TideExtreme,
} from "@/integrations/stormglass";
import { aggregateSevenDay } from "@/lib/weather/aggregateSevenDay";
import { deriveCondition } from "@/lib/weather/deriveCondition";
import { getWeatherIcon } from "@/lib/weather/getWeatherIcon";
import { getTideStatus } from "@/lib/weather/tideStatus";
import { getMoonPhase } from "@/lib/astronomy/getMoonPhase";
import { degreesToCardinal } from "@/lib/weather/windDirection";
import type { CachedForecastPayload } from "@/lib/weather/weatherCache";

// Adapter-based client can lose model types; use asserted client (see modules/weather)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

function roundCoord(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * Fetch from Stormglass and upsert WeatherCache.
 * Call this ONLY from the cron job.
 */
export async function refreshWeatherForLocation(
  lat: number,
  lng: number
): Promise<{ ok: boolean; error?: string }> {
  const rLat = roundCoord(lat);
  const rLng = roundCoord(lng);

  try {
    const [marinePoints, tides, sevenDayHours] = await Promise.all([
      fetchWeatherForecast(lat, lng, 24),
      fetchTideExtremes(lat, lng),
      fetchSevenDayWeather(lat, lng),
    ]);

    const data = marinePoints.map((p) => ({
      timestamp: p.timestamp,
      windSpeed: p.windSpeed,
      swellHeight: p.swellHeight,
      tideLevel: p.tideLevel,
    }));

    const firstHour = sevenDayHours[0];
    const oceanStatus = firstHour
      ? {
          weather: {
            icon: getWeatherIcon(
              deriveCondition(firstHour.cloudCover, firstHour.precipitation)
            ),
            label: deriveCondition(
              firstHour.cloudCover,
              firstHour.precipitation
            )
              .split(" ")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" "),
          },
          swell: firstHour.swellHeight,
          windSpeed: firstHour.windSpeed,
          windDirection: degreesToCardinal(firstHour.windDirection),
          temperature: Math.round(firstHour.airTemperature),
          tideStatus: getTideStatus(tides as TideExtreme[]),
          moon: getMoonPhase(new Date()),
        }
      : null;

    const sevenDayForecast = aggregateSevenDay(sevenDayHours);

    const payload: CachedForecastPayload = {
      data,
      tides: tides.map((t) => ({ height: t.height, time: t.time, type: t.type })),
      oceanStatus,
      sevenDayForecast,
    };

    const existing = await db.weatherCache.findFirst({
      where: { lat: rLat, lng: rLng },
    });

    if (existing) {
      await db.weatherCache.update({
        where: { id: existing.id },
        data: { data: payload, fetchedAt: new Date() },
      });
    } else {
      await db.weatherCache.create({
        data: {
          lat: rLat,
          lng: rLng,
          data: payload,
          fetchedAt: new Date(),
        },
      });
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Weather cache refresh error:", msg);
    return { ok: false, error: msg };
  }
}

/**
 * Get all unique (lat, lng) from businesses with coordinates.
 * Rounded to ~11m so nearby schools share one cache entry.
 */
export async function getUniqueWeatherLocations(): Promise<
  Array<{ lat: number; lng: number }>
> {
  const businesses = await prisma.business.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
    select: { latitude: true, longitude: true },
  });

  const seen = new Set<string>();
  const locations: Array<{ lat: number; lng: number }> = [];

  for (const b of businesses) {
    const lat = b.latitude ? Number(b.latitude) : null;
    const lng = b.longitude ? Number(b.longitude) : null;
    if (lat == null || lng == null) continue;

    const rLat = roundCoord(lat);
    const rLng = roundCoord(lng);
    const key = `${rLat},${rLng}`;
    if (seen.has(key)) continue;
    seen.add(key);
    locations.push({ lat: rLat, lng: rLng });
  }

  return locations;
}
