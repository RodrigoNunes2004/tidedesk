import { NextRequest } from "next/server";
import Stripe from "stripe";

export async function POST(_req: NextRequest) {
  const priceId = process.env.STRIPE_PRICE_ID;
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
      },
      success_url: `${baseUrl}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: baseUrl,
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
