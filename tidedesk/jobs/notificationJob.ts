/**
 * Notification job – sends booking reminders (24h before).
 * Sends both SMS and email when available.
 * Run via Vercel Cron: GET /api/cron/notifications
 */
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/modules/notifications/notificationService";
import { notificationService } from "@/services/notificationService";
import { bookingService } from "@/services/bookingService";

// Adapter-based client loses some model types in IDE; use asserted client (see prisma/seed.ts)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

const REMINDER_HOURS_AHEAD = 24; // Send reminders for bookings starting in ~24h

export async function runNotificationJob() {
  const bookings = await bookingService.getUpcomingForReminder(REMINDER_HOURS_AHEAD);
  let smsSent = 0;
  let emailSent = 0;

  for (const booking of bookings) {
    const lessonTitle = booking.lesson?.title ?? "Lesson";
    const start = new Date(booking.startAt);
    const timeStr = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateStr = start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

    // SMS reminder
    const existingSms = await db.notification.findFirst({
      where: {
        type: "BOOKING_REMINDER",
        channel: "SMS",
        metadata: { contains: `"bookingId":"${booking.id}"` },
      },
    });
    if (!existingSms) {
      const phone = booking.customer.phone?.trim();
      if (phone) {
        const content = `${booking.business.name}: Reminder - ${lessonTitle} on ${dateStr} at ${timeStr}. See you soon!`;
        const ok = await sendNotification({
          businessId: booking.businessId,
          type: "BOOKING_REMINDER",
          channel: "SMS",
          recipient: phone,
          content,
          metadata: { bookingId: booking.id },
        });
        if (ok) smsSent++;
      }
    }

    // Email reminder
    const existingEmail = await db.notification.findFirst({
      where: {
        type: "BOOKING_REMINDER",
        channel: "EMAIL",
        metadata: { contains: `"bookingId":"${booking.id}"` },
      },
    });
    if (!existingEmail && booking.customer.email?.trim()) {
      try {
        const ok = await notificationService.sendLessonReminder(booking.id);
        if (ok) emailSent++;
      } catch (err) {
        console.error(`Reminder email failed for booking ${booking.id}:`, err);
      }
    }
  }

  return { processed: bookings.length, smsSent, emailSent };
}
