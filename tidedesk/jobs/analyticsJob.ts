/**
 * Analytics job – computes daily metrics per business and stores in DailyAnalytics.
 * Run via Vercel Cron: GET /api/cron/analytics
 */
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Adapter-based client narrows PrismaClient type; runtime has dailyAnalytics.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

const COMPLETED_BOOKING_STATUSES = [
  BookingStatus.BOOKED,
  BookingStatus.CHECKED_IN,
  BookingStatus.COMPLETED,
] as const;

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

/**
 * Compute yesterday's metrics for a business and upsert into DailyAnalytics.
 */
async function computeAndStoreDailyMetrics(businessId: string, date: Date) {
  const start = startOfDay(date);
  const end = endOfDay(date);

  const [revenueLessonsSum, revenueRentalsSum, bookings, lessons] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        businessId,
        status: PaymentStatus.PAID,
        bookingId: { not: null },
        paidAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        businessId,
        status: PaymentStatus.PAID,
        rentalId: { not: null },
        paidAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    prisma.booking.findMany({
      where: {
        businessId,
        lessonId: { not: null },
        status: { in: [...COMPLETED_BOOKING_STATUSES] },
        startAt: { gte: start, lte: end },
      },
      select: { customerId: true, participants: true },
    }),
    prisma.lesson.findMany({
      where: { businessId },
      select: { capacity: true },
    }),
  ]);

  const bookingsCount = bookings.length;

  const students = new Set(bookings.map((b) => b.customerId)).size;
  const totalCapacity = lessons.reduce((s, l) => s + (l.capacity ?? 0), 0);
  const totalSpots = bookings.reduce((s, b) => s + (b.participants ?? 1), 0);
  const utilization =
    totalCapacity > 0 ? Math.min(100, (totalSpots / totalCapacity) * 100) : 0;
  const revenueLessons = Number(revenueLessonsSum._sum.amount ?? 0);
  const revenueRentals = Number(revenueRentalsSum._sum.amount ?? 0);
  const revenue = revenueLessons + revenueRentals;

  await db.dailyAnalytics.upsert({
    where: {
      businessId_date: { businessId, date: start },
    },
    create: {
      businessId,
      date: start,
      bookings: bookingsCount,
      revenue,
      revenueLessons,
      revenueRentals,
      students,
      utilization,
    },
    update: {
      bookings: bookingsCount,
      revenue,
      revenueLessons,
      revenueRentals,
      students,
      utilization,
    },
  });
}

export async function runAnalyticsJob() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDate = startOfDay(yesterday);

  const businesses = await prisma.business.findMany({
    select: { id: true },
  });

  let processed = 0;
  for (const biz of businesses) {
    try {
      await computeAndStoreDailyMetrics(biz.id, targetDate);
      processed++;
    } catch (err) {
      console.error(`Analytics job error for business ${biz.id}:`, err);
    }
  }

  return { businesses: businesses.length, processed };
}
