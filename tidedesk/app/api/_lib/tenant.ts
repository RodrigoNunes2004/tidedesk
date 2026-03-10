import type { UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function resolveBusinessId(req: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const fromSession = session?.user?.businessId?.trim();
  if (fromSession) return fromSession;

  const header = req.headers.get("x-business-id")?.trim();
  if (header && process.env.NODE_ENV !== "production") return header;

  const env = process.env.DEFAULT_BUSINESS_ID?.trim();
  if (env && process.env.NODE_ENV !== "production") return env;

  if (process.env.NODE_ENV !== "production") return "seed_business";

  return null;
}

/**
 * Returns businessId (with dev fallbacks) and role from session.
 * Use when you need to check role (e.g. rejectIfInstructor).
 */
export async function resolveSession(req: NextRequest): Promise<{
  businessId: string | null;
  role: UserRole | null;
}> {
  const session = await getServerSession(authOptions);
  const fromSession = session?.user?.businessId?.trim();
  if (fromSession) {
    return { businessId: fromSession, role: (session!.user!.role ?? null) as UserRole | null };
  }
  const header = req.headers.get("x-business-id")?.trim();
  if (header && process.env.NODE_ENV !== "production") {
    return { businessId: header, role: null };
  }
  const env = process.env.DEFAULT_BUSINESS_ID?.trim();
  if (env && process.env.NODE_ENV !== "production") {
    return { businessId: env, role: null };
  }
  if (process.env.NODE_ENV !== "production") {
    return { businessId: "seed_business", role: null };
  }
  return { businessId: null, role: null };
}

/**
 * Use for API routes that must reject INSTRUCTOR (e.g. create customer, manage rentals).
 * Returns 403 NextResponse if user is INSTRUCTOR; otherwise null.
 */
export function rejectIfInstructor(role: UserRole | null): NextResponse | null {
  if (role === "INSTRUCTOR") {
    return NextResponse.json(
      { error: "Forbidden: instructors have limited access" },
      { status: 403 },
    );
  }
  return null;
}

