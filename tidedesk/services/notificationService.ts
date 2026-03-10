/**
 * Notification service – centralized email notifications.
 * Sends booking confirmations, reminders, weather cancellations, and payment receipts.
 * Uses Resend for delivery and logs to Notification table.
 */
import { render } from "@react-email/components";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/integrations/email/resend";
import BookingConfirmationEmail from "@/emails/BookingConfirmationEmail";
import LessonReminderEmail from "@/emails/LessonReminderEmail";
import WeatherCancellationEmail from "@/emails/WeatherCancellationEmail";
import PaymentReceiptEmail from "@/emails/PaymentReceiptEmail";
import TrialEndingEmail from "@/emails/TrialEndingEmail";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(d: Date): string {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getLocation(b: { business?: { address?: string | null; location?: string | null } }): string {
  const addr = b.business?.address?.trim();
  const loc = b.business?.location?.trim();
  return addr || loc || "Check with the school";
}

function getRescheduleUrl(businessSlug: string | null): string | undefined {
  if (!businessSlug) return undefined;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/book/${businessSlug}`;
}

async function logNotification(params: {
  businessId: string;
  type: string;
  recipient: string;
  content: string;
  status: "SENT" | "FAILED";
  metadata?: Record<string, unknown>;
  error?: string;
}) {
  await db.notification.create({
    data: {
      businessId: params.businessId,
      type: params.type,
      channel: "EMAIL",
      recipient: params.recipient,
      content: params.content,
      status: params.status,
      sentAt: params.status === "SENT" ? new Date() : null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      error: params.error ?? null,
    },
  });
}

export const notificationService = {
  async sendBookingConfirmation(bookingId: string): Promise<boolean> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        lesson: true,
        instructor: true,
        business: true,
        payments: { where: { status: "PAID" }, select: { id: true } },
      },
    });

    if (!booking?.customer?.email?.trim()) return false;
    if (!booking.lesson) return false;

    const email = booking.customer.email.trim();
    const baseProps = {
      lessonName: booking.lesson.title,
      date: formatDate(booking.startAt),
      time: formatTime(booking.startAt),
      location: getLocation(booking),
      businessName: booking.business?.name ?? "Surf School",
      contactEmail: booking.business?.contactEmail?.trim() || email,
    };

    const paymentStatus =
      booking.payments.length > 0 ? "Paid" : "Pay later (cash/EFTPOS at the beach)";

    const html = await render(
      BookingConfirmationEmail({
        ...baseProps,
        customerName: `${booking.customer.firstName} ${booking.customer.lastName}`.trim(),
        participants: booking.participants,
        paymentStatus,
        bookingId,
        rescheduleUrl: getRescheduleUrl(booking.business?.slug ?? null),
      })
    );

    const result = await sendEmail({
      to: email,
      subject: `Booking confirmed – ${booking.lesson.title} | ${booking.business?.name ?? "Surf School"}`,
      html,
    });

    await logNotification({
      businessId: booking.businessId,
      type: "BOOKING_CONFIRMATION",
      recipient: email,
      content: `Booking confirmation for ${booking.lesson.title}`,
      status: result.success ? "SENT" : "FAILED",
      metadata: { bookingId },
      error: result.error,
    });

    return result.success;
  },

  async sendLessonReminder(bookingId: string): Promise<boolean> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        lesson: true,
        instructor: true,
        business: true,
      },
    });

    if (!booking?.customer?.email?.trim()) return false;
    if (!booking.lesson) return false;

    const email = booking.customer.email.trim();
    const baseProps = {
      lessonName: booking.lesson.title,
      date: formatDate(booking.startAt),
      time: formatTime(booking.startAt),
      location: getLocation(booking),
      businessName: booking.business?.name ?? "Surf School",
      contactEmail: booking.business?.contactEmail?.trim() || email,
    };

    const html = await render(
      LessonReminderEmail({
        ...baseProps,
        customerName: `${booking.customer.firstName} ${booking.customer.lastName}`.trim(),
        participants: booking.participants,
        rescheduleUrl: getRescheduleUrl(booking.business?.slug ?? null),
      })
    );

    const result = await sendEmail({
      to: email,
      subject: `Reminder: ${booking.lesson.title} tomorrow | ${booking.business?.name ?? "Surf School"}`,
      html,
    });

    await logNotification({
      businessId: booking.businessId,
      type: "BOOKING_REMINDER",
      recipient: email,
      content: `Lesson reminder for ${booking.lesson.title}`,
      status: result.success ? "SENT" : "FAILED",
      metadata: { bookingId },
      error: result.error,
    });

    return result.success;
  },

  async sendWeatherCancellation(bookingId: string, reason?: string): Promise<boolean> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        lesson: true,
        business: true,
      },
    });

    if (!booking?.customer?.email?.trim()) return false;
    if (!booking.lesson) return false;

    const email = booking.customer.email.trim();
    const baseProps = {
      lessonName: booking.lesson.title,
      date: formatDate(booking.startAt),
      time: formatTime(booking.startAt),
      location: getLocation(booking),
      businessName: booking.business?.name ?? "Surf School",
      contactEmail: booking.business?.contactEmail?.trim() || email,
    };

    const html = await render(
      WeatherCancellationEmail({
        ...baseProps,
        customerName: `${booking.customer.firstName} ${booking.customer.lastName}`.trim(),
        reason: reason ?? "Unsafe weather conditions",
        rescheduleUrl: getRescheduleUrl(booking.business?.slug ?? null),
      })
    );

    const result = await sendEmail({
      to: email,
      subject: `Lesson cancelled – ${booking.lesson.title} | ${booking.business?.name ?? "Surf School"}`,
      html,
    });

    await logNotification({
      businessId: booking.businessId,
      type: "WEATHER_ALERT",
      recipient: email,
      content: `Weather cancellation for ${booking.lesson.title}`,
      status: result.success ? "SENT" : "FAILED",
      metadata: { bookingId },
      error: result.error,
    });

    return result.success;
  },

  async sendPaymentReceipt(paymentId: string): Promise<boolean> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            customer: true,
            lesson: true,
            business: true,
          },
        },
        rental: {
          include: {
            customer: true,
            business: true,
          },
        },
        business: true,
      },
    });

    if (!payment) return false;

    // Payment can be for a booking or a rental
    const isBooking = !!payment.booking;
    const customer = payment.booking?.customer ?? payment.rental?.customer;
    const business = payment.business ?? payment.booking?.business ?? payment.rental?.business;

    if (!customer?.email?.trim() || !business) return false;

    const email = customer.email.trim();
    const amount = Number(payment.amount).toFixed(2);
    const currency = payment.currency ?? "NZD";

    let baseProps: {
      lessonName: string;
      date: string;
      time: string;
      location: string;
      businessName: string;
      contactEmail: string;
    };
    let itemDescription: string;

    if (isBooking && payment.booking?.lesson) {
      const b = payment.booking;
      const lesson = b.lesson!;
      baseProps = {
        lessonName: lesson.title,
        date: formatDate(b.startAt),
        time: formatTime(b.startAt),
        location: getLocation({ business }),
        businessName: business.name,
        contactEmail: business.contactEmail?.trim() || email,
      };
      itemDescription = `${lesson.title} × ${b.participants}`;
    } else if (payment.rental) {
      const r = payment.rental;
      baseProps = {
        lessonName: "Equipment rental",
        date: formatDate(r.startAt),
        time: formatTime(r.startAt),
        location: getLocation({ business }),
        businessName: business.name,
        contactEmail: business.contactEmail?.trim() || email,
      };
      itemDescription = "Equipment rental";
    } else {
      return false;
    }

    const html = await render(
      PaymentReceiptEmail({
        ...baseProps,
        customerName: `${customer.firstName} ${customer.lastName}`.trim(),
        amount,
        currency,
        itemDescription,
      })
    );

    const result = await sendEmail({
      to: email,
      subject: `Payment receipt – ${amount} ${currency} | ${business.name}`,
      html,
    });

    await logNotification({
      businessId: payment.businessId,
      type: "PAYMENT_RECEIPT",
      recipient: email,
      content: `Payment receipt ${amount} ${currency}`,
      status: result.success ? "SENT" : "FAILED",
      metadata: { paymentId },
      error: result.error,
    });

    return result.success;
  },

  /**
   * Send trial-ending reminder to business owner.
   * Used by cron when trial ends within N days.
   */
  async sendTrialEndingReminder(params: {
    businessId: string;
    ownerEmail: string;
    ownerName: string;
    businessName: string;
    trialEndDate: Date;
  }): Promise<boolean> {
    const { businessId, ownerEmail, ownerName, businessName, trialEndDate } = params;
    if (!ownerEmail?.trim()) return false;

    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const pricingUrl = `${base}/settings?tab=billing`;

    const html = await render(
      TrialEndingEmail({
        ownerName,
        businessName,
        trialEndDate: trialEndDate.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        pricingUrl,
      })
    );

    const result = await sendEmail({
      to: ownerEmail.trim(),
      subject: `Your TideDesk trial ends soon – ${businessName}`,
      html,
    });

    await logNotification({
      businessId,
      type: "TRIAL_ENDING",
      recipient: ownerEmail,
      content: `Trial ending reminder for ${businessName}`,
      status: result.success ? "SENT" : "FAILED",
      metadata: { trialEndDate: trialEndDate.toISOString() },
      error: result.error,
    });

    return result.success;
  },
};
