import {
  OtpPurpose,
  OtpStatus,
  RegistrationStatus,
  UniversityBadgeStatus,
  UserRole
} from "@prisma/client";

import { env, isProduction } from "../config/env";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/api-error";
import { compareOtpCode, generateOtpCode, hashOtpCode } from "../utils/otp";
import { hashPassword } from "../utils/password";
import { sendAccountDeletionOtpEmail } from "./mail.service";

const publicUserSelect = {
  id: true,
  email: true,
  phone: true,
  fullName: true,
  role: true,
  isActive: true,
  isEmailVerified: true,
  emailVerifiedAt: true,
  universityName: true,
  universityEmail: true,
  universityStudentId: true,
  department: true,
  course: true,
  year: true,
  universityBadgeStatus: true,
  universityBadgeApprovedAt: true,
  createdAt: true,
  updatedAt: true
} as const;

export const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...publicUserSelect,
      createdEvents: {
        select: {
          id: true,
          title: true,
          slug: true,
          bannerImageUrl: true,
          participationType: true,
          audienceScope: true,
          status: true,
          requiresApproval: true,
          requiresPayment: true,
          entryFee: true,
          venue: true,
          startsAt: true,
          endsAt: true,
          createdAt: true,
          group: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          },
          registrations: {
            where: {
              status: {
                notIn: [RegistrationStatus.CANCELLED, RegistrationStatus.REJECTED]
              }
            },
            select: {
              id: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      },
      coordinatorAssignments: {
        orderBy: {
          startsAt: "asc"
        },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          isActive: true,
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              bannerImageUrl: true,
              status: true,
              startsAt: true,
              endsAt: true,
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
      universityBadgeLogs: {
        orderBy: {
          createdAt: "desc"
        },
        select: {
          id: true,
          status: true,
          notes: true,
          createdAt: true,
          reviewer: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: {
      OR: [
        { userId },
        { team: { members: { some: { userId } } } }
      ],
      status: {
        not: RegistrationStatus.CANCELLED
      }
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          bannerImageUrl: true,
          participationType: true,
          audienceScope: true,
          status: true,
          requiresApproval: true,
          requiresPayment: true,
          entryFee: true,
          venue: true,
          startsAt: true,
          endsAt: true,
          group: {
            select: {
              id: true,
              title: true,
              slug: true,
              bannerImageUrl: true
            }
          }
        }
      },
      team: {
        select: {
          id: true,
          name: true,
          captainId: true,
          members: {
            select: {
              id: true,
              role: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              }
            }
          }
        }
      },
      reviewedBy: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const now = new Date();
  const registrationActivities = {
    upcoming: registrations.filter(
      (registration) => registration.event.startsAt !== null && registration.event.startsAt > now
    ),
    ongoingOrRecent: registrations.filter(
      (registration) => registration.event.startsAt === null || registration.event.startsAt <= now
    ),
    past: registrations.filter(
      (registration) => registration.event.endsAt !== null && registration.event.endsAt < now
    )
  };

  const coordinatorActivities = {
    upcoming: user.coordinatorAssignments.filter((assignment) => assignment.startsAt > now),
    active: user.coordinatorAssignments.filter(
      (assignment) => assignment.isActive && assignment.startsAt <= now && assignment.endsAt >= now
    ),
    past: user.coordinatorAssignments.filter(
      (assignment) => !assignment.isActive || assignment.endsAt < now
    )
  };

  return {
    ...user,
    registrations, // Adding the combined registrations here
    createdEvents: user.createdEvents,
    activitySummary: {
      totalRegistrations: registrations.length,
      pastEvents: registrationActivities.past.length,
      totalCreatedEvents: user.createdEvents.length,
      publishedCreatedEvents: user.createdEvents.filter(
        (event) => event.status === "PUBLISHED"
      ).length,
      activeCoordinatorAssignments: coordinatorActivities.active.length
    },
    activities: {
      registrations: registrationActivities,
      createdEvents: user.createdEvents,
      coordinatorAssignments: coordinatorActivities,
      badgeHistory: user.universityBadgeLogs
    }
  };
};

export const requestDeleteMyAccountOtp = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      isActive: true
    }
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isActive) {
    throw new ApiError(400, "User account is already deleted");
  }

  const code = generateOtpCode();
  const codeHash = await hashOtpCode(code);
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000);

  const otpEntry = await prisma.$transaction(async (tx) => {
    await tx.otpCode.updateMany({
      where: {
        email: user.email,
        purpose: OtpPurpose.ACCOUNT_DELETION,
        status: OtpStatus.PENDING
      },
      data: {
        status: OtpStatus.EXPIRED
      }
    });

    return tx.otpCode.create({
      data: {
        email: user.email,
        userId: user.id,
        codeHash,
        purpose: OtpPurpose.ACCOUNT_DELETION,
        expiresAt
      }
    });
  });

  try {
    await sendAccountDeletionOtpEmail(user.email, code, env.OTP_TTL_MINUTES);
  } catch (error) {
    await prisma.otpCode.update({
      where: { id: otpEntry.id },
      data: {
        status: OtpStatus.EXPIRED
      }
    });

    throw new ApiError(500, "Failed to send account deletion OTP email", error);
  }

  return {
    message: "Account deletion OTP sent successfully",
    expiresAt,
    ...(isProduction ? {} : { devOtpCode: code })
  };
};

