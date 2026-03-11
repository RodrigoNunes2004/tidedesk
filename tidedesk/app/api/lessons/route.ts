import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveBusinessId, resolveSession, rejectIfInstructor } from "../_lib/tenant";
import { requireFeature } from "@/lib/tiers/require-feature";

export async function GET(req: NextRequest) {
  const businessId = await resolveBusinessId(req);
  if (!businessId) {
    return NextResponse.json(
      { error: "Missing tenant. Provide x-business-id header." },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const takeRaw = searchParams.get("take");
  const skipRaw = searchParams.get("skip");
  const take = Math.min(Math.max(Number(takeRaw ?? 50) || 50, 1), 200);
  const skip = Math.max(Number(skipRaw ?? 0) || 0, 0);

  const lessons = await prisma.lesson.findMany({
    where: {
      businessId,
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });

  return NextResponse.json({ data: lessons });
}

export async function POST(req: NextRequest) {
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
  const title = typeof b.title === "string" ? b.title.trim() : "";

  const priceRaw = b.price;
  const price =
    typeof priceRaw === "string" || typeof priceRaw === "number"
      ? new Prisma.Decimal(priceRaw)
      : null;

  const capacityRaw = b.capacity;
  const capacity =
    typeof capacityRaw === "number" && Number.isFinite(capacityRaw)
      ? Math.trunc(capacityRaw)
      : typeof capacityRaw === "string" && capacityRaw.trim()
        ? Math.trunc(Number(capacityRaw))
        : null;

  const instructorId =
    typeof b.instructorId === "string" && b.instructorId.trim()
      ? b.instructorId.trim()
      : null;

  const depositAmountRaw = b.depositAmount;
  const depositAmount =
    depositAmountRaw === null || depositAmountRaw === undefined
      ? null
      : typeof depositAmountRaw === "string" || typeof depositAmountRaw === "number"
        ? new Prisma.Decimal(depositAmountRaw)
        : null;

  const durationRaw = b.durationMinutes;
  const durationMinutes =
    typeof durationRaw === "number" && Number.isFinite(durationRaw)
      ? Math.trunc(durationRaw)
      : typeof durationRaw === "string" && durationRaw.trim()
        ? Math.trunc(Number(durationRaw))
        : 60;
  if (durationMinutes < 1 || durationMinutes > 480) {
    return NextResponse.json(
      { error: "durationMinutes must be between 1 and 480." },
      { status: 400 },
    );
  }

  if (!title) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }
  if (!price) {
    return NextResponse.json({ error: "price is required." }, { status: 400 });
  }
  if (capacity !== null && (!Number.isFinite(capacity) || capacity < 0)) {
    return NextResponse.json(
      { error: "capacity must be a non-negative integer." },
      { status: 400 },
    );
  }

  if (instructorId) {
    const instr = await prisma.instructor.findFirst({
      where: { id: instructorId, businessId },
      select: { id: true },
    });
    if (!instr) {
      return NextResponse.json(
        { error: "instructorId not found for this business." },
        { status: 400 },
      );
    }
  }

  if (depositAmount !== null && Number(depositAmount) > 0) {
    const gated = await requireFeature(req, businessId, "deposits");
    if (gated) return gated;
  }
  if (depositAmount !== null && (Number(depositAmount) < 0 || Number(depositAmount) > Number(price))) {
    return NextResponse.json(
      { error: "depositAmount must be between 0 and the lesson price." },
      { status: 400 },
    );
  }

  const lesson = await prisma.lesson.create({
    data: {
      businessId,
      title,
      price,
      capacity,
      durationMinutes,
      instructorId,
      ...(depositAmount !== null && { depositAmount }),
    } as Parameters<typeof prisma.lesson.create>[0]["data"],
  });

  return NextResponse.json({ data: lesson }, { status: 201 });
}

