import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveSession } from "@/app/api/_lib/tenant";
import { getBusinessTier } from "@/lib/tiers/get-business-tier";
import { hasFeature } from "@/lib/tiers";
import { getWeatherFromCache } from "@/lib/weather/weatherCache";
import { refreshWeatherForLocation } from "@/lib/weather/refreshWeatherCache";

/**
 * GET /api/weather/forecast
 * Returns marine forecast (wind, swell, tide extremes, ocean status, 7-day) for the business location.
 * Requires Premium (windguru feature) and business lat/lng.
 *
 * Reads from WeatherCache. If cache is empty, triggers an on-demand refresh (so users see data
 * immediately instead of waiting for the daily cron).
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

  let cached = await getWeatherFromCache(lat, lng);

  const windguruSpotId =
    (business as { windguruSpotId?: string | null }).windguruSpotId?.trim() ||
    null;

  const timezone =
    (business as { timezone?: string | null }).timezone?.trim() ||
    "Pacific/Auckland";

  if (!cached) {
    const refreshed = await refreshWeatherForLocation(lat, lng);
    if (refreshed.ok) cached = await getWeatherFromCache(lat, lng);
  }

  if (!cached) {
    return Response.json({
      data: [],
      windguruSpotId,
      tides: [],
      timezone,
      oceanStatus: null,
      sevenDayForecast: [],
      message:
        "Weather data will appear after the next refresh. Check that STORMGLASS_API_KEY is set in Vercel.",
    });
  }

  return Response.json({
    data: cached.data,
    windguruSpotId,
    tides: cached.tides,
    timezone,
    oceanStatus: cached.oceanStatus,
    sevenDayForecast: cached.sevenDayForecast,
  });
}
