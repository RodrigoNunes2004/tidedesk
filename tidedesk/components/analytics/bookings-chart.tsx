"use client";

import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartPoint = { label: string; count: number; date: string };

type Props = {
  data: ChartPoint[];
  range: 7 | 30 | 90;
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; payload?: { date?: string } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  const displayLabel = label ?? payload[0]?.payload?.date ?? "";
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-lg">
      <div className="text-xs font-medium text-muted-foreground">Bookings</div>
      <div className="text-sm font-semibold">
        {displayLabel} · {value}
      </div>
    </div>
  );
}

export function AnalyticsBookingsChart({ data, range }: Props) {
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">Bookings by day</h3>
          <p className="text-sm text-muted-foreground">Last {range} days</p>
        </div>
        <div className="flex min-w-0 flex-nowrap gap-1 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
          <Link
            href="/analytics?range=7"
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors min-h-[44px] flex items-center ${
              range === 7 ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            7d
          </Link>
          <Link
            href="/analytics?range=30"
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors min-h-[44px] flex items-center ${
              range === 30 ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            30d
          </Link>
          <Link
            href="/analytics?range=90"
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors min-h-[44px] flex items-center ${
              range === 90 ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            90d
          </Link>
        </div>
      </div>

      <div className="h-64 min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={32}
              domain={[0, Math.ceil(maxCount * 1.1)]}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            />
            <Bar
              dataKey="count"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
