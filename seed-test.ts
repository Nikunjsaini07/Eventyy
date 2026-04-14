import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@shobhit.edu" },
    update: { role: "ADMIN", passwordHash: hashedPassword },
    create: {
      email: "admin@shobhit.edu",
      fullName: "System Admin",
      passwordHash: hashedPassword,
      phone: "1234567890",
      role: "ADMIN",
      isActive: true,
      isEmailVerified: true
    }
  });

  const student = await prisma.user.upsert({
    where: { email: "student@shobhit.edu" },
    update: { role: "STUDENT", passwordHash: hashedPassword },
    create: {
      email: "student@shobhit.edu",
      fullName: "Test Student",
      passwordHash: hashedPassword,
      phone: "0987654321",
      role: "STUDENT",
      isActive: true,
      isEmailVerified: true
    }
  });
  console.log("Admin and Student created!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
