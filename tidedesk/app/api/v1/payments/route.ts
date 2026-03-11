import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiKey } from "@/app/api/_lib/api-auth";

/**
 * GET /api/v1/payments
 * List payments. Requires API key (Premium).
 * Query: take, skip, bookingId, from, to
 */
export async function GET(req: NextRequest) {
  const auth = await resolveApiKey(req);
  if (auth.error) return auth.error;
  const businessId = auth.businessId!;

  const { searchParams } = new URL(req.url);
  const take = Math.min(Math.max(Number(searchParams.get("take") ?? 50) || 50, 1), 100);
  const skip = Math.max(Number(searchParams.get("skip") ?? 0) || 0, 0);
  const bookingId = searchParams.get("bookingId")?.trim();
  const from = searchParams.get("from")?.trim();
  const to = searchParams.get("to")?.trim();

  const where: Record<string, unknown> = { businessId };
  if (bookingId) where.bookingId = bookingId;
  if (from || to) {
    where.paidAt = {};
    if (from) (where.paidAt as Record<string, Date>).gte = new Date(from);
    if (to) (where.paidAt as Record<string, Date>).lte = new Date(to);
  }

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { paidAt: "desc" },
    take,
    skip,
    include: {
      booking: { select: { id: true, startAt: true } },
    },
  });

  const serialized = payments.map((p) => ({
    id: p.id,
    bookingId: p.bookingId,
    rentalId: p.rentalId,
    amount: Number(p.amount),
    currency: p.currency,
    method: p.method,
    provider: p.provider,
    status: p.status,
    paidAt: p.paidAt.toISOString(),
    externalReference: p.externalReference,
    createdAt: p.createdAt.toISOString(),
    booking: p.booking ? { id: p.booking.id, startAt: p.booking.startAt.toISOString() } : null,
  }));

  return NextResponse.json({ data: serialized });
}
