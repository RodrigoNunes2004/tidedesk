/**
 * Notification service – sends SMS/email via integrations.
 * Uses Twilio for SMS; future: Resend/SendGrid for email.
 */
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/integrations/twilio";

// Adapter-based client loses some model types in IDE; use asserted client (see prisma/seed.ts)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export type NotificationChannel = "SMS" | "EMAIL";

export type CreateNotificationInput = {
  businessId: string;
  type: "BOOKING_CONFIRMATION" | "BOOKING_REMINDER" | "WEATHER_ALERT";
  channel: NotificationChannel;
  recipient: string; // phone for SMS, email for EMAIL
  content: string;
  metadata?: Record<string, unknown>;
};

export async function sendNotification(input: CreateNotificationInput) {
  const { businessId, type, channel, recipient, content, metadata } = input;

  if (channel === "SMS") {
    const sent = await sendSms(recipient, content);
    await db.notification.create({
      data: {
        businessId,
        type,
        channel: "SMS",
        recipient,
        content,
        status: sent ? "SENT" : "FAILED",
        sentAt: sent ? new Date() : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
    return sent;
  }

  // TODO: Email channel (Resend/SendGrid)
  return false;
}
