"use client";

import type { ReactNode } from "react";
import { hasFeature, type Tier } from "./index";
import Link from "next/link";
import { useDashboardContext } from "@/lib/dashboard-context";

type FeatureGateProps = {
  feature: string;
  /** Optional: overrides context tier (for server-rendered or standalone use) */
  tier?: Tier | null;
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Renders children only if the business tier has access to the feature.
 * Uses tier from DashboardContext when tier prop is omitted.
 *
 * @example
 *   <FeatureGate feature="export">
 *     <ExportButton type="customers" />
 *   </FeatureGate>
 */
export function FeatureGate({ feature, tier: tierProp, children, fallback }: FeatureGateProps) {
  const ctx = useDashboardContext();
  const tier = tierProp ?? ctx?.tier ?? null;
  const allowed = tier !== null && hasFeature(tier, feature);

  if (allowed) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return (
    <Link
      href="/pricing"
      className="text-sm text-muted-foreground hover:text-primary underline"
    >
      Upgrade for this feature
    </Link>
  );
}
