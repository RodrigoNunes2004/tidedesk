/**
 * POST /api/stripe/checkout/upgrade
 * Creates a Stripe Checkout session for existing users to subscribe (Starter, Pro, or Premium).
 * Links the new subscription to their existing business. Redirects to /settings on success.
 */
import { NextRequest } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPriceIdForPlan } from "@/lib/tiers/stripe-plan";
import { TIERS } from "@/lib/tiers";

const VALID_PLANS = [TIERS.STARTER, TIERS.PRO, TIERS.PREMIUM];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.businessId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let plan = TIERS.PREMIUM;
  try {
    const body = await req.json().catch(() => ({}));
    const requested = typeof body.plan === "string" ? body.plan.toLowerCase().trim() : "";
    if (VALID_PLANS.includes(requested)) plan = requested;
  } catch {
    // use default
  }

  const priceId = getPriceIdForPlan(plan);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!process.env.STRIPE_SECRET_KEY || !priceId) {
    return Response.json(
      { error: "Stripe is not configured" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 30,
        metadata: { plan, businessId: session.user.businessId },
      },
      metadata: { businessId: session.user.businessId, plan },
      success_url: `${baseUrl}/settings?tab=billing&upgraded=1`,
      cancel_url: `${baseUrl}/settings?tab=billing`,
      allow_promotion_codes: true,
    });

    return Response.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe upgrade checkout error:", err);
    return Response.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
