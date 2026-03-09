/**
 * Notification service – sends SMS/email via integrations.
 * Uses Twilio for SMS; Resend for email.
 */
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/integrations/twilio";
import { sendEmail } from "@/integrations/email/resend";

// Adapter-based client loses some model types in IDE; use asserted client (see prisma/seed.ts)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export type NotificationChannel = "SMS" | "EMAIL";

export type CreateNotificationInput = {
  businessId: string;
  type: "BOOKING_CONFIRMATION" | "BOOKING_REMINDER" | "WEATHER_ALERT" | "PAYMENT_RECEIPT";
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

  if (channel === "EMAIL") {
    const subject = content.split("\n")[0]?.slice(0, 78) ?? "Notification";
    const escapedContent = content.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
    const result = await sendEmail({
      to: recipient,
      subject,
      html: `<p style="font-family: sans-serif;">${escapedContent}</p>`,
    });
    await db.notification.create({
      data: {
        businessId,
        type,
        channel: "EMAIL",
        recipient,
        content,
        status: result.success ? "SENT" : "FAILED",
        sentAt: result.success ? new Date() : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        error: result.error ?? null,
      },
    });
    return result.success;
  }

  return false;
}
