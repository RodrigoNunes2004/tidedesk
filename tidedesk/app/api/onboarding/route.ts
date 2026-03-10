import { NextRequest } from "next/server";
import { randomBytes, scrypt as _scrypt } from "crypto";
import { promisify } from "util";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { planFromPriceId } from "@/lib/tiers/stripe-plan";

const scrypt = promisify(_scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$$${salt}$${derivedKey.toString("hex")}`;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const sessionId = typeof b.sessionId === "string" ? b.sessionId.trim() : "";
  const businessName = typeof b.businessName === "string" ? b.businessName.trim() : "";
  const ownerName = typeof b.ownerName === "string" ? b.ownerName.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";
  const timezone = typeof b.timezone === "string" ? b.timezone : "Pacific/Auckland";
  const currency = typeof b.currency === "string" ? b.currency : "NZD";

  if (!sessionId || !businessName || !ownerName || !email || !password) {
    return Response.json(
      { error: "Missing required fields: sessionId, businessName, ownerName, email, password" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json(
      { error: "Stripe is not configured" },
      { status: 500 }
    );
  }

  try {
    const stripe = getStripe();
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "subscription.default_payment_method"],
    });

    if (stripeSession.payment_status !== "unpaid" && stripeSession.payment_status !== "paid") {
      return Response.json(
        { error: "Invalid checkout session" },
        { status: 400 }
      );
    }

    const customerId =
      typeof stripeSession.customer === "string"
        ? stripeSession.customer
        : stripeSession.customer?.id;
    const subscription = stripeSession.subscription as Stripe.Subscription | null;
    const subscriptionId =
      typeof subscription === "string" ? subscription : subscription?.id;

    if (!customerId || !subscriptionId) {
      return Response.json(
        { error: "Checkout session missing customer or subscription" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return Response.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const baseSlug = slugify(businessName) || "business";
    let slug = baseSlug;
    let counter = 0;
    while (await prisma.business.findUnique({ where: { slug } })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const passwordHash = await hashPassword(password);

    const business = await prisma.business.create({
      data: {
        name: businessName,
        slug,
        timezone,
        currency,
      },
    });

    const owner = await prisma.user.create({
      data: {
        businessId: business.id,
        name: ownerName,
        email,
        passwordHash,
        role: "OWNER",
      },
    });

    const subscriptionData = subscription as Stripe.Subscription;
    const trialEnd = subscriptionData.trial_end
      ? new Date(subscriptionData.trial_end * 1000)
      : null;

    // Derive plan from Stripe subscription (checkout metadata or price ID)
    const metadataPlan = (subscriptionData.metadata?.plan as string)?.toLowerCase();
    let plan = "starter";
    if (metadataPlan === "pro" || metadataPlan === "premium") {
      plan = metadataPlan;
    } else {
      const priceId = subscriptionData.items?.data?.[0]?.price?.id;
      if (priceId) plan = planFromPriceId(priceId);
    }

    await prisma.subscription.create({
      data: {
        businessId: business.id,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: subscriptionData.status ?? "trialing",
        plan,
        trialEndsAt: trialEnd,
      },
    });

    return Response.json({
      ok: true,
      businessId: business.id,
      email: owner.email,
    });
  } catch (err) {
    console.error("Onboarding error:", err);
    return Response.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
