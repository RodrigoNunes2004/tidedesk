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
  end?: Date,
  extraParams?: Record<string, string>
): Promise<T> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  if (start) params.set("start", start.toISOString());
  if (end) params.set("end", end.toISOString());
  for (const [k, v] of Object.entries(extraParams ?? {})) {
    params.set(k, v);
  }

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
    // Stormglass v2: /marine/point returns 404 in production. Use /weather/point with
    // windSpeed,waveHeight params - same data, different endpoint.
    const [marineOrWeatherRes, tideRes] = await Promise.all([
      fetchFromStormglass<StormglassMarineResponse>(
        "/weather/point",
        lat,
        lng,
        apiKey,
        now,
        end,
        { params: "windSpeed,waveHeight" }
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

    const rawMarine = marineOrWeatherRes as { hours?: StormglassMarineHour[]; data?: StormglassMarineHour[] };
    const marineHours = rawMarine.hours ?? rawMarine.data ?? [];

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

/** Tide extreme (high or low) from Stormglass /tide/extremes/point */
export type TideExtreme = {
  height: number;
  time: string;
  type: "high" | "low";
};

type StormglassTideExtremesResponse = {
  data?: TideExtreme[];
};

/**
 * Fetch tide extremes (high/low) for the next 48 hours.
 * Uses Stormglass /v2/tide/extremes/point.
 */
export async function fetchTideExtremes(
  lat: number,
  lng: number
): Promise<TideExtreme[]> {
  const apiKey = process.env.STORMGLASS_API_KEY;
  if (!apiKey) {
    console.warn("Stormglass: STORMGLASS_API_KEY not set");
    return [];
  }

  const now = new Date();
  const end = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  try {
    const res = await fetchFromStormglass<StormglassTideExtremesResponse>(
      "/tide/extremes/point",
      lat,
      lng,
      apiKey,
      now,
      end
    );
    return res.data ?? [];
  } catch (err) {
    console.error("Stormglass tide extremes fetch error:", err);
    if (err instanceof Error && /402|quota exceeded/i.test(err.message)) {
      throw err;
    }
    return [];
  }
}

/** Extended hourly point for 7-day forecast (air temp, cloud, precip, wind dir). windSpeed in knots. */
export type SevenDayHour = {
  time: string;
  airTemperature: number;
  cloudCover: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  swellHeight: number;
};

type StormglassWeatherHour = {
  time: string;
  airTemperature?: { noaa?: number; sg?: number };
  cloudCover?: { noaa?: number; sg?: number };
  precipitation?: { noaa?: number; sg?: number };
  windSpeed?: { noaa?: number; sg?: number; icon?: number };
  windDirection?: { noaa?: number; sg?: number; icon?: number };
  waveHeight?: { noaa?: number; sg?: number };
  swellHeight?: { noaa?: number; sg?: number };
};

type StormglassWeatherResponse = {
  hours?: StormglassWeatherHour[];
  data?: StormglassWeatherHour[];
};

const MPS_TO_KNOTS = 1.94384;

/**
 * Fetch 7-day weather forecast (168 hours) with temp, cloud, precip, wind.
 * Stormglass returns windSpeed in m/s; we convert to knots.
 */
export async function fetchSevenDayWeather(
  lat: number,
  lng: number
): Promise<SevenDayHour[]> {
  const apiKey = process.env.STORMGLASS_API_KEY;
  if (!apiKey) {
    console.warn("Stormglass: STORMGLASS_API_KEY not set");
    return [];
  }

  const now = new Date();
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  try {
    const res = await fetchFromStormglass<StormglassWeatherResponse>(
      "/weather/point",
      lat,
      lng,
      apiKey,
      now,
      end,
      {
        params: "airTemperature,cloudCover,precipitation,windSpeed,windDirection,waveHeight",
      }
    );

    const hours = res.hours ?? res.data ?? [];
    return hours.map((h) => {
      const airTemp =
        (typeof h.airTemperature === "object"
          ? h.airTemperature?.noaa ?? h.airTemperature?.sg
          : h.airTemperature) ?? 0;
      const cloud =
        (typeof h.cloudCover === "object"
          ? h.cloudCover?.noaa ?? h.cloudCover?.sg
          : h.cloudCover) ?? 0;
      const precip =
        (typeof h.precipitation === "object"
          ? h.precipitation?.noaa ?? h.precipitation?.sg
          : h.precipitation) ?? 0;
      const windMs =
        (typeof h.windSpeed === "object"
          ? h.windSpeed?.noaa ?? h.windSpeed?.sg ?? h.windSpeed?.icon
          : h.windSpeed) ?? 0;
      const windDir =
        (typeof h.windDirection === "object"
          ? h.windDirection?.noaa ?? h.windDirection?.sg ?? h.windDirection?.icon
          : h.windDirection) ?? 0;
      const swell =
        (typeof h.swellHeight === "object"
          ? h.swellHeight?.noaa ?? h.swellHeight?.sg
          : h.swellHeight) ??
        (typeof h.waveHeight === "object"
          ? h.waveHeight?.noaa ?? h.waveHeight?.sg
          : h.waveHeight) ??
        0;

      return {
        time: h.time,
        airTemperature: Number(airTemp),
        cloudCover: Number(cloud),
        precipitation: Number(precip),
        windSpeed: Number(windMs) * MPS_TO_KNOTS,
        windDirection: Number(windDir),
        swellHeight: Number(swell),
      };
    });
  } catch (err) {
    console.error("Stormglass 7-day fetch error:", err);
    if (err instanceof Error && /402|quota exceeded/i.test(err.message)) {
      throw err;
    }
    return [];
  }
}
