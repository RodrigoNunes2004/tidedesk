/**
 * Weather job – fetches marine weather, caches it, sends WEATHER_ALERT when conditions warrant.
 * Run via Vercel Cron: GET /api/cron/weather
 */
import { prisma } from "@/lib/prisma";
import {
  getCachedOrFetchWeather,
  buildWeatherAlertMessage,
} from "@/modules/weather";
import { sendNotification } from "@/modules/notifications/notificationService";

// Adapter-based client loses some model types in IDE; use asserted client (see prisma/seed.ts)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

const WIND_ALERT_KT = 25;
const SWELL_ALERT_M = 2;

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
      const snapshots = await getCachedOrFetchWeather(biz.id, lat, lng, 24);

      for (const point of snapshots) {
        const message = buildWeatherAlertMessage(point, biz.name);
        if (!message) continue;

        const existing = await db.notification.findFirst({
          where: {
            type: "WEATHER_ALERT",
            businessId: biz.id,
            metadata: { contains: point.timestamp.toISOString().slice(0, 13) },
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
                timestamp: point.timestamp.toISOString(),
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
          metadata: { timestamp: point.timestamp.toISOString() },
        });
        if (ok) alertsSent++;
      }
    } catch (err) {
      console.error(`Weather job error for business ${biz.id}:`, err);
    }
  }

  return { businesses: businesses.length, alertsSent };
}
