import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/server/session";
import { requireFeature } from "@/lib/tiers/require-feature";
import { generateApiKey, hashApiKey } from "@/lib/api-key";

// Adapter-based client may omit apiKey in types; runtime has it (see prisma/seed.ts)
const db = prisma as unknown as {
  apiKey: {
    findMany: (args: unknown) => Promise<{ id: string; name: string; keyPrefix: string; lastUsedAt: Date | null; createdAt: Date }[]>;
    create: (args: unknown) => Promise<unknown>;
  };
};

/**
 * GET /api/api-keys
 * List API keys for the current business. Session auth. Premium only.
 */
export async function GET(req: NextRequest) {
  const session = await requireSession();
  const businessId = session.user.businessId;
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gated = await requireFeature(req, businessId, "api");
  if (gated) return gated;

  const keys = await db.apiKey.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, createdAt: true },
  });

  return NextResponse.json({
    data: keys.map((k) => ({
      ...k,
      keyPrefix: `${k.keyPrefix}...`,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    })),
  });
}

/**
 * POST /api/api-keys
 * Create a new API key. Session auth. Premium only.
 * Body: { name: string }
 * Returns the raw key ONCE - store it securely.
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

  const name = typeof (body as { name?: string }).name === "string"
    ? (body as { name: string }).name.trim()
    : "API key";

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { raw, prefix } = generateApiKey();
  const keyHash = await hashApiKey(raw);

  await db.apiKey.create({
    data: { businessId, name, keyPrefix: prefix, keyHash },
  });

  return NextResponse.json(
    {
      message: "API key created. Copy it now — it won't be shown again.",
      key: raw,
      prefix: `${prefix}...`,
    },
    { status: 201 },
  );
}
