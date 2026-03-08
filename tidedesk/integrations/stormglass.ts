/**
 * Stormglass integration – weather API (stub for Phase 2).
 * Set STORMGLASS_API_KEY in env.
 * Docs: https://docs.stormglass.io/
 */
export type WeatherPoint = {
  timestamp: string;
  windSpeed: number;
  swellHeight: number;
};

export async function fetchWeatherForecast(
  _lat: number,
  _lng: number,
  _hours?: number
): Promise<WeatherPoint[]> {
  const apiKey = process.env.STORMGLASS_API_KEY;
  if (!apiKey) {
    console.warn("Stormglass: STORMGLASS_API_KEY not set");
    return [];
  }

  // TODO: Implement actual API call
  return [];
}
