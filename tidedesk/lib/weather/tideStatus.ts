/**
 * Derives tide status ("Rising" | "Falling") from tide extremes and current time.
 */
import type { TideExtreme } from "@/integrations/stormglass";

export function getTideStatus(tides: TideExtreme[]): "Rising" | "Falling" | null {
  if (!tides || tides.length === 0) return null;
  const now = new Date();

  const sorted = [...tides].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  let prev: TideExtreme | null = null;
  for (const t of sorted) {
    const tTime = new Date(t.time);
    if (tTime > now) {
      if (!prev) return t.type === "high" ? "Falling" : "Rising";
      return prev.type === "low" ? "Rising" : "Falling";
    }
    prev = t;
  }
  return prev?.type === "low" ? "Rising" : "Falling";
}
