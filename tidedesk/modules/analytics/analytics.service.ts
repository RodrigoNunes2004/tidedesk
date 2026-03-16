/**
 * Analytics service – computes metrics from Booking, Payment, Customer, etc.
 * All queries scoped by businessId. No cross-tenant data.
 */
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getInUseByVariant } from "@/lib/equipment-availability";
import type {
  AnalyticsRange,
  ChartPoint,
  RevenueByLessonPoint,
  RevenueByInstructorPoint,
  InstructorPerformance,
  EquipmentUtilization,
  StudentMetrics,
  AnalyticsResponse,
  UtilizationHeatmap,
  UtilizationHeatmapRow,
} from "./analytics.types";

const COMPLETED_BOOKING_STATUSES = [
  BookingStatus.BOOKED,
  BookingStatus.CHECKED_IN,
  BookingStatus.COMPLETED,
] as const;

const AT_RISK_DAYS = 90;

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

/** Get week start (Sunday) ISO date for grouping 90-day range. */
function weekStartKey(d: Date): string {
  const copy = new Date(d);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  return copy.toISOString().slice(0, 10);
}

export async function getRevenueAnalytics(
  businessId: string,
  range: AnalyticsRange
): Promise<{
  byDay: ChartPoint[];
  byLesson: RevenueByLessonPoint[];
  byInstructor: RevenueByInstructorPoint[];
  total: number;
  revenueLessons: number;
  revenueRentals: number;
}> {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - range);
  start.setHours(0, 0, 0, 0);
  const end = endOfDay(now);

  const [payments, lessons, instructors] = await Promise.all([
    prisma.payment.findMany({
      where: {
        businessId,
        status: PaymentStatus.PAID,
        paidAt: { gte: start, lte: end },
      },
      select: {
        amount: true,
        paidAt: true,
        bookingId: true,
        rentalId: true,
        booking: {
          select: {
            lessonId: true,
            instructorId: true,
            lesson: { select: { title: true } },
            instructor: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
    prisma.lesson.findMany({
      where: { businessId },
      select: { id: true, title: true },
    }),
    prisma.instructor.findMany({
      where: { businessId, isActive: true },
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  let revenueLessons = 0;
  let revenueRentals = 0;

  const groupByWeek = range === 90;
  const timeMap = new Map<string, number>();

  if (groupByWeek) {
    for (let w = 0; w < 14; w++) {
      const d = new Date(start);
      d.setDate(start.getDate() + w * 7);
      d.setDate(d.getDate() - d.getDay());
      const key = d.toISOString().slice(0, 10);
      timeMap.set(key, 0);
    }
  } else {
    for (let i = 0; i < range; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      timeMap.set(d.toISOString().slice(0, 10), 0);
    }
  }

  for (const p of payments) {
    const amt = Number(p.amount);
    if (p.bookingId) revenueLessons += amt;
    if (p.rentalId) revenueRentals += amt;
    const key = groupByWeek ? weekStartKey(p.paidAt) : p.paidAt.toISOString().slice(0, 10);
    if (timeMap.has(key)) {
      timeMap.set(key, (timeMap.get(key) ?? 0) + amt);
    }
  }

  const byDay: ChartPoint[] = Array.from(timeMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({
      label: groupByWeek
        ? `Wk ${new Date(date).toLocaleDateString("en-NZ", { day: "numeric", month: "short" })}`
        : new Date(date).toLocaleDateString("en-NZ", { day: "numeric", month: "short" }),
      amount,
      date,
    }));

  const lessonRevenue = new Map<string, { count: number; revenue: number }>();
  for (const l of lessons) {
    lessonRevenue.set(l.id, { count: 0, revenue: 0 });
  }
  const instructorRevenue = new Map<string, { lessons: number; revenue: number }>();
  for (const i of instructors) {
    instructorRevenue.set(i.id, { lessons: 0, revenue: 0 });
  }

  let total = 0;
  for (const p of payments) {
    const amt = Number(p.amount);
    total += amt;
    if (p.booking?.lessonId) {
      const entry = lessonRevenue.get(p.booking.lessonId);
      if (entry) {
        entry.count += 1;
        entry.revenue += amt;
      }
    }
    if (p.booking?.instructorId) {
      const entry = instructorRevenue.get(p.booking.instructorId);
      if (entry) {
        entry.lessons += 1;
        entry.revenue += amt;
      }
    }
  }

  const lessonTitles = Object.fromEntries(lessons.map((l) => [l.id, l.title]));
  const byLesson: RevenueByLessonPoint[] = Array.from(lessonRevenue.entries())
    .filter(([, v]) => v.count > 0 || v.revenue > 0)
    .map(([lessonId, v]) => ({
      lessonId,
      lessonTitle: lessonTitles[lessonId] ?? "Unknown",
      count: v.count,
      revenue: v.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const instructorNames = Object.fromEntries(
    instructors.map((i) => [i.id, `${i.firstName} ${i.lastName}`.trim()])
  );
  const byInstructor: RevenueByInstructorPoint[] = Array.from(instructorRevenue.entries())
    .filter(([, v]) => v.lessons > 0 || v.revenue > 0)
    .map(([instructorId, v]) => ({
      instructorId,
      instructorName: instructorNames[instructorId] ?? "Unknown",
      lessons: v.lessons,
      revenue: v.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return { byDay, byLesson, byInstructor, total, revenueLessons, revenueRentals };
}

export async function getBookingAnalytics(
  businessId: string,
  range: AnalyticsRange
): Promise<{
  byDay: { label: string; count: number; date: string }[];
  total: number;
  utilizationPercent: number;
}> {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - range);
  start.setHours(0, 0, 0, 0);
  const end = endOfDay(now);

  const [bookings, lessons] = await Promise.all([
    prisma.booking.findMany({
      where: {
        businessId,
        lessonId: { not: null },
        status: { in: [...COMPLETED_BOOKING_STATUSES] },
        startAt: { gte: start, lte: end },
      },
      select: { startAt: true, participants: true, lessonId: true },
    }),
    prisma.lesson.findMany({
      where: { businessId },
      select: { id: true, capacity: true },
    }),
  ]);

  const groupByWeek = range === 90;
  const timeCount = new Map<string, number>();

  if (groupByWeek) {
    for (let w = 0; w < 14; w++) {
      const d = new Date(start);
      d.setDate(start.getDate() + w * 7);
      d.setDate(d.getDate() - d.getDay());
      const key = d.toISOString().slice(0, 10);
      timeCount.set(key, 0);
    }
  } else {
    for (let i = 0; i < range; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      timeCount.set(d.toISOString().slice(0, 10), 0);
    }
  }

  let totalSpots = 0;
  for (const b of bookings) {
    const key = groupByWeek ? weekStartKey(b.startAt) : b.startAt.toISOString().slice(0, 10);
    if (timeCount.has(key)) {
      timeCount.set(key, (timeCount.get(key) ?? 0) + (b.participants || 1));
    }
    totalSpots += b.participants || 1;
  }

  const byDay = Array.from(timeCount.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      label: groupByWeek
        ? `Wk ${new Date(date).toLocaleDateString("en-NZ", { day: "numeric", month: "short" })}`
        : new Date(date).toLocaleDateString("en-NZ", { day: "numeric", month: "short" }),
      count,
      date,
    }));

  let totalCapacity = 0;
  for (const l of lessons) {
    totalCapacity += (l.capacity ?? 0) * range;
  }
  const utilizationPercent =
    totalCapacity > 0 ? Math.round((totalSpots / totalCapacity) * 100) : 0;

  return {
    byDay,
    total: bookings.length,
    utilizationPercent: Math.min(100, utilizationPercent),
  };
}

/** Mon=0, Tue=1, ..., Sun=6 (getDay: 0=Sun, 1=Mon, ... so (d+6)%7 maps Mon->0) */
function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export async function getUtilizationHeatmap(
  businessId: string,
  range: AnalyticsRange
): Promise<UtilizationHeatmap> {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - range);
  start.setHours(0, 0, 0, 0);
  const end = endOfDay(now);

  const [bookings, lessons] = await Promise.all([
    prisma.booking.findMany({
      where: {
        businessId,
        lessonId: { not: null },
        status: { in: [...COMPLETED_BOOKING_STATUSES] },
        startAt: { gte: start, lte: end },
      },
      select: { startAt: true, participants: true },
    }),
    prisma.lesson.findMany({
      where: { businessId },
      select: { capacity: true },
    }),
  ]);

  const totalCapacity = lessons.reduce((s, l) => s + (l.capacity ?? 0), 0);
  const dailySpots = new Map<string, number>();
  for (let i = 0; i < range; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dailySpots.set(d.toISOString().slice(0, 10), 0);
  }
  for (const b of bookings) {
    const key = b.startAt.toISOString().slice(0, 10);
    dailySpots.set(key, (dailySpots.get(key) ?? 0) + (b.participants ?? 1));
  }

  const weekRows = new Map<string, Map<number, number>>();
  for (let i = 0; i < range; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateKey = d.toISOString().slice(0, 10);
    const weekKey = weekStartKey(d);
    const wday = weekdayIndex(d);
    const spots = dailySpots.get(dateKey) ?? 0;
    const util = totalCapacity > 0 ? Math.min(100, Math.round((spots / totalCapacity) * 100)) : 0;
    if (!weekRows.has(weekKey)) {
      weekRows.set(weekKey, new Map());
    }
    weekRows.get(weekKey)!.set(wday, util);
  }

  const rows: UtilizationHeatmapRow[] = [];
  const sortedWeeks = Array.from(weekRows.keys()).sort();
  for (const weekKey of sortedWeeks) {
    const dayMap = weekRows.get(weekKey)!;
    const sun = new Date(weekKey);
    const mon = new Date(sun);
    mon.setDate(sun.getDate() + 1);
    const weekLabel = `${mon.toLocaleDateString("en-NZ", { day: "numeric", month: "short" })} week`;
    rows.push({
      weekLabel,
      mon: dayMap.get(0) ?? null,
      tue: dayMap.get(1) ?? null,
      wed: dayMap.get(2) ?? null,
      thu: dayMap.get(3) ?? null,
      fri: dayMap.get(4) ?? null,
      sat: dayMap.get(5) ?? null,
      sun: dayMap.get(6) ?? null,
    });
  }

  return { rows };
}

export async function getStudentAnalytics(
  businessId: string,
  range: AnalyticsRange
): Promise<StudentMetrics> {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - range);
  start.setHours(0, 0, 0, 0);
  const end = endOfDay(now);
  const atRiskCutoff = new Date(now);
  atRiskCutoff.setDate(now.getDate() - AT_RISK_DAYS);

  const customersWithBookings = await prisma.customer.findMany({
    where: {
      businessId,
      archivedAt: null,
      bookings: {
        some: {
          status: { in: [...COMPLETED_BOOKING_STATUSES] },
        },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      bookings: {
        where: {
          status: { in: [...COMPLETED_BOOKING_STATUSES] },
          startAt: { lte: end },
        },
        select: { startAt: true },
        orderBy: { startAt: "desc" as const },
        take: 1,
      },
    },
  });

  const firstBookings = await prisma.booking.groupBy({
    by: ["customerId"],
    where: {
      businessId,
      status: { in: [...COMPLETED_BOOKING_STATUSES] },
    },
    _min: { startAt: true },
  });
  const firstByCustomer = new Map(
    firstBookings.map((f) => [f.customerId, f._min.startAt!])
  );

  let newStudents = 0;
  let returningStudents = 0;
  const atRiskList: { customerId: string; name: string; email: string | null; lastSessionAt: Date; daysSinceLastSession: number }[] = [];

  for (const c of customersWithBookings) {
    if (c.bookings.length === 0) continue;
    const lastBooking = c.bookings[0]!.startAt;
    const first = firstByCustomer.get(c.id);
    if (first && first >= start) newStudents++;
    if (first && first < start && lastBooking >= start) returningStudents++;
    if (lastBooking < atRiskCutoff) {
      const daysSince = Math.floor((now.getTime() - lastBooking.getTime()) / (24 * 60 * 60 * 1000));
      atRiskList.push({
        customerId: c.id,
        name: `${c.firstName} ${c.lastName}`.trim() || "Unknown",
        email: c.email,
        lastSessionAt: lastBooking,
        daysSinceLastSession: daysSince,
      });
    }
  }

  atRiskList.sort((a, b) => b.daysSinceLastSession - a.daysSinceLastSession);

  const totalWithHistory = newStudents + returningStudents;
  const retentionPercent =
    totalWithHistory > 0 ? Math.round((returningStudents / totalWithHistory) * 100) : 0;

  return {
    newStudents,
    returningStudents,
    atRiskStudents: atRiskList.length,
    retentionPercent,
    atRiskList,
  };
}

export async function getInstructorAnalytics(
  businessId: string,
  range: AnalyticsRange
): Promise<InstructorPerformance[]> {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - range);
  start.setHours(0, 0, 0, 0);
  const end = endOfDay(now);

  const [instructors, bookings, payments] = await Promise.all([
    prisma.instructor.findMany({
      where: { businessId, isActive: true },
      select: { id: true, firstName: true, lastName: true, hourlyRate: true },
    }),
    prisma.booking.findMany({
      where: {
        businessId,
        instructorId: { not: null },
        status: { in: [...COMPLETED_BOOKING_STATUSES] },
        startAt: { gte: start, lte: end },
      },
      select: { instructorId: true, lesson: { select: { durationMinutes: true } } },
    }),
    prisma.payment.findMany({
      where: {
        businessId,
        status: PaymentStatus.PAID,
        bookingId: { not: null },
        paidAt: { gte: start, lte: end },
      },
      select: { amount: true, booking: { select: { instructorId: true } } },
    }),
  ]);

  const instructorStats = new Map<
    string,
    { lessons: number; revenue: number; minutes: number }
  >();
  for (const i of instructors) {
    instructorStats.set(i.id, { lessons: 0, revenue: 0, minutes: 0 });
  }

  for (const b of bookings) {
    if (b.instructorId) {
      const s = instructorStats.get(b.instructorId);
      if (s) {
        s.lessons += 1;
        s.minutes += b.lesson?.durationMinutes ?? 60;
      }
    }
  }
  for (const p of payments) {
    const instrId = p.booking?.instructorId;
    if (instrId) {
      const s = instructorStats.get(instrId);
      if (s) s.revenue += Number(p.amount);
    }
  }

  return instructors.map((i) => {
    const s = instructorStats.get(i.id) ?? { lessons: 0, revenue: 0, minutes: 0 };
    const rate = Number(i.hourlyRate ?? 0);
    const cost = rate * (s.minutes / 60);
    const utilizationPercent =
      s.revenue > 0 ? Math.round((cost / s.revenue) * 100) : 0;
    return {
      instructorId: i.id,
      instructorName: `${i.firstName} ${i.lastName}`.trim(),
      lessonsTaught: s.lessons,
      revenueGenerated: s.revenue,
      utilizationPercent: Math.min(100, utilizationPercent),
    };
  });
}

export async function getEquipmentAnalytics(
  businessId: string,
  _range: AnalyticsRange
): Promise<EquipmentUtilization[]> {
  const now = new Date();
  const startOfToday = startOfDay(now);
  const endOfToday = endOfDay(now);

  const variants = await prisma.equipmentVariant.findMany({
    where: { businessId, isActive: true },
    select: {
      id: true,
      label: true,
      totalQuantity: true,
      category: { select: { id: true, name: true } },
    },
  });

  const variantIds = variants.map((v) => v.id);
  const inUseMap = await getInUseByVariant(
    businessId,
    variantIds,
    startOfToday,
    endOfToday
  );

  const byCategory = new Map<
    string,
    { name: string; total: number; inUse: number }
  >();
  for (const v of variants) {
    const catId = v.category.id;
    const catName = v.category.name;
    if (!byCategory.has(catId)) {
      byCategory.set(catId, { name: catName, total: 0, inUse: 0 });
    }
    const entry = byCategory.get(catId)!;
    entry.total += v.totalQuantity;
    entry.inUse += inUseMap.get(v.id) ?? 0;
  }

  return Array.from(byCategory.entries()).map(
    ([categoryId, { name, total, inUse }]) => ({
      categoryId,
      categoryName: name,
      totalQuantity: total,
      inUse,
      utilizationPercent: total > 0 ? Math.round((inUse / total) * 100) : 0,
    })
  );
}

/**
 * Build full analytics response for a business.
 * Uses live queries for current period; DailyAnalytics for historical when available.
 */
export async function getAnalytics(
  businessId: string,
  range: AnalyticsRange
): Promise<Omit<AnalyticsResponse, "alerts">> {
  const [revenue, bookings, students, instructors, equipment, utilizationHeatmap] =
    await Promise.all([
      getRevenueAnalytics(businessId, range),
      getBookingAnalytics(businessId, range),
      getStudentAnalytics(businessId, range),
      getInstructorAnalytics(businessId, range),
      getEquipmentAnalytics(businessId, range),
      getUtilizationHeatmap(businessId, range),
    ]);

  return {
    revenue,
    bookings,
    students,
    instructors,
    equipment,
    utilizationHeatmap,
  };
}
