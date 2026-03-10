/**
 * Premium tier feature package ($199)
 * Enterprise features for advanced use cases.
 */

import { FEATURES_PREMIUM } from "@/lib/tiers";

export const premiumFeatures = FEATURES_PREMIUM;

export const PREMIUM_FEATURE_META = {
  windguru: { label: "WindGuru integration", description: "Sync forecasts and conditions from WindGuru" },
  offline: { label: "Offline mode", description: "PWA, service worker, work offline" },
  analytics: { label: "Advanced analytics", description: "Custom ranges, cohort reports" },
  pos: { label: "POS beach mode", description: "Tablet-optimized quick check-in/return" },
  api: { label: "API access", description: "Public API, webhooks for integrations" },
  "white-label": { label: "White label", description: "Custom domain, remove TideDesk branding" },
  integrations: { label: "Integrations", description: "FareHarbor, external booking systems" },
} as const;
