/**
 * TideDesk Tier Configuration
 * Single source of truth for plan tiers and feature-to-tier mapping.
 * Aligns with PRICING_STRATEGY.md.
 */

export const TIERS = {
  STARTER: "starter",
  PRO: "pro",
  PREMIUM: "premium",
} as const;

export type Tier = (typeof TIERS)[keyof typeof TIERS];

/** Features that require at least this tier. Lower tiers inherit from higher. */
export const FEATURE_TIERS: Record<string, Tier> = {
  // Starter ($69): CRM, bookings, rentals, payments, dashboard
  crm: TIERS.STARTER,
  bookings: TIERS.STARTER,
  rentals: TIERS.STARTER,
  payments: TIERS.STARTER,
  dashboard: TIERS.STARTER,
  equipment: TIERS.STARTER,
  instructors: TIERS.STARTER,
  revenue: TIERS.STARTER,

  // Pro ($129): weather, SMS, booking-widget, deposits, instructor-portal
  weather: TIERS.PRO,
  sms: TIERS.PRO,
  "booking-widget": TIERS.PRO,
  deposits: TIERS.PRO,
  "instructor-portal": TIERS.PRO,

  // Premium ($199): windguru, offline, analytics, pos, api, white-label
  windguru: TIERS.PREMIUM,
  offline: TIERS.PREMIUM,
  analytics: TIERS.PREMIUM,
  pos: TIERS.PREMIUM,
  api: TIERS.PREMIUM,
  "white-label": TIERS.PREMIUM,

  // Export CSV is Pro+
  export: TIERS.PRO,

  // Integrations (e.g. FareHarbor) - Premium
  integrations: TIERS.PREMIUM,
};

/** Tier order for comparison. Higher index = higher tier. */
const TIER_ORDER: Tier[] = [TIERS.STARTER, TIERS.PRO, TIERS.PREMIUM];

function tierIndex(tier: string): number {
  const idx = TIER_ORDER.indexOf(tier as Tier);
  return idx >= 0 ? idx : 0;
}

/**
 * Whether the given tier has access to the feature.
 * @param tier - Business subscription plan
 * @param feature - Feature key from FEATURE_TIERS
 */
export function hasFeature(tier: string, feature: string): boolean {
  const requiredTier = FEATURE_TIERS[feature];
  if (!requiredTier) return true; // Unknown feature = allow (backwards compat)
  return tierIndex(tier) >= tierIndex(requiredTier);
}

/** All features in the Starter package. */
export const FEATURES_STARTER = Object.entries(FEATURE_TIERS)
  .filter(([, t]) => t === TIERS.STARTER)
  .map(([k]) => k);

/** All features in the Pro package (excludes Starter). */
export const FEATURES_PRO = Object.entries(FEATURE_TIERS)
  .filter(([, t]) => t === TIERS.PRO)
  .map(([k]) => k);

/** All features in the Premium package (excludes Pro/Starter). */
export const FEATURES_PREMIUM = Object.entries(FEATURE_TIERS)
  .filter(([, t]) => t === TIERS.PREMIUM)
  .map(([k]) => k);
