/**
 * Calculates moon phase from date (no external API).
 * Returns emoji and label.
 */
export type MoonPhase = { icon: string; label: string };

export function getMoonPhase(date: Date): MoonPhase {
  // Simplified lunar cycle: ~29.53 days from new moon to new moon
  const lunarCycle = 29.53058867;
  const knownNewMoon = new Date("2000-01-06T18:14:00Z");
  const daysSince =
    (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const cyclePosition = ((daysSince % lunarCycle) + lunarCycle) % lunarCycle;

  if (cyclePosition < 1.85) return { icon: "🌑", label: "New Moon" };
  if (cyclePosition < 5.55) return { icon: "🌒", label: "Waxing Crescent" };
  if (cyclePosition < 9.25) return { icon: "🌓", label: "First Quarter" };
  if (cyclePosition < 12.95) return { icon: "🌔", label: "Waxing Gibbous" };
  if (cyclePosition < 16.65) return { icon: "🌕", label: "Full Moon" };
  if (cyclePosition < 20.35) return { icon: "🌖", label: "Waning Gibbous" };
  if (cyclePosition < 24.05) return { icon: "🌗", label: "Last Quarter" };
  if (cyclePosition < 27.75) return { icon: "🌘", label: "Waning Crescent" };
  return { icon: "🌑", label: "New Moon" };
}
