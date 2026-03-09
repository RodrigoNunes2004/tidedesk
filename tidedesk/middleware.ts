import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPublicApiRateLimiter } from "@/lib/rate-limit";

export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/api/public/")) {
    return NextResponse.next();
  }

  const limiter = await getPublicApiRateLimiter();
  if (!limiter) return NextResponse.next();

  const identifier =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown";

  const result = await limiter.limit(identifier);
  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/public/:path*",
};
