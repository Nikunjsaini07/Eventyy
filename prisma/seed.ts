import "dotenv/config";
import { UniversityBadgeStatus, UserRole } from "@prisma/client";

import { prisma } from "../src/config/prisma";
import { hashPassword } from "../src/utils/password";

const run = async () => {
  const email = process.env.SEED_ADMIN_EMAIL;
  const fullName = process.env.SEED_ADMIN_NAME ?? "Platform Admin";
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email) {
    throw new Error("SEED_ADMIN_EMAIL is required to seed an initial admin account.");
  }

  if (!password) {
    throw new Error("SEED_ADMIN_PASSWORD is required to seed an initial admin account.");
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.upsert({
    where: {
      email
    },
    update: {
      fullName,
      role: UserRole.ADMIN,
      passwordHash,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      universityBadgeStatus: UniversityBadgeStatus.VERIFIED
    },
    create: {
      email,
      fullName,
      role: UserRole.ADMIN,
      passwordHash,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
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
