import { NextRequest } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/server/session";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key);
}

/**
 * POST /api/payments/stripe/connect
 * Creates or reuses a Stripe Connect Express account and returns an onboarding link URL.
 * Owner clicks "Connect Stripe" → backend creates account → redirect to Stripe.
 */
export async function POST(_req: NextRequest) {
  const session = await requireSession();
  const businessId = session.user.businessId!;

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const returnUrl = `${baseUrl}/api/payments/stripe/connect/return?business_id=${businessId}`;
  const refreshUrl = `${baseUrl}/api/payments/stripe/connect/refresh?business_id=${businessId}`;

  try {
    const stripe = getStripe();
    const business = await prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: { stripeAccountId: true },
    });

    let accountId = business.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "NZ",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;

      await prisma.business.update({
        where: { id: businessId },
        data: { stripeAccountId: accountId },
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return Response.json({ url: accountLink.url });
  } catch (err) {
    console.error("Stripe Connect error:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Failed to create Stripe Connect link";
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