export const deleteMyAccount = async (userId: string, input: { code: string }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      isActive: true
    }
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isActive) {
    throw new ApiError(400, "User account is already deleted");
  }

  const otpEntry = await prisma.otpCode.findFirst({
    where: {
      email: user.email,
      purpose: OtpPurpose.ACCOUNT_DELETION,
      status: OtpStatus.PENDING
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  if (!otpEntry) {
    throw new ApiError(400, "No active deletion OTP was found for this account");
  }

  if (otpEntry.expiresAt < new Date()) {
    await prisma.otpCode.update({
      where: { id: otpEntry.id },
      data: {
        status: OtpStatus.EXPIRED
      }
    });

    throw new ApiError(400, "Deletion OTP has expired");
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

    throw new ApiError(400, "Invalid deletion OTP code");
  }

  await prisma.$transaction(async (tx) => {
    await tx.otpCode.update({
      where: { id: otpEntry.id },
      data: {
        status: OtpStatus.VERIFIED,
        consumedAt: new Date()
      }
    });

    await tx.otpCode.updateMany({
      where: {
        email: user.email,
        purpose: OtpPurpose.ACCOUNT_DELETION,
        status: OtpStatus.PENDING
      },
      data: {
        status: OtpStatus.EXPIRED
      }
    });

    await tx.coordinatorAssignment.updateMany({
      where: {
        userId
      },
      data: {
        isActive: false,
        endsAt: new Date()
      }
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        isActive: false
      }
    });
  });

  return {
    message: "Account deleted successfully"
  };
};

export const submitUniversityDetails = async (
  userId: string,
  input: {
    universityName: string;
    universityEmail: string;
    universityStudentId: string;
    department?: string;
    course?: string;
    year?: number;
  }
) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      universityName: input.universityName,
      universityEmail: input.universityEmail,
      universityStudentId: input.universityStudentId,
      department: input.department,
      course: input.course,
      year: input.year,
      universityBadgeStatus: UniversityBadgeStatus.PENDING,
      universityBadgeApprovedAt: null
    },
    select: publicUserSelect
  });

  await prisma.universityBadgeLog.create({
    data: {
      userId,
      status: UniversityBadgeStatus.PENDING,
      notes: "Student submitted university details"
    }
  });

  return updatedUser;
};

export const reviewUniversityBadge = async (
  reviewerId: string,
  userId: string,
  input: { status: "VERIFIED" | "REJECTED"; notes?: string }
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role !== UserRole.STUDENT) {
    throw new ApiError(400, "Only student accounts can receive university badges");
  }

  if (!user.universityName || !user.universityEmail || !user.universityStudentId) {
    throw new ApiError(400, "This student has not submitted complete university details yet");
  }

  return prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        universityBadgeStatus: input.status,
        universityBadgeApprovedAt:
          input.status === UniversityBadgeStatus.VERIFIED ? new Date() : null
      },
      select: publicUserSelect
    });

    await tx.universityBadgeLog.create({
      data: {
        userId,
        reviewerId,
        status: input.status,
        notes: input.notes
      }
    });

    return updatedUser;
  });
};

export const setUserActiveState = async (
  adminId: string,
  userId: string,
  isActive: boolean
) => {
  if (adminId === userId) {
    throw new ApiError(400, "Admins cannot change their own active status");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isActive: true
    }
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isActive === isActive) {
    throw new ApiError(
      400,
      isActive ? "User is already active" : "User is already inactive"
    );
  }

  return prisma.$transaction(async (tx) => {
    if (!isActive) {
      await tx.coordinatorAssignment.updateMany({
        where: {
          userId
        },
        data: {
          isActive: false,
          endsAt: new Date()
        }
      });
    }

    return tx.user.update({
      where: { id: userId },
      data: {
        isActive
      },
      select: publicUserSelect
    });
  });
};

export const listUsers = async () =>
  prisma.user.findMany({
    select: publicUserSelect,
    orderBy: {
      createdAt: "desc"
    }
  });

export const promoteToAdmin = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true
    }
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  throw new ApiError(
    400,
    "Student accounts cannot be promoted to admin. Create a dedicated admin account instead."
  );
};

export const createAdminAccount = async (input: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.email }, ...(input.phone ? [{ phone: input.phone }] : [])]
    }
  });

  if (existingUser) {
    throw new ApiError(409, "A user with this email or phone already exists");
  }

  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone,
      role: UserRole.ADMIN,
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    },
    select: publicUserSelect
  });
};
