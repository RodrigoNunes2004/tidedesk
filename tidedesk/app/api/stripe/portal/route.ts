import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!session?.user?.businessId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json(
      { error: "Stripe is not configured" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { businessId: session.user.businessId },
    });

    if (!subscription?.stripeCustomerId) {
      return Response.json(
        { error: "No billing account found. Subscribe first." },
        { status: 400 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${baseUrl}/settings`,
    });

    return Response.json({ url: portalSession.url });
  } catch (err) {
    console.error("Stripe portal error:", err);
    return Response.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
