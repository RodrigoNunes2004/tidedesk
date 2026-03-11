import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiKey } from "@/app/api/_lib/api-auth";

/**
 * GET /api/v1/bookings/:id
 * Get a single booking. Requires API key (Premium).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await resolveApiKey(req);
  if (auth.error) return auth.error;
  const businessId = auth.businessId!;

  const { id } = await params;
  const booking = await prisma.booking.findFirst({
    where: { id, businessId },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      lesson: { select: { id: true, title: true, price: true, durationMinutes: true } },
      instructor: { select: { id: true, firstName: true, lastName: true } },
      payments: { select: { id: true, amount: true, method: true, status: true, paidAt: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      ...booking,
      startAt: booking.startAt.toISOString(),
      endAt: booking.endAt.toISOString(),
      createdAt: booking.createdAt.toISOString(),
      depositPaid: Number(booking.depositPaid ?? 0),
      balanceRemaining: booking.balanceRemaining != null ? Number(booking.balanceRemaining) : null,
      lesson: booking.lesson ? { ...booking.lesson, price: Number(booking.lesson.price) } : null,
      payments: booking.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
        paidAt: p.paidAt.toISOString(),
      })),
    },
  });
}
