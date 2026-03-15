/**
 * Top status bar showing real-time marine conditions.
 * Order: Weather | Swell | Wind | Temp | Tide | Moon
 *
 * Responsive layout:
 * - Mobile: 2-column grid, compact spacing, fits viewport
 * - Tablet+: Single flex row with wrap, generous spacing
 *
 * Whitespace best practices:
 * - Tighter gaps on mobile (gap-2) to maximise content; broader on desktop (gap-6)
 * - Consistent padding (pb-3, mb-4) for visual rhythm
 * - Shorter labels on mobile (moon icon-only) to prevent overflow
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
  className = "",
}: {
  icon: string;
  children: React.ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <span title={title} className={`inline-flex items-center gap-1.5 shrink-0 ${className}`}>
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
      className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:flex sm:flex-wrap items-center gap-x-2 gap-y-2.5 sm:gap-x-4 sm:gap-y-0 md:gap-6 text-xs sm:text-sm text-muted-foreground border-b border-border pb-3 mb-4 min-w-0"
      role="list"
      aria-label="Current surf conditions"
    >
      <StatusItem icon={weather.icon} title="Weather">
        <span className="truncate">{weather.label}</span>
      </StatusItem>
      <StatusItem icon="🌊" title="Swell height">
        {swell.toFixed(1)}m
      </StatusItem>
      <StatusItem icon="🌬" title="Wind">
        {windSpeed.toFixed(0)} kt {windDirection}
      </StatusItem>
      <StatusItem icon="🌡" title="Temperature">
        {temperature}°C
      </StatusItem>
      {tideStatus && (
        <StatusItem icon="🌊" title="Tide">
          {tideStatus}
        </StatusItem>
      )}
      <StatusItem icon={moon.icon} title={`Moon: ${moon.label}`}>
        <span className="hidden sm:inline truncate max-w-28">{moon.label}</span>
      </StatusItem>
    </div>
  );
}
