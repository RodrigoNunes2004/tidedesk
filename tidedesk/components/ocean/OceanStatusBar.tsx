/**
 * Top status bar showing real-time marine conditions.
 * Order: Weather | Swell | Wind | Temp | Tide | Moon
 *
 * Mobile: Horizontal scroll so all items visible; moon phase always shown.
 * Desktop: Flex row with wrap.
 */
type OceanStatusBarProps = {
  weather: { icon: string; label: string };
  swell: number; // metres
  windSpeed: number; // knots
  windDirection: string; // e.g. "NW"
  temperature: number; // °C
  tideStatus: string | null; // "Rising" | "Falling"
  moon: { icon: string; label: string };
};

function StatusItem({
  icon,
  children,
  title,
}: {
  icon: string;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <span title={title} className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
      <span aria-hidden>{icon}</span>
      {children}
    </span>
  );
}

export function OceanStatusBar({
  weather,
  swell,
  windSpeed,
  windDirection,
  temperature,
  tideStatus,
  moon,
}: OceanStatusBarProps) {
  return (
    <div
      className="overflow-x-auto overflow-y-hidden -mx-1 px-1"
      role="list"
      aria-label="Current surf conditions"
    >
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-2 sm:gap-x-6 min-w-max sm:min-w-0 text-xs sm:text-sm text-muted-foreground border-b border-border pb-3 mb-4">
        <StatusItem icon={weather.icon} title="Weather">
          <span className="truncate max-w-20 sm:max-w-none">{weather.label}</span>
        </StatusItem>
        <StatusItem icon="🌊" title="Swell height">
          {swell.toFixed(1)}m swell
        </StatusItem>
        <StatusItem icon="🌬" title="Wind">
          {windSpeed.toFixed(0)} kt {windDirection}
        </StatusItem>
        <StatusItem icon="🌡" title="Temperature">
          {temperature}°C
        </StatusItem>
        {tideStatus && (
          <StatusItem icon="🌊" title="Tide">
            {tideStatus} tide
          </StatusItem>
        )}
        <StatusItem icon={moon.icon} title={`Moon: ${moon.label}`}>
          {moon.label}
        </StatusItem>
      </div>
    </div>
  );
}
