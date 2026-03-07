import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key);
}

/**
 * GET /api/payments/stripe/connect/refresh?business_id=xxx
 * Stripe redirects here when the onboarding link expired or user needs to retry.
 * We create a new account link and redirect back to Stripe.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.businessId) {
    redirect("/login");
  }

  const businessId = req.nextUrl.searchParams.get("business_id")?.trim();
  if (!businessId || businessId !== session.user.businessId) {
    redirect("/settings?error=invalid_business");
  }

  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { stripeAccountId: true },
    });

    if (!business?.stripeAccountId) {
      redirect("/settings?tab=payment&error=no_account");
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const returnUrl = `${baseUrl}/api/payments/stripe/connect/return?business_id=${businessId}`;
    const refreshUrl = `${baseUrl}/api/payments/stripe/connect/refresh?business_id=${businessId}`;

    const stripe = getStripe();
    const accountLink = await stripe.accountLinks.create({
      account: business.stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return NextResponse.redirect(accountLink.url);
  } catch (err) {
    console.error("Stripe Connect refresh error:", err);
    redirect("/settings?tab=payment&error=connect_refresh_failed");
  }
}
