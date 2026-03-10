import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaffOrOwner } from "@/lib/server/role";
import { RevenueChart } from "@/components/revenue/revenue-chart";
import { FeatureGate } from "@/lib/tiers/feature-gate";
import { ExportButton } from "@/components/export/export-button";

type SearchParams = { range?: string };

type ChartPoint = { label: string; amount: number; date: string };

function currencySymbol(currency: string | null | undefined): string {
  const c = (currency ?? "NZD").toUpperCase();
  if (c === "NZD") return "NZ$";
  if (c === "USD") return "$";
  if (c === "EUR") return "€";
  if (c === "GBP") return "£";
  if (c === "AUD") return "A$";
  if (c === "BRL") return "R$";
  return c + " ";
}

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireStaffOrOwner();
  const businessId = session.user.businessId;

  const sp = await searchParams;
  const chartDays = sp.range === "30" ? 30 : 14;

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const startOfChart = new Date(now);
  startOfChart.setDate(now.getDate() - chartDays + 1);
  startOfChart.setHours(0, 0, 0, 0);

  const startOf12Weeks = new Date(now);
  startOf12Weeks.setDate(now.getDate() - 12 * 7);
  startOf12Weeks.setHours(0, 0, 0, 0);

  const startOf12Months = new Date(now.getFullYear(), now.getMonth() - 12, 1);

  const [business, todayRevenue, weekRevenue, monthRevenue, byRental, byBooking, dailyPayments, payments12Weeks, payments12Months, todaysRentalsCount, todaysLessonsCount, rentalStats] =
    await Promise.all([
      prisma.business.findUnique({
        where: { id: businessId },
        select: { currency: true },
      }),
      prisma.payment.aggregate({
        where: {
          businessId,
          status: PaymentStatus.PAID,
          paidAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          businessId,
          status: PaymentStatus.PAID,
          paidAt: { gte: startOfWeek, lte: endOfDay },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          businessId,
          status: PaymentStatus.PAID,
          paidAt: { gte: startOfMonth, lte: endOfDay },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          businessId,
          status: PaymentStatus.PAID,
          rentalId: { not: null },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          businessId,
          status: PaymentStatus.PAID,
          bookingId: { not: null },
        },
        _sum: { amount: true },
      }),
      prisma.payment.findMany({
        where: {
          businessId,
          status: PaymentStatus.PAID,
          paidAt: { gte: startOfChart, lte: endOfDay },
        },
        select: { amount: true, paidAt: true },
      }),
      prisma.payment.findMany({
        where: {
          businessId,
          status: PaymentStatus.PAID,
          paidAt: { gte: startOf12Weeks, lte: endOfDay },
        },
        select: { amount: true, paidAt: true },
      }),
      prisma.payment.findMany({
        where: {
          businessId,
          status: PaymentStatus.PAID,
          paidAt: { gte: startOf12Months, lte: endOfDay },
        },
        select: { amount: true, paidAt: true },
      }),
      prisma.rental.count({
        where: {
          businessId,
          startAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.booking.count({
        where: {
          businessId,
          lessonId: { not: null },
          startAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.rental.aggregate({
        where: { businessId },
        _count: true,
        _sum: { priceTotal: true },
      }),
    ]);

  const today = todayRevenue._sum.amount?.toString() ?? "0.00";
  const week = weekRevenue._sum.amount?.toString() ?? "0.00";
  const month = monthRevenue._sum.amount?.toString() ?? "0.00";
  const rentalRev = byRental._sum.amount?.toString() ?? "0.00";
  const lessonRev = byBooking._sum.amount?.toString() ?? "0.00";

  const totalRentals = rentalStats._count ?? 0;
  const totalRentalRevenue = Number(rentalStats._sum.priceTotal ?? 0);
  const avgRentalValue = totalRentals > 0 ? (totalRentalRevenue / totalRentals).toFixed(2) : "0.00";

  const dailyMap = new Map<string, number>();
  for (let d = 0; d < chartDays; d++) {
    const date = new Date(startOfChart);
    date.setDate(startOfChart.getDate() + d);
    const key = date.toISOString().slice(0, 10);
    dailyMap.set(key, 0);
  }
  for (const p of dailyPayments) {
    const key = p.paidAt.toISOString().slice(0, 10);
    const amt = Number(p.amount);
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + amt);
  }
  const dailyChartData: ChartPoint[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({
      label: new Date(date).toLocaleDateString("en-NZ", { day: "numeric", month: "short" }),
      amount,
      date,
    }));

  const weeklyMap = new Map<string, number>();
  for (let w = 0; w < 12; w++) {
    const d = new Date(startOf12Weeks);
    d.setDate(startOf12Weeks.getDate() + w * 7);
    d.setDate(d.getDate() - d.getDay());
    const key = d.toISOString().slice(0, 10);
    weeklyMap.set(key, 0);
  }
  for (const p of payments12Weeks) {
    const d = new Date(p.paidAt);
    d.setDate(d.getDate() - d.getDay());
    const key = d.toISOString().slice(0, 10);
    if (weeklyMap.has(key)) {
      weeklyMap.set(key, weeklyMap.get(key)! + Number(p.amount));
    }
  }
  const weeklyChartData: ChartPoint[] = Array.from(weeklyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({
      label: new Date(date).toLocaleDateString("en-NZ", { day: "numeric", month: "short" }) + " wk",
      amount,
      date,
    }));

  const monthlyMap = new Map<string, number>();
  for (let m = 0; m < 12; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 12 + m, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, 0);
  }
  for (const p of payments12Months) {
    const d = new Date(p.paidAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + Number(p.amount));
  }
  const monthlyChartData: ChartPoint[] = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => {
      const [y, m] = date.split("-");
      const monthName = new Date(Number(y), Number(m) - 1).toLocaleDateString("en-NZ", {
        month: "short",
        year: "2-digit",
      });
      return { label: monthName, amount, date };
    });

  const symbol = currencySymbol(business?.currency);

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xl font-semibold tracking-tight">Revenue</div>
          <div className="text-sm text-muted-foreground">
            Revenue from paid payments. Never delete payments — audit trail stays intact.
          </div>
        </div>
        <FeatureGate feature="export">
          <ExportButton type="revenue" />
        </FeatureGate>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Today
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {symbol}{today}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              This week
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {symbol}{week}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              This month
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {symbol}{month}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Rentals today
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {todaysRentalsCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Lessons today
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {todaysLessonsCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Avg rental value
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {symbol}{avgRentalValue}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue by type</CardTitle>
          <p className="text-sm text-muted-foreground">
            All-time paid amounts
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Rental revenue</div>
            <div className="text-2xl font-semibold">{symbol}{rentalRev}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Lesson revenue</div>
            <div className="text-2xl font-semibold">{symbol}{lessonRev}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue over time</CardTitle>
          <p className="text-sm text-muted-foreground">
            Hover over the chart to see amounts. Switch between daily, weekly, and monthly views.
          </p>
        </CardHeader>
        <CardContent>
          <RevenueChart
            dailyData={dailyChartData}
            weeklyData={weeklyChartData}
            monthlyData={monthlyChartData}
            currencySymbol={symbol}
            dailyRange={chartDays}
          />
        </CardContent>
      </Card>
    </div>
  );
}
