import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-key";
import { getBusinessTier } from "@/lib/tiers/get-business-tier";
import { hasFeature } from "@/lib/tiers";

/**
 * Resolves API key from request (Bearer token or X-API-Key header).
 * Returns { businessId, error } - error is a NextResponse if auth failed.
 */
export async function resolveApiKey(
  req: NextRequest
): Promise<
  | { businessId: string; error: null }
  | { businessId: null; error: NextResponse }
> {
  const authHeader = req.headers.get("authorization");
  const apiKeyHeader = req.headers.get("x-api-key");

  const rawKey =
    authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : apiKeyHeader?.trim();

  if (!rawKey) {
    return {
      businessId: null,
      error: NextResponse.json(
        { error: "Missing API key. Use Authorization: Bearer <key> or X-API-Key header." },
        { status: 401 }
      ),
    };
  }

  if (!rawKey.startsWith("td_") || rawKey.length < 15) {
    return {
      businessId: null,
      error: NextResponse.json({ error: "Invalid API key format." }, { status: 401 }),
    };
  }

  const prefix = rawKey.slice(0, 12);
  // Adapter-based client may omit apiKey in types; runtime has it (see prisma/seed.ts)
  const db = prisma as unknown as { apiKey: { findFirst: (args: unknown) => Promise<{ id: string; businessId: string; keyHash: string; name: string } | null>; update: (args: unknown) => Promise<unknown> } };
  const key = await db.apiKey.findFirst({
    where: { keyPrefix: prefix },
    select: { id: true, businessId: true, keyHash: true, name: true },
  });

  if (!key) {
    return {
      businessId: null,
      error: NextResponse.json({ error: "Invalid API key." }, { status: 401 }),
    };
  }

  const valid = await verifyApiKey(rawKey, key.keyHash);
  if (!valid) {
    return {
      businessId: null,
      error: NextResponse.json({ error: "Invalid API key." }, { status: 401 }),
    };
  }

  const tier = await getBusinessTier(key.businessId);
  if (!hasFeature(tier, "api")) {
    return {
      businessId: null,
      error: NextResponse.json(
        { error: "API access requires a Premium subscription." },
        { status: 403 }
      ),
    };
  }

  await db.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  return { businessId: key.businessId, error: null };
}
