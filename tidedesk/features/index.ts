/**
 * TideDesk Feature Packages
 * Logical organization of features by pricing tier.
 * Use lib/tiers for runtime gating; use these for documentation and feature lists.
 */

export { starterFeatures, STARTER_FEATURE_META } from "./starter";
export { proFeatures, PRO_FEATURE_META } from "./pro";
export { premiumFeatures, PREMIUM_FEATURE_META } from "./premium";
