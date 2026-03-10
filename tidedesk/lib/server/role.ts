import type { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireSession } from "./session";

const STAFF_ROLES: UserRole[] = ["OWNER", "STAFF"];

/**
 * Returns session. Redirects to /dashboard if user is INSTRUCTOR.
 * Use on pages that only OWNER/STAFF should access (rentals, equipment, instructors, revenue, settings).
 */
export async function requireStaffOrOwner() {
  const session = await requireSession();
  if (session.user.role === "INSTRUCTOR") redirect("/dashboard");
  return session;
}

/**
 * Returns true if the role can access staff-only features.
 */
export function isStaffOrOwner(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}
