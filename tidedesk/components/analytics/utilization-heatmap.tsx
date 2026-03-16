"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UtilizationHeatmap as UtilizationHeatmapType } from "@/modules/analytics";
import { cn } from "@/lib/utils";

const WEEKDAYS: { label: string; key: keyof Omit<UtilizationHeatmapType["rows"][number], "weekLabel"> }[] = [
  { label: "Mon", key: "mon" },
  { label: "Tue", key: "tue" },
  { label: "Wed", key: "wed" },
  { label: "Thu", key: "thu" },
  { label: "Fri", key: "fri" },
  { label: "Sat", key: "sat" },
  { label: "Sun", key: "sun" },
];

function utilizationColor(util: number | null): string {
  if (util === null) return "bg-muted";
  if (util >= 70) return "bg-emerald-500/80 text-emerald-950";
  if (util >= 40) return "bg-amber-400/80 text-amber-950";
  return "bg-red-400/80 text-red-950";
}

type Props = {
  heatmap: UtilizationHeatmapType;
};

export function UtilizationHeatmap({ heatmap }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Session utilization</CardTitle>
        <p className="text-sm text-muted-foreground">
          Green = full · Yellow = medium · Red = empty. Spot weak days for marketing.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px] text-sm">
            <thead>
              <tr>
                <th className="w-20 pb-2 text-left text-xs font-medium text-muted-foreground">
                  Week
                </th>
                {WEEKDAYS.map((d) => (
                  <th
                    key={d.key}
                    className="min-w-[44px] pb-2 text-center text-xs font-medium text-muted-foreground"
                  >
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmap.rows.map((row, i) => (
                <tr key={i}>
                  <td className="py-1 pr-2 text-xs text-muted-foreground">
                    {row.weekLabel}
                  </td>
                  {WEEKDAYS.map((day) => {
                    const val = row[day.key];
                    return (
                      <td key={day.key} className="p-0.5">
                        <div
                          className={cn(
                            "flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-xs font-medium",
                            utilizationColor(val)
                          )}
                          title={
                            val !== null ? `${val}% utilization` : "No data"
                          }
                        >
                          {val !== null ? `${val}%` : "—"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
