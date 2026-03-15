/**
 * Aggregates 7-day hourly weather data into daily forecast entries.
 */
import type { SevenDayHour } from "@/integrations/stormglass";
import { deriveCondition } from "./deriveCondition";
import { getWeatherIcon } from "./getWeatherIcon";
import { evaluateSurfConditions } from "@/lib/surf/evaluateConditions";

export type ForecastDay = {
  date: string;
  dayOfWeek: string;
  temp: number;
  icon: string;
  condition: string;
  rating: "Excellent" | "Good" | "Average" | "Poor";
};

/**
 * Groups 168 hourly points into 7 days (24h each), aggregates temp, condition, rating.
 */
export function aggregateSevenDay(hours: SevenDayHour[]): ForecastDay[] {
  const days: ForecastDay[] = [];
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  for (let d = 0; d < 7; d++) {
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    dayStart.setUTCDate(dayStart.getUTCDate() + d);
    const dayEnd = new Date(dayStart.getTime() + MS_PER_DAY);

    const dayHours = hours.filter((h) => {
      const t = new Date(h.time);
      return t >= dayStart && t < dayEnd;
    });

    if (dayHours.length === 0) continue;

    const avgTemp =
      dayHours.reduce((s, h) => s + h.airTemperature, 0) / dayHours.length;
    const avgCloud =
      dayHours.reduce((s, h) => s + h.cloudCover, 0) / dayHours.length;
    const avgPrecip =
      dayHours.reduce((s, h) => s + h.precipitation, 0) / dayHours.length;
    const avgWind =
      dayHours.reduce((s, h) => s + h.windSpeed, 0) / dayHours.length;
    const avgSwell =
      dayHours.reduce((s, h) => s + h.swellHeight, 0) / dayHours.length;

    const condition = deriveCondition(avgCloud, avgPrecip);
    const icon = getWeatherIcon(condition);
    const rating = evaluateSurfConditions({
      windSpeed: avgWind,
      swellHeight: avgSwell,
      precipitation: avgPrecip,
    });

    days.push({
      date: dayStart.toISOString().slice(0, 10),
      dayOfWeek: dayStart.toLocaleDateString(undefined, { weekday: "short" }),
      temp: Math.round(avgTemp),
      icon,
      condition,
      rating,
    });
  }

  return days;
}
