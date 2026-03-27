import { UniversityBadgeStatus, UserRole } from "@prisma/client";

import { prisma } from "../config/prisma";
import { ApiError } from "../utils/api-error";

export const getMyProfile = async (userId: string) => {
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
              status: true
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

  return user;
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
