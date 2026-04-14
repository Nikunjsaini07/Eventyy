import { OtpPurpose, OtpStatus, RegistrationStatus, UniversityBadgeStatus, UserRole } from "@prisma/client";

import { env, isProduction } from "../config/env";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/api-error";
import { signAccessToken } from "../utils/jwt";
import { compareOtpCode, generateOtpCode, hashOtpCode } from "../utils/otp";
import { comparePassword, hashPassword } from "../utils/password";
import { sendPasswordResetOtpEmail, sendVerificationOtpEmail } from "./mail.service";

type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type RequestOtpInput = {
  email: string;
};

type VerifyEmailOtpInput = {
  email: string;
  code: string;
};

type ResetPasswordInput = {
  email: string;
  code: string;
  newPassword: string;
};

const buildUserSnapshot = async (userId: string) => {
  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      fullName: true,
      role: true,
      isEmailVerified: true,
      emailVerifiedAt: true,
      universityBadgeStatus: true,
      coordinatorAssignments: {
        where: {
          isActive: true,
          startsAt: {
            lte: now
          },
          endsAt: {
            gte: now
          }
        },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              group: {
                select: {
                  id: true,
                  title: true,
                  slug: true
                }
              }
            }
          }
        }
      },
      registrations: {
        where: {
          status: {
            notIn: [RegistrationStatus.CANCELLED, RegistrationStatus.REJECTED]
          }
        },
        select: {
          id: true,
          eventId: true
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 1
      }
    }
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const effectiveRoles: string[] = [user.role];

  if (user.coordinatorAssignments.length > 0) {
    effectiveRoles.push("COORDINATOR");
  }

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    role: user.role,
    effectiveRoles,
    isEmailVerified: user.isEmailVerified,
    emailVerifiedAt: user.emailVerifiedAt,
    universityBadgeStatus: user.universityBadgeStatus,
    isUniversityVerified: user.universityBadgeStatus === UniversityBadgeStatus.VERIFIED,
    coordinatorAssignments: user.coordinatorAssignments,
    isCoordinator: user.coordinatorAssignments.length > 0,
    hasActiveRegistration: user.registrations.length > 0,
    activeRegistrationEventId: user.registrations[0]?.eventId
  };
};

const createOtp = async (email: string, purpose: OtpPurpose, userId?: string) => {
  const code = generateOtpCode();
  const codeHash = await hashOtpCode(code);
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000);

  const otpEntry = await prisma.$transaction(async (tx) => {
    await tx.otpCode.updateMany({
      where: {
        email,
        purpose,
        status: OtpStatus.PENDING
      },
      data: {
        status: OtpStatus.EXPIRED
      }
    });

    return tx.otpCode.create({
      data: {
        email,
        codeHash,
        purpose,
        expiresAt,
        userId
      }
    });
  });

  return { code, expiresAt, otpEntry };
};

const validateOtp = async (email: string, purpose: OtpPurpose, code: string) => {
  const otpEntry = await prisma.otpCode.findFirst({
    where: {
      email,
      purpose,
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

  const isValid = await compareOtpCode(code, otpEntry.codeHash);

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

  return otpEntry;
};

const consumeOtp = async (otpId: string) => {
  await prisma.otpCode.update({
    where: { id: otpId },
    data: {
      status: OtpStatus.VERIFIED,
      consumedAt: new Date()
    }
  });
};

const buildAuthResponse = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true
    }
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

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

export const registerStudent = async (input: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      phone: input.phone,
      fullName: input.fullName,
      role: UserRole.STUDENT
    }
  });

  const { code, expiresAt, otpEntry } = await createOtp(
    user.email,
    OtpPurpose.EMAIL_VERIFICATION,
    user.id
  );

  try {
    await sendVerificationOtpEmail(user.email, code, env.OTP_TTL_MINUTES);
  } catch (error) {
    await prisma.otpCode.update({
      where: { id: otpEntry.id },
      data: {
        status: OtpStatus.EXPIRED
      }
    });

    throw new ApiError(500, "Failed to send verification OTP email", error);
  }

  return {
    message: "Account created. Please verify your email with the OTP we sent.",
    email: user.email,
    expiresAt,
    ...(isProduction ? {} : { devOtpCode: code })
  };
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (!user || !user.passwordHash) {
    throw new ApiError(401, "Invalid email or password");
  }

  const passwordMatches = await comparePassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "User account is inactive");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  return buildAuthResponse(user.id);
};

export const requestEmailVerificationOtp = async (input: RequestOtpInput) => {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (!user) {
    throw new ApiError(404, "No account was found for this email");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified");
  }

  const { code, expiresAt, otpEntry } = await createOtp(
    user.email,
    OtpPurpose.EMAIL_VERIFICATION,
    user.id
  );

  try {
    await sendVerificationOtpEmail(user.email, code, env.OTP_TTL_MINUTES);
  } catch (error) {
    await prisma.otpCode.update({
      where: { id: otpEntry.id },
      data: {
        status: OtpStatus.EXPIRED
      }
    });

    throw new ApiError(500, "Failed to send verification OTP email", error);
  }

  return {
    message: "Verification OTP sent successfully",
    expiresAt,
    ...(isProduction ? {} : { devOtpCode: code })
  };
};

export const verifyEmailOtp = async (input: VerifyEmailOtpInput) => {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (!user) {
    throw new ApiError(404, "No account was found for this email");
  }

  const otpEntry = await validateOtp(input.email, OtpPurpose.EMAIL_VERIFICATION, input.code);

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  await consumeOtp(otpEntry.id);

  return buildAuthResponse(user.id);
};

export const requestPasswordResetOtp = async (input: RequestOtpInput) => {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (!user) {
    return {
      message: "If an account exists with this email, a password reset OTP has been sent."
    };
  }

  const { code, expiresAt, otpEntry } = await createOtp(
    user.email,
    OtpPurpose.PASSWORD_RESET,
    user.id
  );

  try {
    await sendPasswordResetOtpEmail(user.email, code, env.OTP_TTL_MINUTES);
  } catch (error) {
    await prisma.otpCode.update({
      where: { id: otpEntry.id },
      data: {
        status: OtpStatus.EXPIRED
      }
    });

    throw new ApiError(500, "Failed to send password reset OTP email", error);
  }

  return {
    message: "If an account exists with this email, a password reset OTP has been sent.",
    expiresAt,
    ...(isProduction ? {} : { devOtpCode: code })
  };
};

export const resetPassword = async (input: ResetPasswordInput) => {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (!user) {
    throw new ApiError(404, "No account was found for this email");
  }

  const otpEntry = await validateOtp(input.email, OtpPurpose.PASSWORD_RESET, input.code);
  const passwordHash = await hashPassword(input.newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: user.id
      },
      data: {
        passwordHash
      }
    });

    await tx.otpCode.update({
      where: { id: otpEntry.id },
      data: {
        status: OtpStatus.VERIFIED,
        consumedAt: new Date()
      }
    });

    await tx.otpCode.updateMany({
      where: {
        email: input.email,
        purpose: OtpPurpose.PASSWORD_RESET,
        status: OtpStatus.PENDING
      },
      data: {
        status: OtpStatus.EXPIRED
      }
    });
  });

  return {
    message: "Password reset successfully"
  };
};

export const getCurrentUser = async (userId: string) => buildUserSnapshot(userId);
