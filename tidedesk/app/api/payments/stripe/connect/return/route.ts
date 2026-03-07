import { NextRequest } from "next/server";
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
 * GET /api/payments/stripe/connect/return?business_id=xxx
 * Stripe redirects here when the user completes onboarding.
 * We fetch the account, update Business, and redirect to Settings.
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

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(business.stripeAccountId);

    const chargesEnabled = account.charges_enabled ?? false;
    const payoutsEnabled = account.payouts_enabled ?? false;
    const detailsSubmitted = account.details_submitted ?? false;

    await prisma.business.update({
      where: { id: businessId },
      data: {
        chargesEnabled,
        payoutsEnabled,
        detailsSubmitted,
      },
    });

    redirect("/settings?tab=payment&stripe_connected=1");
  } catch (err) {
    console.error("Stripe Connect return error:", err);
    redirect("/settings?tab=payment&error=connect_failed");
  }
}
