/**
 * Idempotency for public booking creation.
 * Uses Upstash Redis when configured. Without it, idempotency is skipped.
 * TTL: 24 hours.
 */
const IDEM_TTL_SECONDS = 86400; // 24h

async function getRedis(): Promise<{ get: (k: string) => Promise<string | null>; set: (k: string, v: string, opts?: { ex?: number }) => Promise<void> } | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  try {
    const { Redis } = await import("@upstash/redis" as string);
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

function idempotencyKey(slug: string, key: string): string {
  return `idem:booking:${slug}:${key}`;
}

export async function getIdempotencyResult(
  slug: string,
  key: string
): Promise<{ status: number; body: unknown } | null> {
  const redis = await getRedis();
  if (!redis) return null;
  const stored = await redis.get(idempotencyKey(slug, key));
  if (!stored) return null;
  try {
    return JSON.parse(stored) as { status: number; body: unknown };
  } catch {
    return null;
  }
}

export async function setIdempotencyResult(
  slug: string,
  key: string,
  status: number,
  body: unknown
): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  const payload = JSON.stringify({ status, body });
  await redis.set(idempotencyKey(slug, key), payload, { ex: IDEM_TTL_SECONDS });
}
