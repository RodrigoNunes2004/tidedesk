import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStaffOrOwner } from "@/lib/server/role";
import { getBusinessTier } from "@/lib/tiers/get-business-tier";
import { hasFeature } from "@/lib/tiers";
import { getAnalytics } from "@/modules/analytics/analytics.service";
import { getAlerts } from "@/modules/analytics/alerts.service";
import {
  AnalyticsOverviewCards,
  AnalyticsRevenueChart,
  AnalyticsBookingsChart,
  RevenueDonutChart,
  StudentMetrics,
  OperationsMetrics,
  AlertsPanel,
} from "@/components/analytics";
import type { AnalyticsRange } from "@/modules/analytics/analytics.types";

const CURRENCY_SYMBOLS: Record<string, string> = {
  NZD: "NZ$",
  AUD: "A$",
  USD: "$",
  EUR: "€",
  GBP: "£",
  BRL: "R$",
};

function currencySymbol(currency: string | null | undefined): string {
  return (currency && CURRENCY_SYMBOLS[currency]) || "NZ$";
}

type SearchParams = { range?: string };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireStaffOrOwner();
  const businessId = session.user.businessId!;

  const sp = await searchParams;
  const rangeParam = sp.range ?? "30";
  const range: AnalyticsRange =
    rangeParam === "7" ? 7 : rangeParam === "90" ? 90 : 30;

  const tier = await getBusinessTier(businessId);
  if (!hasFeature(tier, "analytics")) {
    return (
      <div className="grid gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Upgrade to Premium for business intelligence and operational insights.
        </p>
        <Link
          href="/pricing"
          className="text-sm text-muted-foreground hover:text-primary underline"
        >
          Upgrade for this feature
        </Link>
      </div>
    );
  }

  return <AnalyticsContent businessId={businessId} range={range} />;
}

async function AnalyticsContent({
  businessId,
  range,
}: {
  businessId: string;
  range: AnalyticsRange;
}) {
  const [analytics, alerts, currency] = await Promise.all([
    getAnalytics(businessId, range),
    getAlerts(businessId),
    import("@/lib/prisma").then(async ({ prisma }) => {
      const b = await prisma.business.findUnique({
        where: { id: businessId },
        select: { currency: true },
      });
      return currencySymbol(b?.currency);
    }),
  ]);

  const data = { ...analytics, alerts };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Business performance and operational insights.
        </p>
      </div>

      <AnalyticsOverviewCards
        revenue={data.revenue.total}
        revenueLessons={data.revenue.revenueLessons}
        revenueRentals={data.revenue.revenueRentals}
        bookings={data.bookings.total}
        utilizationPercent={data.bookings.utilizationPercent}
        newStudents={data.students.newStudents}
        returningStudents={data.students.returningStudents}
        currencySymbol={currency}
        range={range}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">
              Lessons vs rentals (last {range}d)
            </p>
          </CardHeader>
          <CardContent>
            <RevenueDonutChart
              revenueLessons={data.revenue.revenueLessons}
              revenueRentals={data.revenue.revenueRentals}
              currencySymbol={currency}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by day</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last {range} days
            </p>
          </CardHeader>
          <CardContent>
            <AnalyticsRevenueChart
              data={data.revenue.byDay}
              currencySymbol={currency}
              range={range}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bookings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Capacity utilization
            </p>
          </CardHeader>
          <CardContent>
            <AnalyticsBookingsChart
              data={data.bookings.byDay}
              range={range}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Students</CardTitle>
          <p className="text-sm text-muted-foreground">
            New, returning, and at-risk
          </p>
        </CardHeader>
        <CardContent>
          <StudentMetrics {...data.students} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operations</CardTitle>
          <p className="text-sm text-muted-foreground">
            Instructor labor and equipment utilization
          </p>
        </CardHeader>
        <CardContent>
          <OperationsMetrics
            instructors={data.instructors}
            equipment={data.equipment}
            capacityUtilization={data.bookings.utilizationPercent}
          />
        </CardContent>
      </Card>

      {data.alerts.length > 0 && (
        <AlertsPanel alerts={data.alerts} />
      )}
    </div>
  );
}
