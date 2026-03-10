import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveSession } from "@/app/api/_lib/tenant";
import { getBusinessTier } from "./get-business-tier";
import { hasFeature } from "./index";

/**
 * For API routes: ensure the business has access to the feature.
 * Call after resolveSession. Returns 403 NextResponse if gated; otherwise null.
 *
 * @example
 *   const { businessId } = await resolveSession(req);
 *   if (!businessId) return NextResponse.json({ error: "Unauthorized" }, 401);
 *   const gated = await requireFeature(req, businessId, "export");
 *   if (gated) return gated;
 */
export async function requireFeature(
  req: NextRequest,
  businessId: string,
  feature: string
): Promise<NextResponse | null> {
  const tier = await getBusinessTier(businessId);
  if (hasFeature(tier, feature)) {
    return null;
  }
  return NextResponse.json(
    {
      error: `Upgrade to Pro or Premium to use this feature`,
      code: "FEATURE_GATED",
      feature,
    },
    { status: 403 }
  );
}
