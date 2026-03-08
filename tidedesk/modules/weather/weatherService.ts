/**
 * Weather service – fetches marine weather from Stormglass, caches in WeatherSnapshot.
 */
import { prisma } from "@/lib/prisma";
import { fetchWeatherForecast, type WeatherPoint } from "@/integrations/stormglass";

// Adapter-based client loses some model types in IDE; use asserted client (see prisma/seed.ts)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export type WeatherSnapshotRow = {
  windSpeed: number;
  swellHeight: number;
  tideLevel: number | null;
  timestamp: Date;
};

export async function getCachedOrFetchWeather(
  businessId: string,
  lat: number,
  lng: number,
  hours = 24
): Promise<WeatherSnapshotRow[]> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - CACHE_TTL_MS);

  const cached = await db.weatherSnapshot.findMany({
    where: {
      businessId,
      latitude: lat,
      longitude: lng,
      timestamp: { gte: now },
    },
    orderBy: { timestamp: "asc" },
    take: hours,
  });

  const hasRecentCache = cached.some(
    (s: { createdAt: Date }) => new Date(s.createdAt) > cutoff
  );

  if (cached.length >= Math.min(hours, 24) && hasRecentCache) {
    return cached.map((s: { windSpeed: unknown; swellHeight: unknown; tideLevel: unknown; timestamp: Date }) => ({
      windSpeed: Number(s.windSpeed),
      swellHeight: Number(s.swellHeight),
      tideLevel: s.tideLevel != null ? Number(s.tideLevel) : null,
      timestamp: s.timestamp,
    }));
  }

  const points = await fetchWeatherForecast(lat, lng, hours);
  if (points.length === 0) {
    return cached.map((s: { windSpeed: unknown; swellHeight: unknown; tideLevel: unknown; timestamp: Date }) => ({
      windSpeed: Number(s.windSpeed),
      swellHeight: Number(s.swellHeight),
      tideLevel: s.tideLevel != null ? Number(s.tideLevel) : null,
      timestamp: s.timestamp,
    }));
  }

  await db.weatherSnapshot.createMany({
    data: points.map((p) => ({
      businessId,
      latitude: lat,
      longitude: lng,
      windSpeed: p.windSpeed,
      swellHeight: p.swellHeight,
      tideLevel: p.tideLevel,
      timestamp: new Date(p.timestamp),
    })),
    skipDuplicates: true,
  });

  return points.map((p) => ({
    windSpeed: p.windSpeed,
    swellHeight: p.swellHeight,
    tideLevel: p.tideLevel,
    timestamp: new Date(p.timestamp),
  }));
}

/** Build a human-readable weather alert message for dangerous conditions. */
export function buildWeatherAlertMessage(
  point: WeatherSnapshotRow,
  businessName?: string
): string {
  const parts: string[] = [];
  if (point.windSpeed >= 25) {
    parts.push(`strong wind ${point.windSpeed.toFixed(0)}kt`);
  }
  if (point.swellHeight >= 2) {
    parts.push(`swell ${point.swellHeight.toFixed(1)}m`);
  }
  const prefix = businessName ? `${businessName}: ` : "";
  if (parts.length > 0) {
    return `${prefix}Weather alert – ${parts.join(", ")}. Check conditions before going out.`;
  }
  return "";
}
