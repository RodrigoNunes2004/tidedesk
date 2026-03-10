import { NextRequest } from "next/server";
import Stripe from "stripe";
import { getPriceIdForPlan } from "@/lib/tiers/stripe-plan";
import { TIERS } from "@/lib/tiers";

const VALID_PLANS = [TIERS.STARTER, TIERS.PRO, TIERS.PREMIUM];

export async function POST(req: NextRequest) {
  let plan = TIERS.STARTER;
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
    const session = await stripe.checkout.sessions.create({
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
        metadata: { plan },
      },
      success_url: `${baseUrl}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      allow_promotion_codes: true,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return Response.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
