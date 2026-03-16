/**
 * Alerts service – generates actionable alerts from business metrics.
 * All logic scoped by businessId.
 */
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getInUseByVariant } from "@/lib/equipment-availability";
import type { AnalyticsAlert, AlertSeverity } from "./analytics.types";

const LOW_UTILIZATION_THRESHOLD = 70;
const EQUIPMENT_SHORTAGE_THRESHOLD = 3;
const REVENUE_DROP_THRESHOLD = 0.7; // 70% of last week

const BOOKING_STATUSES = [
  BookingStatus.BOOKED,
  BookingStatus.CHECKED_IN,
  BookingStatus.COMPLETED,
] as const;

function severity(type: string): AlertSeverity {
  if (type === "EQUIPMENT_SHORTAGE") return "high";
  if (type === "REVENUE_DROP") return "high";
  return "medium";
}

/**
 * Get all alerts for a business.
 */
export async function getAlerts(businessId: string): Promise<AnalyticsAlert[]> {
  const alerts: AnalyticsAlert[] = [];
  const now = new Date();

  // Low booking / utilization
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const endOfTomorrow = new Date(tomorrow);
  endOfTomorrow.setHours(23, 59, 59, 999);

  const [tomorrowBookings, lessons, variants, thisWeekRevenue, lastWeekRevenue] =
    await Promise.all([
      prisma.booking.count({
        where: {
          businessId,
          lessonId: { not: null },
          status: { in: [...BOOKING_STATUSES] },
          startAt: { gte: tomorrow, lte: endOfTomorrow },
        },
      }),
      prisma.lesson.findMany({
        where: { businessId },
        select: { capacity: true },
      }),
      prisma.equipmentVariant.findMany({
        where: { businessId, isActive: true },
        select: {
          id: true,
          label: true,
          totalQuantity: true,
          lowStockThreshold: true,
          category: { select: { name: true } },
        },
      }),
      prisma.payment.aggregate({
        where: {
          businessId,
          status: PaymentStatus.PAID,
          paidAt: { gte: startOfWeek, lte: endOfToday },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          businessId,
          status: PaymentStatus.PAID,
          paidAt: {
            gte: new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000),
            lt: startOfWeek,
          },
        },
        _sum: { amount: true },
      }),
    ]);

  // Capacity utilization for tomorrow
  const totalCapacity = lessons.reduce((s, l) => s + (l.capacity ?? 0), 0);
  const utilization =
    totalCapacity > 0 ? Math.round((tomorrowBookings / totalCapacity) * 100) : 0;
  if (totalCapacity > 0 && utilization < LOW_UTILIZATION_THRESHOLD) {
    alerts.push({
      type: "LOW_BOOKING",
      severity: severity("LOW_BOOKING"),
      message: `Low booking rate tomorrow: ${utilization}% capacity (${tomorrowBookings}/${totalCapacity} spots)`,
    });
  }

  // Equipment shortage
  const variantIds = variants.map((v) => v.id);
  const inUseMap =
    variantIds.length > 0
      ? await getInUseByVariant(businessId, variantIds, tomorrow, endOfTomorrow)
      : new Map<string, number>();

  for (const v of variants) {
    const inUse = inUseMap.get(v.id) ?? 0;
    const available = v.totalQuantity - inUse;
    const threshold = v.lowStockThreshold ?? EQUIPMENT_SHORTAGE_THRESHOLD;
    if (available < threshold && v.totalQuantity > 0) {
      alerts.push({
        type: "EQUIPMENT_SHORTAGE",
        severity: severity("EQUIPMENT_SHORTAGE"),
        message: `Only ${available} ${v.category.name} (${v.label}) available`,
      });
    }
  }

  // Revenue drop vs last week
  const thisWeek = Number(thisWeekRevenue._sum.amount ?? 0);
  const lastWeek = Number(lastWeekRevenue._sum.amount ?? 0);
  if (lastWeek > 0 && thisWeek < lastWeek * REVENUE_DROP_THRESHOLD) {
    const drop = Math.round(((lastWeek - thisWeek) / lastWeek) * 100);
    alerts.push({
      type: "REVENUE_DROP",
      severity: severity("REVENUE_DROP"),
      message: `Revenue down ${drop}% vs last week`,
    });
  }

  return alerts;
}
