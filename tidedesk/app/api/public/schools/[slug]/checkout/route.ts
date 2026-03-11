import { NextRequest } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key);
}

/**
 * POST /api/public/schools/[slug]/checkout
 * Public endpoint – creates Stripe Checkout for a booking. No auth required.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug?.trim()) {
    return Response.json({ error: "Slug is required" }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const bookingId =
    typeof b.bookingId === "string" ? String(b.bookingId).trim() : "";
  const paymentType = (typeof b.paymentType === "string" ? b.paymentType : "full") as "deposit" | "full";

  if (!bookingId) {
    return Response.json({ error: "bookingId is required" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({
    where: { slug: slug.trim() },
  });
  if (!business) {
    return Response.json({ error: "School not found" }, { status: 404 });
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, businessId: business.id },
    include: {
      lesson: {
        select: { id: true, title: true, price: true, depositAmount: true } as {
          id: boolean;
          title: boolean;
          price: boolean;
          depositAmount: boolean;
        },
      },
      customer: { select: { firstName: true, lastName: true } },
      payments: {
        where: { provider: "STRIPE", status: "PAID" },
        select: { id: true },
      },
    },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!booking.lesson) {
    return Response.json({ error: "Booking has no lesson" }, { status: 400 });
  }

  const totalAmount = Number(booking.lesson.price) * booking.participants;
  const depositPaid = Number((booking as { depositPaid?: unknown }).depositPaid ?? 0);
  const isFullyPaid = depositPaid >= totalAmount - 0.01;

  if (isFullyPaid) {
    return Response.json({ error: "Booking already paid" }, { status: 400 });
  }

  if (!business.stripeAccountId || !business.chargesEnabled) {
    return Response.json(
      { error: "This school does not accept online payments yet" },
      { status: 400 }
    );
  }

  let amountCents: number;
  let lineItemName: string;

  if (paymentType === "deposit") {
    const depAmount = Number((booking.lesson as { depositAmount?: unknown }).depositAmount ?? 0);
    if (depAmount <= 0) {
      return Response.json({ error: "This lesson has no deposit option" }, { status: 400 });
    }
    if (depositPaid > 0) {
      return Response.json({ error: "Deposit already paid" }, { status: 400 });
    }
    amountCents = Math.round(depAmount * booking.participants * 100);
    lineItemName = `Deposit: ${booking.lesson.title} × ${booking.participants}`;
  } else {
    amountCents = Math.round(totalAmount * 100);
    lineItemName = `${booking.lesson.title} × ${booking.participants}`;
  }
  if (amountCents < 50) {
    return Response.json(
      { error: "Amount must be at least 0.50" },
      { status: 400 }
    );
  }

  const currency = (business.currency ?? "NZD").toLowerCase();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amountCents,
            product_data: {
              name: lineItemName,
              description: `${booking.customer.firstName} ${booking.customer.lastName} • ${new Date(booking.startAt).toLocaleDateString()}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/book/${slug}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/book/${slug}`,
      metadata: {
        bookingId,
        businessId: business.id,
        paymentType,
      },
    },
    { stripeAccount: business.stripeAccountId }
  );

  return Response.json({ url: checkoutSession.url });
}
