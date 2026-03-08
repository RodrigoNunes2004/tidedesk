/**
 * Stormglass integration – marine weather API.
 * Uses /v2/marine/point for wind + swell, /v2/tide/sea-level for tide.
 * Set STORMGLASS_API_KEY in env.
 * Docs: https://docs.stormglass.io/
 */

export type WeatherPoint = {
  timestamp: string;
  windSpeed: number;
  swellHeight: number;
  tideLevel: number | null;
};

type StormglassMarineHour = {
  time: string;
  swellHeight?: { noaa?: number; sg?: number };
  waveHeight?: { noaa?: number; sg?: number };
  windSpeed?: { noaa?: number; icon?: number };
};

type StormglassTideHour = {
  time: string;
  height?: number;
};

type StormglassMarineResponse = {
  hours?: StormglassMarineHour[];
};

type StormglassTideResponse = {
  hours?: StormglassTideHour[];
};

async function fetchFromStormglass<T>(
  path: string,
  lat: number,
  lng: number,
  apiKey: string,
  start?: Date,
  end?: Date
): Promise<T> {

  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  if (start) params.set("start", start.toISOString());
  if (end) params.set("end", end.toISOString());

  const url = `https://api.stormglass.io/v2${path}?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: apiKey },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stormglass API error ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Fetch marine weather (wind, swell) and tide for a location.
 * Returns hourly points for the next 24 hours by default.
 */
export async function fetchWeatherForecast(
  lat: number,
  lng: number,
  hours = 24
): Promise<WeatherPoint[]> {
  const apiKey = process.env.STORMGLASS_API_KEY;
  if (!apiKey) {
    console.warn("Stormglass: STORMGLASS_API_KEY not set");
    return [];
  }

  const now = new Date();
  const end = new Date(now.getTime() + hours * 60 * 60 * 1000);

  try {
    const [marineRes, tideRes] = await Promise.all([
      fetchFromStormglass<StormglassMarineResponse>(
        "/marine/point",
        lat,
        lng,
        apiKey,
        now,
        end
      ),
      fetchFromStormglass<StormglassTideResponse>(
        "/tide/sea-level/point",
        lat,
        lng,
        apiKey,
        now,
        end
      ).catch(() => ({ hours: [] })),
    ]);

    const marineHours = marineRes.hours ?? [];
    const tideByTime = new Map<string, number>();
    for (const h of tideRes.hours ?? []) {
      if (h.time && typeof h.height === "number") {
        tideByTime.set(h.time, h.height);
      }
    }

    const points: WeatherPoint[] = marineHours.map((h) => {
      const windSpeed =
        h.windSpeed?.noaa ?? h.windSpeed?.icon ?? 0;
      const swellHeight =
        h.swellHeight?.noaa ?? h.swellHeight?.sg ?? h.waveHeight?.noaa ?? h.waveHeight?.sg ?? 0;
      const tideLevel = h.time ? tideByTime.get(h.time) ?? null : null;

      return {
        timestamp: h.time,
        windSpeed,
        swellHeight,
        tideLevel,
      };
    });

    return points;
  } catch (err) {
    console.error("Stormglass fetch error:", err);
    return [];
  }
}
