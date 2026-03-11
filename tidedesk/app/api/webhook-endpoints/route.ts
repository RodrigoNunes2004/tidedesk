import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/server/session";
import { requireFeature } from "@/lib/tiers/require-feature";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/dispatch";

// Adapter-based client may omit webhookEndpoint in types; runtime has it (see prisma/seed.ts)
const db = prisma as unknown as {
  webhookEndpoint: {
    findMany: (args: unknown) => Promise<{ id: string; url: string; events: string | null; isActive: boolean; lastTriggeredAt: Date | null; lastError: string | null; createdAt: Date }[]>;
    create: (args: unknown) => Promise<{ id: string; url: string; events: string; isActive: boolean }>;
  };
};

/**
 * GET /api/webhook-endpoints
 * List webhook endpoints. Session auth. Premium only.
 */
export async function GET(req: NextRequest) {
  const session = await requireSession();
  const businessId = session.user.businessId;
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gated = await requireFeature(req, businessId, "api");
  if (gated) return gated;

  const endpoints = await db.webhookEndpoint.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    data: endpoints.map((e) => ({
      id: e.id,
      url: e.url,
      events: JSON.parse(e.events || "[]") as string[],
      isActive: e.isActive,
      lastTriggeredAt: e.lastTriggeredAt?.toISOString() ?? null,
      lastError: e.lastError,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}

/**
 * POST /api/webhook-endpoints
 * Create webhook endpoint. Session auth. Premium only.
 * Body: { url: string, events: string[] }
 */
export async function POST(req: NextRequest) {
  const session = await requireSession();
  const businessId = session.user.businessId;
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gated = await requireFeature(req, businessId, "api");
  if (gated) return gated;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as { url?: string; events?: string[] };
  const url = typeof b.url === "string" ? b.url.trim() : "";
  const events = Array.isArray(b.events)
    ? b.events.filter((e): e is string => typeof e === "string" && WEBHOOK_EVENTS.includes(e as typeof WEBHOOK_EVENTS[number]))
    : [];

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "url must be a valid URL" }, { status: 400 });
  }

  if (events.length === 0) {
    return NextResponse.json(
      { error: `events must include at least one of: ${WEBHOOK_EVENTS.join(", ")}` },
      { status: 400 },
    );
  }

  const secret = randomBytes(32).toString("hex");
  const endpoint = await db.webhookEndpoint.create({
    data: {
      businessId,
      url,
      secret,
      events: JSON.stringify(events),
      isActive: true,
    },
  });

  return NextResponse.json(
    {
      data: {
        id: endpoint.id,
        url: endpoint.url,
        events: JSON.parse(endpoint.events) as string[],
        isActive: endpoint.isActive,
        secret,
        message: "Copy the secret now — it won't be shown again. Use it to verify webhook signatures.",
      },
    },
    { status: 201 },
  );
}
