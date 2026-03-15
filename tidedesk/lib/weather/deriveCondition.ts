/**
 * Derives a weather condition label from cloud cover and precipitation.
 */
export function deriveCondition(cloudCover: number, precipitation: number): string {
  if (precipitation > 2) return "rain";
  if (precipitation > 0.2) return "light rain";
  if (cloudCover >= 80) return "cloudy";
  if (cloudCover >= 50) return "partly cloudy";
  if (cloudCover >= 20) return "few clouds";
  return "sunny";
}
