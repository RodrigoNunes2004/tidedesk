import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PaymentMethod } from "@prisma/client";
import { sendNotification } from "@/modules/notifications/notificationService";
import { notificationService } from "@/services/notificationService";
import { getIdempotencyResult, setIdempotencyResult } from "@/lib/idempotency";
import { validateLessonEndTime } from "@/lib/lesson-hours";
import { dispatchWebhook, buildBookingPayload } from "@/lib/webhooks/dispatch";

const ACTIVE_BOOKING_STATUSES = ["BOOKED", "CHECKED_IN"] as ("BOOKED" | "CHECKED_IN")[];

/**
 * POST /api/public/schools/[slug]/bookings
 * Public endpoint – creates customer (if new) + booking.
 * Supports Idempotency-Key header or idempotencyKey in body to prevent duplicate bookings on retry.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug?.trim()) {
    return Response.json({ error: "Slug is required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const idemKey =
    (typeof b.idempotencyKey === "string" && b.idempotencyKey.trim()) ||
    req.headers.get("idempotency-key")?.trim() ||
    null;

  if (idemKey) {
    const cached = await getIdempotencyResult(slug.trim(), idemKey);
    if (cached) {
      return Response.json(cached.body, { status: cached.status });
    }
  }
  const lessonId = typeof b.lessonId === "string" ? b.lessonId.trim() : "";
  const startAt =
    typeof b.startAt === "string" && b.startAt.trim()
      ? new Date(b.startAt)
      : b.startAt instanceof Date
        ? b.startAt
        : null;
  const instructorId =
    typeof b.instructorId === "string" ? b.instructorId.trim() : null;

  const firstName =
    typeof b.firstName === "string" ? b.firstName.trim() : "";
  const lastName =
    typeof b.lastName === "string" ? b.lastName.trim() : "";
  const email =
    typeof b.email === "string" ? b.email.trim().toLowerCase() : null;
  const phone = typeof b.phone === "string" ? b.phone.trim() : null;
  const participants =
    typeof b.participants === "number" && Number.isFinite(b.participants)
      ? Math.max(1, Math.min(100, Math.trunc(b.participants)))
      : typeof b.participants === "string"
        ? Math.max(1, Math.min(100, Math.trunc(Number(b.participants)) || 1))
        : 1;

  const boardVariantId =
    typeof b.boardVariantId === "string" ? b.boardVariantId.trim() : "";
  const wetsuitVariantId =
    typeof b.wetsuitVariantId === "string" ? b.wetsuitVariantId.trim() : "";

  if (!lessonId || !startAt || !Number.isFinite(startAt.getTime())) {
    return Response.json(
      { error: "lessonId and startAt are required" },
      { status: 400 }
    );
  }
  if (!firstName?.trim() || !lastName?.trim()) {
    return Response.json(
      { error: "firstName and lastName are required" },
      { status: 400 }
    );
  }
  if (firstName.length > 200 || lastName.length > 200) {
    return Response.json(
      { error: "Name fields are too long" },
      { status: 400 }
    );
  }
  if (!boardVariantId || !wetsuitVariantId) {
    return Response.json(
      { error: "boardVariantId and wetsuitVariantId are required" },
      { status: 400 }
    );
  }

  const business = await prisma.business.findUnique({
    where: { slug: slug.trim() },
  });
  if (!business) {
    return Response.json({ error: "School not found" }, { status: 404 });
  }
  const biz = business as {
    onlineBookingEnabled?: boolean;
    onlineBookingMessage?: string | null;
    timezone?: string | null;
  };
  if (biz.onlineBookingEnabled === false) {
    const customMsg = biz.onlineBookingMessage ? String(biz.onlineBookingMessage).trim() : "";
    const msg =
      customMsg || "Online booking is currently unavailable. Please contact the school to book.";
    return Response.json({ error: msg }, { status: 403 });
  }

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, businessId: business.id },
  });
  if (!lesson) {
    return Response.json({ error: "Lesson not found" }, { status: 404 });
  }

  if (!instructorId) {
    return Response.json(
      { error: "instructorId is required (select a valid slot)" },
      { status: 400 }
    );
  }

  const instructor = await prisma.instructor.findFirst({
    where: { id: instructorId, businessId: business.id },
  });
  if (!instructor) {
    return Response.json({ error: "Invalid instructor" }, { status: 400 });
  }

  const durationMinutes = lesson.durationMinutes ?? 60;
  const endAt = new Date(startAt.getTime() + durationMinutes * 60_000);

  // Surf lessons must end by 5pm (too dark for safe surfing)
  const lessonEndError = validateLessonEndTime(endAt, biz.timezone);
  if (lessonEndError) {
    return Response.json({ error: lessonEndError }, { status: 400 });
  }

  if (lesson.capacity != null && participants > lesson.capacity) {
    return Response.json(
      { error: `Maximum ${lesson.capacity} participants for this lesson` },
      { status: 400 }
    );
  }

  const equipmentAllocations = [
    { equipmentVariantId: boardVariantId, quantity: participants },
    { equipmentVariantId: wetsuitVariantId, quantity: participants },
  ];

  for (const alloc of equipmentAllocations) {
    const variant = await prisma.equipmentVariant.findFirst({
      where: {
        id: alloc.equipmentVariantId,
        businessId: business.id,
        isActive: true,
      },
    });
    if (!variant) {
      return Response.json(
        { error: "Invalid board or wetsuit selection" },
        { status: 400 }
      );
    }
  }

  const lessonPrice = (lesson as { price: Prisma.Decimal }).price;
  const amount = new Prisma.Decimal(participants).mul(lessonPrice);
  const payLater = b.payLater === true;
  const method: PaymentMethod = payLater
    ? (business.defaultPaymentMethod ?? PaymentMethod.CASH)
    : PaymentMethod.ONLINE;

  try {
    type TxResult = { booking: { id: string; startAt: Date; endAt: Date; participants: number }; customer: { id: string; firstName: string; lastName: string; phone: string | null } };
    const result = await prisma.$transaction(async (tx): Promise<TxResult> => {
      // Re-validate availability inside transaction to prevent race conditions
      const instructorOverlap = await tx.booking.findFirst({
        where: {
          businessId: business.id,
          instructorId: instructorId!,
          status: { in: ACTIVE_BOOKING_STATUSES },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
      });
      if (instructorOverlap) {
        throw new Error("SLOT_TAKEN");
      }

      const lessonCapacity = lesson.capacity ?? 999;
      const overlapSum = await tx.booking.aggregate({
        where: {
          businessId: business.id,
          lessonId,
          status: { in: ACTIVE_BOOKING_STATUSES },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
        _sum: { participants: true },
      });
      const alreadyBooked = overlapSum._sum.participants ?? 0;
      if (alreadyBooked + participants > lessonCapacity) {
        throw new Error("SLOT_FULL");
      }

      // Re-validate equipment availability inside transaction
      for (const alloc of equipmentAllocations) {
        const variant = await tx.equipmentVariant.findFirst({
          where: {
            id: alloc.equipmentVariantId,
            businessId: business.id,
            isActive: true,
          },
          select: { totalQuantity: true },
        });
        if (!variant) throw new Error("INVALID_EQUIPMENT");

        const [rentalSum, allocSum] = await Promise.all([
          tx.rental.aggregate({
            where: {
              equipmentVariantId: alloc.equipmentVariantId,
              status: { in: ["ACTIVE", "OVERDUE"] },
              startAt: { lt: endAt },
              endAt: { gt: startAt },
            },
            _sum: { quantity: true },
          }),
          tx.bookingEquipmentAllocation.aggregate({
            where: {
              equipmentVariantId: alloc.equipmentVariantId,
              booking: {
                businessId: business.id,
                status: { in: ACTIVE_BOOKING_STATUSES },
                startAt: { lt: endAt },
                endAt: { gt: startAt },
              },
            },
            _sum: { quantity: true },
          }),
        ]);
        const inUse =
          (rentalSum._sum.quantity ?? 0) + (allocSum._sum.quantity ?? 0);
        if (variant.totalQuantity - inUse < alloc.quantity) {
          throw new Error("EQUIPMENT_UNAVAILABLE");
        }
      }

      let customer = email
        ? await tx.customer.findFirst({
            where: {
              businessId: business.id,
              email,
              archivedAt: null,
            },
          })
        : null;

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            businessId: business.id,
            firstName,
            lastName,
            email: email ?? undefined,
            phone: phone ?? undefined,
          },
        });
      }

      const booking = await tx.booking.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          instructorId,
          lessonId,
          startAt,
          endAt,
          participants,
          status: "BOOKED",
        },
      });

      for (const alloc of equipmentAllocations) {
        await tx.bookingEquipmentAllocation.create({
          data: {
            bookingId: booking.id,
            equipmentVariantId: alloc.equipmentVariantId,
            quantity: alloc.quantity,
          },
        });
      }

      if (payLater) {
        await tx.payment.create({
          data: {
            businessId: business.id,
            bookingId: booking.id,
            amount,
            method,
            provider: "MANUAL",
            status: "PENDING",
          },
        });
      }
      // Pay now: Payment created by Stripe webhook on checkout.session.completed

      return {
        booking,
        customer,
      };
    });

    const payload = await buildBookingPayload(result.booking.id);
    if (payload) {
      dispatchWebhook(business.id, "booking.created", payload).catch((e) =>
        console.error("Webhook dispatch failed:", e)
      );
    }

    const customerRecord = result.customer as { phone?: string | null; email?: string | null };
    const customerPhone = customerRecord.phone?.trim();
    const customerEmail = customerRecord.email?.trim();

    if (customerPhone) {
      try {
        const start = new Date(result.booking.startAt);
        const timeStr = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const dateStr = start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
        const content = `${business.name}: Your ${lesson.title} is confirmed for ${dateStr} at ${timeStr}. See you then!`;
        await sendNotification({
          businessId: business.id,
          type: "BOOKING_CONFIRMATION",
          channel: "SMS",
          recipient: customerPhone,
          content,
          metadata: { bookingId: result.booking.id },
        });
      } catch (e) {
        console.error("Booking confirmation SMS failed:", e);
      }
    }

    if (customerEmail) {
      if (payLater) {
        notificationService.sendBookingConfirmation(result.booking.id).catch((e) => {
          console.error("Booking confirmation email failed:", e);
        });
      }
      // For pay-now: confirmation email is sent from Stripe webhook after payment
    }

    const successBody = {
      booking: {
        id: result.booking.id,
        startAt: result.booking.startAt,
        endAt: result.booking.endAt,
        participants: result.booking.participants,
      },
      lesson: {
        title: lesson.title,
        durationMinutes,
        price: Number(lesson.price),
      },
      customer: {
        firstName: result.customer.firstName,
        lastName: result.customer.lastName,
      },
    };

    if (idemKey) {
      await setIdempotencyResult(slug.trim(), idemKey, 201, successBody);
    }

    return Response.json(successBody, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Public booking error:", err);
    if (msg === "SLOT_TAKEN" || msg === "SLOT_FULL") {
      return Response.json(
        { error: "This time slot was just taken. Please choose another." },
        { status: 409 }
      );
    }
    if (msg === "EQUIPMENT_UNAVAILABLE") {
      return Response.json(
        { error: "Not enough equipment available. Please choose another time or size." },
        { status: 409 }
      );
    }
    if (msg === "INVALID_EQUIPMENT") {
      return Response.json(
        { error: "Invalid equipment selection." },
        { status: 400 }
      );
    }
    const errorMessage =
      process.env.NODE_ENV === "development"
        ? `Failed to create booking: ${msg}`
        : "Failed to create booking";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
