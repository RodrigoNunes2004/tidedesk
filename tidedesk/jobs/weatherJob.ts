/**
 * Weather job – refreshes cache, then sends WEATHER_ALERT from cached data.
 * Run via Vercel Cron: GET /api/cron/weather
 *
 * Users never trigger Stormglass; only this cron does.
 */
import { prisma } from "@/lib/prisma";
import { getWeatherFromCache } from "@/lib/weather/weatherCache";
import { buildWeatherAlertMessage } from "@/modules/weather";
import type { WeatherSnapshotRow } from "@/modules/weather";
import { sendNotification } from "@/modules/notifications/notificationService";

// Adapter-based client loses some model types in IDE
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function runWeatherJob() {
  const businesses = await db.business.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      phone: true,
      contactEmail: true,
    },
  });

  let alertsSent = 0;

  for (const biz of businesses) {
    const lat = biz.latitude ? Number(biz.latitude) : null;
    const lng = biz.longitude ? Number(biz.longitude) : null;
    if (lat == null || lng == null) continue;

    try {
      const cached = await getWeatherFromCache(lat, lng);
      if (!cached?.data?.length) continue;

      for (const point of cached.data) {
        const row: WeatherSnapshotRow = {
          windSpeed: point.windSpeed,
          swellHeight: point.swellHeight,
          tideLevel: point.tideLevel,
          timestamp: new Date(point.timestamp),
        };
        const message = buildWeatherAlertMessage(row, biz.name);
        if (!message) continue;

        const existing = await db.notification.findFirst({
          where: {
            type: "WEATHER_ALERT",
            businessId: biz.id,
            metadata: { contains: point.timestamp.slice(0, 13) },
          },
        });
        if (existing) continue;

        const recipient = biz.phone?.trim() || biz.contactEmail?.trim();
        if (!recipient) {
          await db.notification.create({
            data: {
              businessId: biz.id,
              type: "WEATHER_ALERT",
              channel: "SMS",
              recipient: "unconfigured",
              content: message,
              status: "FAILED",
              metadata: JSON.stringify({
                timestamp: point.timestamp,
                reason: "No phone or email for business",
              }),
            },
          });
          continue;
        }

        const channel = biz.phone?.trim() ? "SMS" : "EMAIL";
        const ok = await sendNotification({
          businessId: biz.id,
          type: "WEATHER_ALERT",
          channel,
          recipient,
          content: message,
          metadata: { timestamp: point.timestamp },
        });
        if (ok) alertsSent++;
      }
    } catch (err) {
      console.error(`Weather job error for business ${biz.id}:`, err);
    }
  }

  return { businesses: businesses.length, alertsSent };
}
