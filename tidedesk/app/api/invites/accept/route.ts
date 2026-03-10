import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

// Adapter narrows PrismaClient type and omits instructorInvite; runtime has it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const instructorInvite = (prisma as any).instructorInvite;

/**
 * GET: Validate token and return invite details for the accept page.
 * Public – no auth required.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token")?.trim();
  if (!token) {
    return Response.json({ error: "Invalid or missing invite token" }, { status: 400 });
  }

  const invite = await instructorInvite.findUnique({
    where: { token },
    include: { business: { select: { name: true } } },
  });

  if (!invite) {
    return Response.json({ error: "Invite not found or expired" }, { status: 404 });
  }
  if (invite.expiresAt < new Date()) {
    return Response.json({ error: "Invite has expired" }, { status: 400 });
  }

  return Response.json({
    email: invite.email,
    businessName: invite.business.name,
    token,
  });
}

/**
 * POST: Accept invite – set password and create instructor User.
 * Public – no auth required.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const token = typeof b.token === "string" ? b.token.trim() : "";
  const password = typeof b.password === "string" ? b.password : "";

  if (!token) {
    return Response.json({ error: "Invalid or missing invite token" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const invite = await instructorInvite.findUnique({
    where: { token },
    include: { business: { select: { id: true, name: true } } },
  });

  if (!invite) {
    return Response.json({ error: "Invite not found or expired" }, { status: 404 });
  }
  if (invite.expiresAt < new Date()) {
    return Response.json({ error: "Invite has expired" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email },
  });
  if (existingUser) {
    return Response.json(
      { error: "An account with this email already exists" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  // Create User with role INSTRUCTOR; name from email local part or "Instructor"
  const localPart = invite.email.split("@")[0] ?? "Instructor";
  const displayName =
    localPart.charAt(0).toUpperCase() + localPart.slice(1).replace(/[._-]/g, " ");

  await prisma.$transaction([
    prisma.user.create({
      data: {
        businessId: invite.businessId,
        email: invite.email,
        name: displayName,
        passwordHash,
        role: "INSTRUCTOR",
      },
    }),
    instructorInvite.delete({
      where: { id: invite.id },
    }),
  ]);

  return Response.json({
    ok: true,
    message: "Account created. You can now sign in.",
  });
}
