import type { ForecastDay } from "@/lib/weather/aggregateSevenDay";
import { ConditionBadge } from "./ConditionBadge";

type SevenDayForecastProps = {
  forecast: ForecastDay[];
  timezone?: string;
};

export function SevenDayForecast({
  forecast,
  timezone = "Pacific/Auckland",
}: SevenDayForecastProps) {
  if (!forecast || forecast.length === 0) return null;

  return (
    <div className="w-full min-w-0 rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">7 Day Forecast</h3>
      <div className="space-y-2 overflow-x-auto -mx-1 px-1">
        {forecast.map((day) => (
          <div
            key={day.date}
            className="flex flex-nowrap items-center gap-3 text-sm min-w-max"
          >
            <span className="w-9 shrink-0 font-medium">{day.dayOfWeek}</span>
            <span
              className="shrink-0 text-lg select-none"
              title={day.condition}
              aria-label={day.condition}
            >
              {day.icon}
            </span>
            <span className="w-10 shrink-0 tabular-nums text-right">
              {day.temp}°
            </span>
            <ConditionBadge label={day.rating} className="shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
