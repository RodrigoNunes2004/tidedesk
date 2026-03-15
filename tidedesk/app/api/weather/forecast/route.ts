import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveSession } from "@/app/api/_lib/tenant";
import { getBusinessTier } from "@/lib/tiers/get-business-tier";
import { hasFeature } from "@/lib/tiers";
import { getCachedOrFetchWeather } from "@/modules/weather";
import { getTides } from "@/lib/weather/tides";
import { fetchSevenDayWeather } from "@/integrations/stormglass";
import { aggregateSevenDay } from "@/lib/weather/aggregateSevenDay";
import { deriveCondition } from "@/lib/weather/deriveCondition";
import { getWeatherIcon } from "@/lib/weather/getWeatherIcon";
import { getTideStatus } from "@/lib/weather/tideStatus";
import { getMoonPhase } from "@/lib/astronomy/getMoonPhase";
import { degreesToCardinal } from "@/lib/weather/windDirection";

/**
 * GET /api/weather/forecast
 * Returns marine forecast (wind, swell, tide extremes, ocean status, 7-day) for the business location.
 * Requires Premium (windguru feature) and business lat/lng.
 */
export async function GET(req: NextRequest) {
  const { businessId } = await resolveSession(req);
  if (!businessId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tier = await getBusinessTier(businessId);
  if (!hasFeature(tier, "windguru")) {
    return Response.json(
      { error: "WindGuru / marine forecast requires Premium" },
      { status: 403 }
    );
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });

  if (!business?.latitude || !business?.longitude) {
    return Response.json({
      data: [],
      message: "Set latitude and longitude in Settings → Business to see forecast",
    });
  }

  const lat = Number(business.latitude);
  const lng = Number(business.longitude);
  const hours = 24;

  let quotaExceeded = false;
  const isQuotaError = (err: unknown) =>
    err instanceof Error && /402|quota exceeded/i.test(err.message);

  const [snapshots, tides, sevenDayHours] = await Promise.all([
    getCachedOrFetchWeather(businessId, lat, lng, hours),
    getTides(lat, lng).catch((err) => {
      if (isQuotaError(err)) quotaExceeded = true;
      return [];
    }),
    fetchSevenDayWeather(lat, lng).catch((err) => {
      if (isQuotaError(err)) quotaExceeded = true;
      return [];
    }),
  ]);

  const data = snapshots.map((s) => ({
    timestamp: s.timestamp.toISOString(),
    windSpeed: s.windSpeed,
    swellHeight: s.swellHeight,
    tideLevel: s.tideLevel,
  }));

  const windguruSpotId =
    (business as { windguruSpotId?: string | null }).windguruSpotId?.trim() ||
    null;

  const timezone =
    (business as { timezone?: string | null }).timezone?.trim() ||
    "Pacific/Auckland";

  // Ocean status from first hour of 7-day data
  const firstHour = sevenDayHours[0];
  const oceanStatus =
    firstHour
      ? {
          weather: {
            icon: getWeatherIcon(deriveCondition(firstHour.cloudCover, firstHour.precipitation)),
            label: deriveCondition(firstHour.cloudCover, firstHour.precipitation)
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
          },
          swell: firstHour.swellHeight,
          windSpeed: firstHour.windSpeed,
          windDirection: degreesToCardinal(firstHour.windDirection),
          temperature: Math.round(firstHour.airTemperature),
          tideStatus: getTideStatus(tides),
          moon: getMoonPhase(new Date()),
        }
      : null;

  const sevenDayForecast = aggregateSevenDay(sevenDayHours);

  const message =
    data.length === 0
      ? "No forecast data from Stormglass. Verify API key at stormglass.io."
      : undefined;

  return Response.json({
    data,
    windguruSpotId,
    tides: tides.map((t) => ({
      height: t.height,
      time: t.time,
      type: t.type,
    })),
    timezone,
    oceanStatus,
    sevenDayForecast,
    quotaExceeded: quotaExceeded || undefined,
    ...(message && { message }),
  });
}
