import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { notificationService } from "@/services/notificationService";

/**
 * Vercel Cron – sends trial-ending reminders to business owners.
 * Runs daily at 09:00 UTC.
 * Sends to businesses whose trial ends in the next 3 days, at most once per business per 4 days.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const inThreeDays = new Date(now);
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  const fourDaysAgo = new Date(now);
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

  // Subscriptions with trial ending in next 3 days
  const subs = await prisma.subscription.findMany({
    where: {
      trialEndsAt: { gt: now, lte: inThreeDays },
    },
    include: {
      business: {
        include: {
          users: {
            where: { role: "OWNER" },
            take: 1,
            select: { email: true, name: true },
          },
        },
      },
    },
  });

  let sent = 0;
  for (const sub of subs) {
    const owner = sub.business.users[0];
    if (!owner?.email?.trim()) continue;

    // Avoid spam: skip if we sent TRIAL_ENDING recently (TRIAL_ENDING added to schema; run prisma generate)
    const recent = await prisma.notification.findFirst({
      where: {
        businessId: sub.businessId,
        type: "TRIAL_ENDING" as never,
        createdAt: { gte: fourDaysAgo },
      },
    });
    if (recent) continue;

    try {
      const ok = await notificationService.sendTrialEndingReminder({
        businessId: sub.businessId,
        ownerEmail: owner.email,
        ownerName: owner.name ?? "there",
        businessName: sub.business.name,
        trialEndDate: sub.trialEndsAt!,
      });
      if (ok) sent++;
    } catch (e) {
      console.error(`Trial reminder failed for ${sub.businessId}:`, e);
    }
  }

  return Response.json({ processed: subs.length, sent });
}
