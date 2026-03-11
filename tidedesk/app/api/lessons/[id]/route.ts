import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveBusinessId, resolveSession, rejectIfInstructor } from "../../_lib/tenant";
import { requireFeature } from "@/lib/tiers/require-feature";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const businessId = await resolveBusinessId(req);
  if (!businessId) {
    return NextResponse.json(
      { error: "Missing tenant. Provide x-business-id header." },
      { status: 400 },
    );
  }

  const lesson = await prisma.lesson.findFirst({
    where: { id, businessId },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ data: lesson });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { businessId, role } = await resolveSession(req);
  if (!businessId) {
    return NextResponse.json(
      { error: "Missing tenant. Provide x-business-id header." },
      { status: 400 },
    );
  }
  const forbidden = rejectIfInstructor(role);
  if (forbidden) return forbidden;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (typeof b.title === "string") data.title = b.title.trim();

  if (typeof b.price === "string" || typeof b.price === "number") {
    data.price = new Prisma.Decimal(b.price);
  }

  if (typeof b.capacity === "number" || typeof b.capacity === "string") {
    const n = Math.trunc(Number(b.capacity));
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json(
        { error: "capacity must be a non-negative integer." },
        { status: 400 },
      );
    }
    data.capacity = n;
  }
  if (b.capacity === null) data.capacity = null;

  if (typeof b.durationMinutes === "number" || typeof b.durationMinutes === "string") {
    const n = Math.trunc(Number(b.durationMinutes));
    if (!Number.isFinite(n) || n < 15 || n > 480) {
      return NextResponse.json(
        { error: "durationMinutes must be between 15 and 480." },
        { status: 400 },
      );
    }
    data.durationMinutes = n;
  }

  if (typeof b.depositAmount === "string" || typeof b.depositAmount === "number") {
    const dep = new Prisma.Decimal(b.depositAmount);
    if (Number(dep) < 0) {
      return NextResponse.json(
        { error: "depositAmount must be non-negative." },
        { status: 400 },
      );
    }
    data.depositAmount = dep;
  }
  if (b.depositAmount === null) data.depositAmount = null;

  if (data.depositAmount !== undefined && Number(data.depositAmount) > 0) {
    const gated = await requireFeature(req, businessId, "deposits");
    if (gated) return gated;
  }

  if (typeof b.instructorId === "string") {
    const v = b.instructorId.trim();
    if (!v) {
      return NextResponse.json(
        { error: "instructorId cannot be empty string (use null to clear)." },
        { status: 400 },
      );
    }
    const instr = await prisma.instructor.findFirst({
      where: { id: v, businessId },
      select: { id: true },
    });
    if (!instr) {
      return NextResponse.json(
        { error: "instructorId not found for this business." },
        { status: 400 },
      );
    }
    data.instructorId = v;
  }
  if (b.instructorId === null) data.instructorId = null;

  if ("title" in data && !(data.title as string)) {
    return NextResponse.json({ error: "title cannot be empty." }, { status: 400 });
  }

  const exists = await prisma.lesson.findFirst({ where: { id, businessId } });
  if (!exists) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const finalPrice = (data.price as Prisma.Decimal) ?? exists.price;
  const existsDeposit = (exists as typeof exists & { depositAmount?: unknown }).depositAmount;
  const finalDeposit = (data.depositAmount as Prisma.Decimal | null) ?? existsDeposit;
  if (finalDeposit !== null && Number(finalDeposit) > Number(finalPrice)) {
    return NextResponse.json(
      { error: "depositAmount cannot exceed the lesson price." },
      { status: 400 },
    );
  }

  const updated = await prisma.lesson.update({
    where: { id },
    data,
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { businessId, role } = await resolveSession(req);
  if (!businessId) {
    return NextResponse.json(
      { error: "Missing tenant. Provide x-business-id header." },
      { status: 400 },
    );
  }
  const forbidden = rejectIfInstructor(role);
  if (forbidden) return forbidden;

  const exists = await prisma.lesson.findFirst({ where: { id, businessId } });
  if (!exists) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await prisma.lesson.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

