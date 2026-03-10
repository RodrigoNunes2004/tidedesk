import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { resolveSession, rejectIfInstructor } from "@/app/api/_lib/tenant";
import { notificationService } from "@/services/notificationService";

// Adapter narrows PrismaClient type and omits instructorInvite; runtime has it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const instructorInvite = (prisma as any).instructorInvite;

const EXPIRY_DAYS = 7;

export async function POST(req: NextRequest) {
  const { businessId, role } = await resolveSession(req);
  if (!businessId) {
    return Response.json(
      { error: "Missing tenant. Sign in to continue." },
      { status: 401 }
    );
  }
  const forbidden = rejectIfInstructor(role);
  if (forbidden) return forbidden;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!email) {
    return Response.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    const sameBusiness = existingUser.businessId === businessId;
    return Response.json(
      {
        error: sameBusiness
          ? "This person already has login access"
          : "An account with this email already exists",
      },
      { status: 400 }
    );
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { name: true },
  });
  if (!business) {
    return Response.json({ error: "Business not found" }, { status: 404 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);
  const token = randomBytes(32).toString("hex");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${baseUrl}/invite/accept?token=${token}`;

  const invite = await instructorInvite.upsert({
    where: {
      businessId_email: { businessId, email },
    },
    create: {
      businessId,
      email,
      token,
      expiresAt,
    },
    update: {
      token,
      expiresAt,
    },
  });

  const sent = await notificationService.sendInstructorInvite({
    businessId,
    businessName: business.name,
    email,
    inviteUrl,
    expiresInDays: EXPIRY_DAYS,
  });

  if (!sent) {
    return Response.json(
      { error: "Invite created but email failed to send. Check your email configuration." },
      { status: 500 }
    );
  }

  return Response.json({
    ok: true,
    message: "Invite sent",
    email: invite.email,
  });
}
