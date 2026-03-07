import { NextRequest } from "next/server";
import Stripe from "stripe";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key);
}

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events for Connect accounts and payments.
 * Configure in Stripe Dashboard: Developers → Webhooks → Add endpoint
 * Events: account.updated, payment_intent.succeeded, payment_intent.payment_failed,
 *         charge.refunded, checkout.session.completed
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return Response.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let body: string;
  let event: Stripe.Event;

  try {
    body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return Response.json({ error: "Missing stripe-signature" }, { status: 400 });
    }
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const business = await prisma.business.findFirst({
          where: { stripeAccountId: account.id },
        });
        if (business) {
          await prisma.business.update({
            where: { id: business.id },
            data: {
              chargesEnabled: account.charges_enabled ?? false,
              payoutsEnabled: account.payouts_enabled ?? false,
              detailsSubmitted: account.details_submitted ?? false,
            },
          });
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const metadata = paymentIntent.metadata as { bookingId?: string; rentalId?: string; businessId?: string } | null;
        const bookingId = metadata?.bookingId?.trim() ?? null;
        const rentalId = metadata?.rentalId?.trim() ?? null;
        const businessId = metadata?.businessId?.trim() ?? null;

        let resolvedBusinessId: string | null = businessId || null;
        if (!resolvedBusinessId && bookingId) {
          const b = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: { businessId: true },
          });
          resolvedBusinessId = b?.businessId ?? null;
        }
        if (!resolvedBusinessId && rentalId) {
          const r = await prisma.rental.findUnique({
            where: { id: rentalId },
            select: { businessId: true },
          });
          resolvedBusinessId = r?.businessId ?? null;
        }

        if (resolvedBusinessId) {
          const existing = await prisma.payment.findFirst({
            where: { stripePaymentIntentId: paymentIntent.id },
          });
          if (!existing) {
            await prisma.payment.create({
              data: {
                businessId: resolvedBusinessId,
                amount: (paymentIntent.amount ?? 0) / 100,
                currency: paymentIntent.currency?.toUpperCase() ?? "NZD",
                method: "CARD",
                provider: "STRIPE",
                status: "PAID",
                stripePaymentIntentId: paymentIntent.id,
                bookingId: bookingId || null,
                rentalId: rentalId || null,
              },
            });
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await prisma.payment.updateMany({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: { status: "FAILED" },
        });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;
        if (paymentIntentId) {
          await prisma.payment.updateMany({
            where: { stripePaymentIntentId: paymentIntentId },
            data: { status: "REFUNDED" },
          });
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata as Record<string, string> | null;
        const bookingId = metadata?.bookingId?.trim();
        const rentalId = metadata?.rentalId?.trim();
        const businessId = metadata?.businessId?.trim() ?? null;

        let resolvedBusinessId: string | null = businessId;
        if (!resolvedBusinessId && bookingId) {
          const b = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: { businessId: true },
          });
          resolvedBusinessId = b?.businessId ?? null;
        }
        if (!resolvedBusinessId && rentalId) {
          const r = await prisma.rental.findUnique({
            where: { id: rentalId },
            select: { businessId: true },
          });
          resolvedBusinessId = r?.businessId ?? null;
        }

        const pi = typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

        if (resolvedBusinessId && pi) {
          const existing = await prisma.payment.findFirst({
            where: { stripePaymentIntentId: pi },
          });
          if (!existing) {
            await prisma.payment.create({
              data: {
                businessId: resolvedBusinessId,
                amount: (session.amount_total ?? 0) / 100,
                currency: (session.currency ?? "nzd").toUpperCase(),
                method: "ONLINE",
                provider: "STRIPE",
                status: "PAID",
                stripePaymentIntentId: pi,
                stripeSessionId: session.id,
                bookingId: bookingId || null,
                rentalId: rentalId || null,
              },
            });
          }
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }
  } catch (err) {
    console.error(`Stripe webhook ${event.type} handler error:`, err);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
