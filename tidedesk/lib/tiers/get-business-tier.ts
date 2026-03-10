import { prisma } from "@/lib/prisma";
import { TIERS, type Tier } from "./index";

/**
 * Resolve the subscription tier for a business.
 * During the 30-day free trial, returns Premium so all features are accessible.
 * Falls back to "starter" if no subscription exists (e.g. during onboarding).
 */
export async function getBusinessTier(businessId: string): Promise<Tier> {
  const sub = await prisma.subscription.findUnique({
    where: { businessId },
    select: { plan: true, trialEndsAt: true },
  });

  // During trial: full access (all features)
  const now = new Date();
  if (sub?.trialEndsAt && sub.trialEndsAt > now) {
    return TIERS.PREMIUM;
  }

  const plan = sub?.plan?.toLowerCase().trim() ?? TIERS.STARTER;
  if (plan === TIERS.PRO || plan === TIERS.PREMIUM) {
    return plan;
  }
  return TIERS.STARTER;
}

export type TierContext = {
  tier: Tier;
  trialEndsAt: Date | null;
  isTrialing: boolean;
};

/**
 * Full tier context for UI (banner, trial countdown, etc.).
 */
export async function getTierContext(businessId: string): Promise<TierContext> {
  const sub = await prisma.subscription.findUnique({
    where: { businessId },
    select: { plan: true, trialEndsAt: true },
  });

  const now = new Date();
  const isTrialing = Boolean(sub?.trialEndsAt && sub.trialEndsAt > now);

  const tier = isTrialing
    ? TIERS.PREMIUM
    : (() => {
        const plan = sub?.plan?.toLowerCase().trim() ?? TIERS.STARTER;
        if (plan === TIERS.PRO || plan === TIERS.PREMIUM) return plan;
        return TIERS.STARTER;
      })();

  return {
    tier,
    trialEndsAt: sub?.trialEndsAt ?? null,
    isTrialing,
  };
}
