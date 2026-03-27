import "dotenv/config";
import { UniversityBadgeStatus, UserRole } from "@prisma/client";

import { prisma } from "../src/config/prisma";

const run = async () => {
  const email = process.env.SEED_ADMIN_EMAIL;
  const fullName = process.env.SEED_ADMIN_NAME ?? "Platform Admin";

  if (!email) {
    throw new Error("SEED_ADMIN_EMAIL is required to seed an initial admin account.");
  }

  const admin = await prisma.user.upsert({
    where: {
      email
    },
    update: {
      fullName,
      role: UserRole.ADMIN,
      universityBadgeStatus: UniversityBadgeStatus.VERIFIED
    },
    create: {
      email,
      fullName,
      role: UserRole.ADMIN,
      universityBadgeStatus: UniversityBadgeStatus.VERIFIED
    }
  });

  console.log(`Seeded admin account: ${admin.email}`);
};

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
