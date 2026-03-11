import { NextResponse, type NextRequest } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveApiKey } from "@/app/api/_lib/api-auth";

const BOOKING_STATUSES = Object.values(BookingStatus);

/**
 * GET /api/v1/bookings
 * List bookings. Requires API key (Premium).
 * Query: take, skip, customerId, lessonId, status
 */
export async function GET(req: NextRequest) {
  const auth = await resolveApiKey(req);
  if (auth.error) return auth.error;
  const businessId = auth.businessId!;

  const { searchParams } = new URL(req.url);
  const take = Math.min(Math.max(Number(searchParams.get("take") ?? 50) || 50, 1), 100);
  const skip = Math.max(Number(searchParams.get("skip") ?? 0) || 0, 0);
  const customerId = searchParams.get("customerId")?.trim();
  const lessonId = searchParams.get("lessonId")?.trim();
  const status = searchParams.get("status")?.trim();

  if (status && !BOOKING_STATUSES.includes(status as BookingStatus)) {
    return NextResponse.json(
      { error: `status must be one of: ${BOOKING_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  const bookings = await prisma.booking.findMany({
    where: {
      businessId,
      ...(customerId ? { customerId } : {}),
      ...(lessonId ? { lessonId } : {}),
      ...(status ? { status: status as BookingStatus } : {}),
    },
    orderBy: { startAt: "desc" },
    take,
    skip,
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      lesson: { select: { id: true, title: true, price: true, durationMinutes: true } },
      instructor: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  const serialized = bookings.map((b) => ({
    id: b.id,
    customerId: b.customerId,
    lessonId: b.lessonId,
    instructorId: b.instructorId,
    startAt: b.startAt.toISOString(),
    endAt: b.endAt.toISOString(),
    participants: b.participants,
    status: b.status,
    externalReference: b.externalReference,
    depositPaid: Number(b.depositPaid ?? 0),
    balanceRemaining: b.balanceRemaining != null ? Number(b.balanceRemaining) : null,
    createdAt: b.createdAt.toISOString(),
    customer: b.customer,
    lesson: b.lesson ? { ...b.lesson, price: Number(b.lesson.price) } : null,
    instructor: b.instructor,
  }));

  return NextResponse.json({ data: serialized });
}
