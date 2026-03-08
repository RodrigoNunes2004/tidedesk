/**
 * Booking service – business logic for bookings.
 * Use this layer instead of calling Prisma directly from API routes.
 */
import { prisma } from "@/lib/prisma";

export const bookingService = {
  /** Bookings starting within [hoursAhead - window, hoursAhead + window] hours from now (for reminders). */
  async getUpcomingForReminder(hoursAhead: number, windowHours = 1) {
    const now = new Date();
    const from = new Date(now.getTime() + (hoursAhead - windowHours) * 60 * 60 * 1000);
    const to = new Date(now.getTime() + (hoursAhead + windowHours) * 60 * 60 * 1000);
    return prisma.booking.findMany({
      where: {
        status: { in: ["BOOKED", "CHECKED_IN"] },
        startAt: { gte: from, lte: to },
      },
      include: {
        customer: true,
        lesson: true,
        business: { select: { id: true, name: true } },
      },
    });
  },
};
