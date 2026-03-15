/**
 * Maps weather condition (cloud cover, precipitation) to emoji icon.
 */
export function getWeatherIcon(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes("rain") || c.includes("shower")) return "🌧";
  if (c.includes("cloud") && !c.includes("partly")) return "☁️";
  if (c.includes("partly") || c.includes("few") || c.includes("scattered"))
    return "🌤";
  if (c.includes("fog") || c.includes("mist")) return "🌫";
  if (c.includes("snow")) return "❄️";
  return "☀️";
}
