import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiKey } from "@/app/api/_lib/api-auth";

/**
 * GET /api/v1/customers
 * List customers. Requires API key (Premium).
 * Query: take, skip, q (search)
 */
export async function GET(req: NextRequest) {
  const auth = await resolveApiKey(req);
  if (auth.error) return auth.error;
  const businessId = auth.businessId!;

  const { searchParams } = new URL(req.url);
  const take = Math.min(Math.max(Number(searchParams.get("take") ?? 50) || 50, 1), 100);
  const skip = Math.max(Number(searchParams.get("skip") ?? 0) || 0, 0);
  const q = searchParams.get("q")?.trim();

  const where = {
    businessId,
    archivedAt: null,
    ...(q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" as const } },
            { lastName: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const customers = await prisma.customer.findMany({
    where,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take,
    skip,
  });

  const serialized = customers.map((c) => ({
    ...c,
    dob: c.dob?.toISOString().slice(0, 10) ?? null,
    createdAt: c.createdAt.toISOString(),
  }));

  return NextResponse.json({ data: serialized });
}
