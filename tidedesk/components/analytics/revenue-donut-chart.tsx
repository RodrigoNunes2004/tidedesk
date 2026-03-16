"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = {
  lessons: "var(--chart-1)",
  rentals: "var(--chart-2)",
  merch: "var(--chart-3)",
};

type Props = {
  revenueLessons: number;
  revenueRentals: number;
  revenueMerch?: number;
  currencySymbol: string;
};

function CustomTooltip({
  active,
  payload,
  currencySymbol,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { percent: number } }[];
  currencySymbol: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-lg">
      <div className="text-sm font-medium capitalize">{p?.name}</div>
      <div className="text-sm text-muted-foreground">
        {currencySymbol}
        {(p?.value ?? 0).toFixed(2)} · {(p?.payload?.percent ?? 0)}%
      </div>
    </div>
  );
}

export function RevenueDonutChart({
  revenueLessons,
  revenueRentals,
  revenueMerch = 0,
  currencySymbol,
}: Props) {
  const total = revenueLessons + revenueRentals + revenueMerch;

  const data = [
    {
      name: "Lessons",
      value: revenueLessons,
      percent: total > 0 ? Math.round((revenueLessons / total) * 100) : 0,
      color: COLORS.lessons,
    },
    {
      name: "Rentals",
      value: revenueRentals,
      percent: total > 0 ? Math.round((revenueRentals / total) * 100) : 0,
      color: COLORS.rentals,
    },
    ...(revenueMerch > 0
      ? [
          {
            name: "Merch",
            value: revenueMerch,
            percent: Math.round((revenueMerch / total) * 100),
            color: COLORS.merch,
          },
        ]
      : []),
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No revenue data in this period
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
          <Legend
            formatter={(value, entry) => {
              const item = data.find((d) => d.name === value);
              return `${value} ${item?.percent ?? 0}%`;
            }}
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
