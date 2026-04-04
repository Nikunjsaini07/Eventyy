import { OtpPurpose, OtpStatus, UniversityBadgeStatus, UserRole } from "@prisma/client";

import { env, isProduction } from "../config/env";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/api-error";
import { compareOtpCode, generateOtpCode, hashOtpCode } from "../utils/otp";
import { sendAccountDeletionOtpEmail } from "./mail.service";

export const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
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
      updatedAt: true,
      coordinatorAssignments: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
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
          },
          assignedBy: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        },
        orderBy: {
          startsAt: "desc"
        }
      },
      registrations: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
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
          },
          team: {
            select: {
              id: true,
              name: true,
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
          result: {
            select: {
              id: true,
              rank: true,
              title: true,
              isWinner: true,
              createdAt: true
            }
          },
          leaderboardEntries: {
            select: {
              id: true,
              score: true,
              wins: true,
              losses: true,
              draws: true,
              position: true,
              qualified: true,
              updatedAt: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
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

  const now = new Date();
  const coordinatorActivity = {
    active: user.coordinatorAssignments.filter(
      (assignment) => assignment.isActive && assignment.startsAt <= now && assignment.endsAt >= now
    ),
    past: user.coordinatorAssignments.filter(
      (assignment) => !assignment.isActive || assignment.endsAt < now
    ),
    upcoming: user.coordinatorAssignments.filter(
      (assignment) => assignment.isActive && assignment.startsAt > now
    )
  };

  const eventActivity = {
    upcoming: user.registrations.filter(
      (registration) =>
        registration.event.startsAt !== null && registration.event.startsAt > now
    ),
    ongoingOrRecent: user.registrations.filter(
      (registration) =>
        registration.event.startsAt === null ||
        registration.event.startsAt <= now
    ),
    past: user.registrations.filter(
      (registration) => registration.event.endsAt !== null && registration.event.endsAt < now
    )
  };

  return {
    ...user,
    activitySummary: {
      totalRegistrations: user.registrations.length,
      totalCoordinatorAssignments: user.coordinatorAssignments.length,
      activeCoordinatorAssignments: coordinatorActivity.active.length,
      pastEvents: eventActivity.past.length
    },
    activities: {
      registrations: eventActivity,
      coordinatorAssignments: coordinatorActivity,
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
        userId,
        isActive: true
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
    }
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

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        universityBadgeStatus: input.status,
        universityBadgeApprovedAt:
          input.status === UniversityBadgeStatus.VERIFIED ? new Date() : null
      }
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

  return result;
};

export const listUsers = async () =>
  prisma.user.findMany({
    include: {
      coordinatorAssignments: {
        where: {
          isActive: true
        },
        include: {
          event: {
            select: {
              id: true,
              title: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

export const listCoordinatorAssignments = async () =>
  prisma.coordinatorAssignment.findMany({
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true
        }
      },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      },
      assignedBy: {
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

export const promoteToAdmin = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      role: UserRole.ADMIN
    }
  });
};

export const assignCoordinator = async (
  adminId: string,
  input: {
    userId: string;
    eventId: string;
    startsAt: string;
    endsAt: string;
    permissions?: string[];
  }
) => {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      role: true,
      universityBadgeStatus: true
    }
  });

  if (!user) {
    throw new ApiError(404, "Target user not found");
  }

  if (user.role !== UserRole.STUDENT) {
    throw new ApiError(400, "Coordinators must be assigned from student accounts");
  }

  if (user.universityBadgeStatus !== UniversityBadgeStatus.VERIFIED) {
    throw new ApiError(400, "Only verified university students can become coordinators");
  }

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new ApiError(400, "Invalid coordinator assignment dates");
  }

  if (endsAt <= startsAt) {
    throw new ApiError(400, "Coordinator assignment end time must be later than start time");
  }

  const event = await prisma.event.findUnique({
    where: { id: input.eventId }
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  const overlappingAssignment = await prisma.coordinatorAssignment.findFirst({
    where: {
      userId: input.userId,
      eventId: input.eventId,
      isActive: true,
      startsAt: {
        lt: endsAt
      },
      endsAt: {
        gt: startsAt
      }
    }
  });

  if (overlappingAssignment) {
    throw new ApiError(400, "This student already has an overlapping coordinator assignment");
  }

  return prisma.coordinatorAssignment.create({
    data: {
      userId: input.userId,
      eventId: input.eventId,
      assignedById: adminId,
      startsAt,
      endsAt,
      permissions: input.permissions ?? []
    },
    include: {
      event: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    }
  });
};

export const deactivateCoordinatorAssignment = async (assignmentId: string) => {
  const assignment = await prisma.coordinatorAssignment.findUnique({
    where: { id: assignmentId }
  });

  if (!assignment) {
    throw new ApiError(404, "Coordinator assignment not found");
  }

  return prisma.coordinatorAssignment.update({
    where: { id: assignmentId },
    data: {
      isActive: false,
      endsAt: new Date()
    }
  });
};
