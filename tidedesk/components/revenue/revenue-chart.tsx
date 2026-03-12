"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type ChartPoint = { label: string; amount: number; date: string };

type Props = {
  dailyData: ChartPoint[];
  weeklyData: ChartPoint[];
  monthlyData: ChartPoint[];
  currencySymbol: string;
  dailyRange: 14 | 30;
};

function CustomTooltip({
  active,
  payload,
  label,
  currencySymbol,
  granularity,
}: {
  active?: boolean;
  payload?: { value: number; payload?: { date?: string } }[];
  label?: string;
  currencySymbol: string;
  granularity: "daily" | "weekly" | "monthly";
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  const displayLabel = label ?? payload[0]?.payload?.date ?? "";
  const subtitle =
    granularity === "daily"
      ? "Daily total"
      : granularity === "weekly"
        ? "Weekly total"
        : "Monthly total";
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-lg">
      <div className="text-xs font-medium text-muted-foreground">{subtitle}</div>
      <div className="text-sm font-semibold">
        {displayLabel} · {currencySymbol}{value.toFixed(2)}
      </div>
    </div>
  );
}

export function RevenueChart({
  dailyData,
  weeklyData,
  monthlyData,
  currencySymbol,
  dailyRange,
}: Props) {
  const [granularity, setGranularity] = useState<"daily" | "weekly" | "monthly">("daily");

  const { data, xKey, rangeLabel } = useMemo(() => {
    if (granularity === "daily") {
      return {
        data: dailyData,
        xKey: "label",
        rangeLabel: `Last ${dailyRange} days`,
      };
    }
    if (granularity === "weekly") {
      return {
        data: weeklyData,
        xKey: "label",
        rangeLabel: "Last 12 weeks",
      };
    }
    return {
      data: monthlyData,
      xKey: "label",
      rangeLabel: "Last 12 months",
    };
  }, [granularity, dailyData, weeklyData, monthlyData, dailyRange]);

  const maxAmount = Math.max(1, ...data.map((d) => d.amount));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">Revenue over time</h3>
          <p className="text-sm text-muted-foreground">{rangeLabel}</p>
        </div>
        <div className="flex min-w-0 flex-nowrap gap-1 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
          <Link
            href={`/revenue?range=${dailyRange}`}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              dailyRange === 14 ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            14d
          </Link>
          <Link
            href={`/revenue?range=30`}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              dailyRange === 30 ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            30d
          </Link>
          <span className="mx-1 text-muted-foreground">|</span>
          <button
            type="button"
            onClick={() => setGranularity("daily")}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              granularity === "daily" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setGranularity("weekly")}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              granularity === "weekly" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setGranularity("monthly")}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              granularity === "monthly" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="h-64 min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v) => `${currencySymbol}${v}`}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={52}
              domain={[0, Math.ceil(maxAmount * 1.1)]}
            />
            <Tooltip
              content={
                <CustomTooltip
                  currencySymbol={currencySymbol}
                  granularity={granularity}
                />
              }
              cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {data.length > 0 && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>
            High: {currencySymbol}
            {Math.max(...data.map((d) => d.amount)).toFixed(2)}
          </span>
          <span>
            Low: {currencySymbol}
            {Math.min(...data.map((d) => d.amount)).toFixed(2)}
          </span>
          <span>
            Avg: {currencySymbol}
            {(data.reduce((s, d) => s + d.amount, 0) / data.length).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}
