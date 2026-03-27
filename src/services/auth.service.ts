import { OtpPurpose, OtpStatus, UniversityBadgeStatus, UserRole } from "@prisma/client";

import { env, isProduction } from "../config/env";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/api-error";
import { signAccessToken } from "../utils/jwt";
import { compareOtpCode, generateOtpCode, hashOtpCode } from "../utils/otp";

type VerifyOtpInput = {
  email: string;
  code: string;
  fullName?: string;
  phone?: string;
};

const buildUserSnapshot = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      coordinatorAssignments: {
        where: {
          isActive: true
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const now = new Date();
  const activeCoordinatorAssignments = user.coordinatorAssignments.filter(
    (assignment) =>
      (!assignment.startsAt || assignment.startsAt <= now) &&
      (!assignment.endsAt || assignment.endsAt >= now)
  );

  const effectiveRoles = new Set<string>([user.role]);

  if (activeCoordinatorAssignments.length > 0) {
    effectiveRoles.add("COORDINATOR");
  }

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    role: user.role,
    effectiveRoles: [...effectiveRoles],
    universityBadgeStatus: user.universityBadgeStatus,
    isUniversityVerified: user.universityBadgeStatus === UniversityBadgeStatus.VERIFIED,
    coordinatorAssignments: activeCoordinatorAssignments
  };
};

export const requestOtp = async (input: { email: string }) => {
  const code = generateOtpCode();
  const codeHash = await hashOtpCode(code);
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000);

  await prisma.$transaction([
    prisma.otpCode.updateMany({
      where: {
        email: input.email,
        purpose: OtpPurpose.AUTH,
        status: OtpStatus.PENDING
      },
      data: {
        status: OtpStatus.EXPIRED
      }
    }),
    prisma.otpCode.create({
      data: {
        email: input.email,
        codeHash,
        purpose: OtpPurpose.AUTH,
        expiresAt
      }
    })
  ]);

  return {
    message: "OTP generated successfully",
    expiresAt,
    ...(isProduction ? {} : { devOtpCode: code })
  };
};

export const verifyOtp = async (input: VerifyOtpInput) => {
  const otpEntry = await prisma.otpCode.findFirst({
    where: {
      email: input.email,
      purpose: OtpPurpose.AUTH,
      status: OtpStatus.PENDING
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  
  if (!otpEntry) {
    throw new ApiError(400, "No active OTP was found for this email");
  }

  if (otpEntry.expiresAt < new Date()) {
    await prisma.otpCode.update({
      where: { id: otpEntry.id },
      data: {
        status: OtpStatus.EXPIRED
      }
    });

    throw new ApiError(400, "OTP has expired");
  }

  const isValid = await compareOtpCode(input.code, otpEntry.codeHash);

  if (!isValid) {
    await prisma.otpCode.update({
      where: { id: otpEntry.id },
      data: {
        attempts: {
          increment: 1
        }
      }
    });

    throw new ApiError(400, "Invalid OTP code");
  }

  let user = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (!user) {
    if (!input.fullName) {
      throw new ApiError(400, "fullName is required when creating a new student account");
    }

    user = await prisma.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        fullName: input.fullName,
        role: UserRole.STUDENT
      }
    });
  } else if (input.phone && !user.phone) {
    user = await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        phone: input.phone
      }
    });
  }

  await prisma.otpCode.update({
    where: { id: otpEntry.id },
    data: {
      status: OtpStatus.VERIFIED,
      consumedAt: new Date()
    }
  });

  const token = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role
  });

  return {
    token,
    user: await buildUserSnapshot(user.id)
  };
};

export const getCurrentUser = async (userId: string) => buildUserSnapshot(userId);

