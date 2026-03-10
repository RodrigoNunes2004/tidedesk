import { TIERS, type Tier } from "./index";

/**
 * Map Stripe price IDs to TideDesk plan tier.
 * Set env vars: STRIPE_PRICE_ID_STARTER, STRIPE_PRICE_ID_PRO, STRIPE_PRICE_ID_PREMIUM
 * For single-plan setup, STRIPE_PRICE_ID is used for Starter.
 */
export function getPriceIdForPlan(plan: string): string | null {
  const key = `STRIPE_PRICE_ID_${plan.toUpperCase()}` as
    | "STRIPE_PRICE_ID_STARTER"
    | "STRIPE_PRICE_ID_PRO"
    | "STRIPE_PRICE_ID_PREMIUM";
  const id = process.env[key] ?? (plan === "starter" ? process.env.STRIPE_PRICE_ID : null);
  return id?.trim() || null;
}

/**
 * Map Stripe price ID to plan tier.
 */
export function planFromPriceId(priceId: string): Tier {
  const s = process.env.STRIPE_PRICE_ID_STARTER?.trim();
  const p = process.env.STRIPE_PRICE_ID_PRO?.trim();
  const pm = process.env.STRIPE_PRICE_ID_PREMIUM?.trim();
  if (priceId === pm) return TIERS.PREMIUM;
  if (priceId === p) return TIERS.PRO;
  if (priceId === s) return TIERS.STARTER;
  // Fallback: use STRIPE_PRICE_ID as starter if set
  if (priceId === process.env.STRIPE_PRICE_ID?.trim()) return TIERS.STARTER;
  return TIERS.STARTER;
}
