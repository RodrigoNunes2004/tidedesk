import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";

export const WEBHOOK_EVENTS = ["booking.created", "payment.succeeded"] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/** Build payload for booking.created - call after booking is created. */
export async function buildBookingPayload(bookingId: string): Promise<Record<string, unknown> | null> {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      lesson: { select: { id: true, title: true, price: true, durationMinutes: true } },
      instructor: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!b) return null;
  return {
    id: b.id,
    businessId: b.businessId,
    customerId: b.customerId,
    lessonId: b.lessonId,
    instructorId: b.instructorId,
    startAt: b.startAt.toISOString(),
    endAt: b.endAt.toISOString(),
    participants: b.participants,
    status: b.status,
    depositPaid: Number(b.depositPaid ?? 0),
    balanceRemaining: b.balanceRemaining != null ? Number(b.balanceRemaining) : null,
    customer: b.customer,
    lesson: b.lesson ? { ...b.lesson, price: Number(b.lesson.price) } : null,
    instructor: b.instructor,
  };
}

/** Build payload for payment.succeeded */
export async function buildPaymentPayload(paymentId: string): Promise<Record<string, unknown> | null> {
  const p = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          customer: { select: { id: true, firstName: true, lastName: true } },
          lesson: { select: { id: true, title: true } },
        },
      },
    },
  });
  if (!p) return null;
  return {
    id: p.id,
    businessId: p.businessId,
    bookingId: p.bookingId,
    rentalId: p.rentalId,
    amount: Number(p.amount),
    currency: p.currency,
    method: p.method,
    provider: p.provider,
    status: p.status,
    paidAt: p.paidAt.toISOString(),
    booking: p.booking
      ? {
          id: p.booking.id,
          startAt: p.booking.startAt.toISOString(),
          customer: p.booking.customer,
          lesson: p.booking.lesson,
        }
      : null,
  };
}

export async function dispatchWebhook(
  businessId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
): Promise<void> {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: {
      businessId,
      isActive: true,
      events: { contains: event },
    },
  });

  for (const ep of endpoints) {
    try {
      const body = JSON.stringify({
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        type: event,
        created_at: new Date().toISOString(),
        data: { object: payload },
      });

      const signature = createHmac("sha256", ep.secret).update(body).digest("hex");

      const res = await fetch(ep.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TideDesk-Signature": `sha256=${signature}`,
          "X-TideDesk-Event": event,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });

      await prisma.webhookEndpoint.update({
        where: { id: ep.id },
        data: {
          lastTriggeredAt: new Date(),
          lastError: res.ok ? null : `HTTP ${res.status}: ${await res.text().catch(() => "")}`,
        },
      });

      if (!res.ok) {
        console.error(`Webhook ${ep.url} failed:`, res.status, await res.text());
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await prisma.webhookEndpoint.update({
        where: { id: ep.id },
        data: { lastTriggeredAt: new Date(), lastError: msg },
      });
      console.error(`Webhook ${ep.url} error:`, err);
    }
  }
}
