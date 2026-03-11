import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBusinessTier } from "@/lib/tiers/get-business-tier";
import { hasFeature } from "@/lib/tiers";

/**
 * GET /api/public/schools/[slug]
 * Public endpoint – returns business info and lessons for the booking page.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug?.trim()) {
    return Response.json({ error: "Slug is required" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({
    where: { slug: slug.trim() },
  });

  if (!business) {
    return Response.json({ error: "School not found" }, { status: 404 });
  }
  const biz = business as { onlineBookingEnabled?: boolean; onlineBookingMessage?: string | null };

  const lessons = await prisma.lesson.findMany({
    where: { businessId: business.id },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      price: true,
      durationMinutes: true,
      capacity: true,
      depositAmount: true,
    } as {
      id: boolean;
      title: boolean;
      price: boolean;
      durationMinutes: boolean;
      capacity: boolean;
      depositAmount: boolean;
    },
  });

  const tier = await getBusinessTier(business.id);
  const hasDeposits = hasFeature(tier, "deposits");

  const allVariants = await prisma.equipmentVariant.findMany({
    where: {
      businessId: business.id,
      isActive: true,
      category: { isActive: true },
    },
    orderBy: [{ category: { name: "asc" } }, { label: "asc" }],
    select: {
      id: true,
      label: true,
      category: { select: { id: true, name: true } },
    },
  });

  const boardVariants = allVariants.filter(
    (v) => !v.category.name.toLowerCase().includes("wetsuit")
  );
  const wetsuitVariants = allVariants
    .filter((v) => v.category.name.toLowerCase().includes("wetsuit"))
    .sort((a, b) => a.label.localeCompare(b.label));

  const instructors = await prisma.instructor.findMany({
    where: { businessId: business.id, isActive: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true },
  });

  return Response.json({
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      location: business.location,
      timezone: business.timezone ?? "Pacific/Auckland",
      currency: business.currency ?? "NZD",
      logoUrl: business.logoUrl,
      canAcceptPayments: Boolean(
        business.stripeAccountId && business.chargesEnabled && business.payoutsEnabled
      ),
      hasDeposits,
      onlineBookingEnabled: biz.onlineBookingEnabled ?? true,
      onlineBookingMessage: (biz.onlineBookingMessage ? String(biz.onlineBookingMessage).trim() : "") || null,
    },
    lessons: lessons.map((l) => ({
      id: l.id,
      title: l.title,
      price: Number(l.price),
      depositAmount: l.depositAmount != null ? Number(l.depositAmount) : null,
      durationMinutes: l.durationMinutes,
      capacity: l.capacity,
    })),
    boardVariants,
    wetsuitVariants,
    hasInstructors: instructors.length > 0,
  });
}
