import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/server/session";
import { requireFeature } from "@/lib/tiers/require-feature";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/dispatch";

/**
 * PATCH /api/webhook-endpoints/:id
 * Update webhook endpoint. Session auth. Premium only.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  const businessId = session.user.businessId;
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gated = await requireFeature(req, businessId, "api");
  if (gated) return gated;

  const { id } = await params;
  const endpoint = await prisma.webhookEndpoint.findFirst({
    where: { id, businessId },
  });

  if (!endpoint) {
    return NextResponse.json({ error: "Webhook endpoint not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as { url?: string; events?: string[]; isActive?: boolean };
  const data: { url?: string; events?: string; isActive?: boolean } = {};

  if (typeof b.url === "string" && b.url.trim()) {
    try {
      new URL(b.url.trim());
      data.url = b.url.trim();
    } catch {
      return NextResponse.json({ error: "url must be a valid URL" }, { status: 400 });
    }
  }

  if (Array.isArray(b.events)) {
    const events = b.events.filter(
      (e): e is string => typeof e === "string" && WEBHOOK_EVENTS.includes(e as typeof WEBHOOK_EVENTS[number])
    );
    if (events.length > 0) {
      data.events = JSON.stringify(events);
    }
  }

  if (typeof b.isActive === "boolean") {
    data.isActive = b.isActive;
  }

  const updated = await prisma.webhookEndpoint.update({
    where: { id },
    data,
  });

  return NextResponse.json({
    data: {
      id: updated.id,
      url: updated.url,
      events: JSON.parse(updated.events || "[]") as string[],
      isActive: updated.isActive,
    },
  });
}

/**
 * DELETE /api/webhook-endpoints/:id
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  const businessId = session.user.businessId;
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gated = await requireFeature(req, businessId, "api");
  if (gated) return gated;

  const { id } = await params;
  const endpoint = await prisma.webhookEndpoint.findFirst({
    where: { id, businessId },
  });

  if (!endpoint) {
    return NextResponse.json({ error: "Webhook endpoint not found" }, { status: 404 });
  }

  await prisma.webhookEndpoint.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
