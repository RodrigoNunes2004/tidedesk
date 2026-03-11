import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/server/session";
import { requireFeature } from "@/lib/tiers/require-feature";

/**
 * DELETE /api/api-keys/:id
 * Revoke an API key. Session auth. Premium only.
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
  const key = await prisma.apiKey.findFirst({
    where: { id, businessId },
  });

  if (!key) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  await prisma.apiKey.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
