/**
 * Adds the instructor test user. Run after db:seed if instructor login fails.
 * Usage: npx tsx prisma/seed-instructor.ts
 */
import "dotenv/config";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL");

  const business = await prisma.business.findFirst();
  if (!business) {
    console.log("No business found. Run npm run db:seed first.");
    process.exit(1);
  }

  // Use same password hash as owner so we're guaranteed to match auth
  const owner = await prisma.user.findFirst({
    where: { businessId: business.id, role: "OWNER" },
    select: { passwordHash: true },
  });
  if (!owner) {
    console.log("No owner found. Run npm run db:seed first.");
    process.exit(1);
  }

  const email = "instructor@tidedesk.local";
  const password = "ChangeMe123!";

  await prisma.user.upsert({
    where: { email },
    update: {
      name: "Jake Wilson",
      passwordHash: owner.passwordHash,
      role: UserRole.INSTRUCTOR,
      businessId: business.id,
    },
    create: {
      name: "Jake Wilson",
      email,
      passwordHash: owner.passwordHash,
      role: UserRole.INSTRUCTOR,
      businessId: business.id,
    },
  });

  console.log("Instructor user ready:", { email, password });
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
