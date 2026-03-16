import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveSession, rejectIfInstructor } from "../_lib/tenant";
import { requireFeature } from "@/lib/tiers/require-feature";
import { getAnalytics } from "@/modules/analytics/analytics.service";
import { getAlerts } from "@/modules/analytics/alerts.service";
import type { AnalyticsRange } from "@/modules/analytics/analytics.types";

const VALID_RANGES: AnalyticsRange[] = [7, 30, 90];

export async function GET(req: NextRequest) {
  const { businessId, role } = await resolveSession(req);
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const forbidden = rejectIfInstructor(role);
  if (forbidden) return forbidden;

  const gated = await requireFeature(req, businessId, "analytics");
  if (gated) return gated;

  const { searchParams } = new URL(req.url);
  const rangeParam = searchParams.get("range") ?? "30";
  const range = VALID_RANGES.includes(Number(rangeParam) as AnalyticsRange)
    ? (Number(rangeParam) as AnalyticsRange)
    : 30;

  try {
    const [analytics, alerts] = await Promise.all([
      getAnalytics(businessId, range),
      getAlerts(businessId),
    ]);

    const res = NextResponse.json({
      success: true,
      data: {
        ...analytics,
        alerts,
      },
    });
    res.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res;
  } catch (err) {
    console.error("Analytics API error:", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
