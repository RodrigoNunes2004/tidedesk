import { NextRequest } from "next/server";
import Stripe from "stripe";
import type { Prisma } from "@prisma/client";
import { RentalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notificationService } from "@/services/notificationService";
import { planFromPriceId } from "@/lib/tiers/stripe-plan";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key);
}

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events for Connect accounts, payments, and subscriptions.
 * Configure in Stripe Dashboard: Developers → Webhooks → Add endpoint
 * Events: account.updated, payment_intent.succeeded, payment_intent.payment_failed,
 *         charge.refunded, checkout.session.completed,
 *         customer.subscription.updated, customer.subscription.deleted
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
          where: { stripeAccountId: account.id } as unknown as Prisma.BusinessWhereInput,
        });
        if (business) {
          await prisma.business.update({
            where: { id: business.id },
            data: {
              chargesEnabled: account.charges_enabled ?? false,
              payoutsEnabled: account.payouts_enabled ?? false,
              detailsSubmitted: account.details_submitted ?? false,
            } as Parameters<typeof prisma.business.update>[0]["data"],
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
            const payment = await prisma.payment.create({
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
            if (rentalId) {
              await prisma.rental.updateMany({
                where: { id: rentalId, status: "PENDING" as RentalStatus },
                data: { status: RentalStatus.ACTIVE },
              });
            }
            try {
              await notificationService.sendPaymentReceipt(payment.id);
            } catch (e) {
              console.error("Payment receipt email failed:", e);
            }
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
            const payment = await prisma.payment.create({
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
            if (rentalId) {
              await prisma.rental.updateMany({
                where: { id: rentalId, status: "PENDING" as RentalStatus },
                data: { status: RentalStatus.ACTIVE },
              });
            }
            try {
              await notificationService.sendPaymentReceipt(payment.id);
            } catch (e) {
              console.error("Payment receipt email failed:", e);
            }
          }
          if (bookingId) {
            notificationService.sendBookingConfirmation(bookingId).catch((e) => {
              console.error("Booking confirmation email failed:", e);
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const existing = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (existing) {
          const priceId = sub.items?.data?.[0]?.price?.id;
          const plan = priceId ? planFromPriceId(priceId) : existing.plan;
          const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;
          await prisma.subscription.update({
            where: { id: existing.id },
            data: {
              status: sub.status ?? existing.status,
              plan,
              trialEndsAt: trialEnd ?? existing.trialEndsAt,
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: "canceled" },
        });
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
