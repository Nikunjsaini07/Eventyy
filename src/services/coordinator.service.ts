import { Prisma, RegistrationStatus, UserRole } from "@prisma/client";

import { prisma } from "../config/prisma";
import { ApiError } from "../utils/api-error";

type AssignCoordinatorInput = {
  userId: string;
  startsAt: string;
  endsAt: string;
  permissions?: Record<string, unknown>;
};

type ReviewRegistrationInput = {
  status: "CONFIRMED" | "REJECTED";
  reviewNote?: string;
};

const baseUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true
} satisfies Prisma.UserSelect;

const eventSummarySelect = {
  id: true,
  title: true,
  slug: true,
  bannerImageUrl: true,
  participationType: true,
  audienceScope: true,
  status: true,
  requiresApproval: true,
  venue: true,
  startsAt: true,
  endsAt: true,
  group: {
    select: {
      id: true,
      title: true,
      slug: true,
      bannerImageUrl: true,
      status: true
    }
  }
} satisfies Prisma.EventSelect;

const registrationInclude = {
  event: {
    select: eventSummarySelect
  },
  user: {
    select: baseUserSelect
  },
  team: {
    select: {
      id: true,
      name: true,
      captainId: true,
      captain: {
        select: baseUserSelect
      },
      members: {
        select: {
          id: true,
          role: true,
          user: {
            select: baseUserSelect
          }
        }
      }
    }
  },
  reviewedBy: {
    select: baseUserSelect
  }
} satisfies Prisma.EventRegistrationInclude;

const parseDate = (value: string) => new Date(value);

const assertValidAssignmentWindow = (startsAt: Date, endsAt: Date) => {
  if (endsAt <= startsAt) {
    throw new ApiError(400, "endsAt must be later than startsAt");
  }
};

const ensureEventManagerAccess = async (userId: string, eventId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true
    }
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === UserRole.ADMIN) {
    return true;
  }

  const now = new Date();
  const assignment = await prisma.coordinatorAssignment.findFirst({
    where: {
      userId,
      eventId,
      isActive: true,
      startsAt: {
        lte: now
      },
      endsAt: {
        gte: now
      }
    }
  });

  if (!assignment) {
    throw new ApiError(403, "You are not allowed to manage this event");
  }

  return true;
};

export const assignCoordinator = async (
  adminId: string,
  eventId: string,
  input: AssignCoordinatorInput
) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true
    }
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  const coordinator = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      isEmailVerified: true
    }
  });

  if (!coordinator) {
    throw new ApiError(404, "Coordinator user not found");
  }

  if (!coordinator.isActive) {
    throw new ApiError(400, "Inactive users cannot be assigned as coordinators");
  }

  if (coordinator.role !== UserRole.STUDENT) {
    throw new ApiError(400, "Only student accounts can be assigned as coordinators");
  }

  if (!coordinator.isEmailVerified) {
    throw new ApiError(400, "Only email-verified users can be assigned as coordinators");
  }

  const startsAt = parseDate(input.startsAt);
  const endsAt = parseDate(input.endsAt);
  assertValidAssignmentWindow(startsAt, endsAt);

  const existingAssignment = await prisma.coordinatorAssignment.findFirst({
    where: {
      userId: input.userId,
      isActive: true,
      endsAt: {
        gte: new Date()
      }
    }
  });

  if (existingAssignment) {
    throw new ApiError(409, "A student can coordinate only one event at a time");
  }

  return prisma.coordinatorAssignment.create({
    data: {
      userId: input.userId,
      eventId,
      assignedById: adminId,
      startsAt,
      endsAt,
      permissions: (input.permissions ?? {
        canReviewRegistrations: true
      }) as Prisma.InputJsonValue
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      isActive: true,
      user: {
        select: baseUserSelect
      },
      event: {
        select: eventSummarySelect
      },
      assignedBy: {
        select: baseUserSelect
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

  if (!assignment.isActive) {
    throw new ApiError(400, "Coordinator assignment is already inactive");
  }

  return prisma.coordinatorAssignment.update({
    where: { id: assignmentId },
    data: {
      isActive: false,
      endsAt: assignment.endsAt < new Date() ? assignment.endsAt : new Date()
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      isActive: true,
      user: {
        select: baseUserSelect
      },
      event: {
        select: eventSummarySelect
      }
    }
  });
};

export const listCoordinatorAssignedEvents = async (userId: string) => {
  const now = new Date();

  return prisma.coordinatorAssignment.findMany({
    where: {
      userId,
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
      permissions: true,
      event: {
        select: {
          ...eventSummarySelect,
          _count: {
            select: {
              registrations: {
                where: {
                  status: RegistrationStatus.PENDING
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      startsAt: "asc"
    }
  });
};

export const listEventRegistrationsForManager = async (eventId: string, userId: string) => {
  await ensureEventManagerAccess(userId, eventId);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: eventSummarySelect
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: {
      eventId,
      status: {
        not: RegistrationStatus.CANCELLED
      }
    },
    include: registrationInclude,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }]
  });

  return {
    event,
    registrations
  };
};

export const reviewEventRegistration = async (
  registrationId: string,
  reviewerId: string,
  input: ReviewRegistrationInput
) => {
  const registration = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
    include: {
      event: {
        select: {
          id: true,
          status: true
        }
      }
    }
  });

  if (!registration) {
    throw new ApiError(404, "Registration not found");
  }

  await ensureEventManagerAccess(reviewerId, registration.event.id);

  if (registration.status === RegistrationStatus.CANCELLED) {
    throw new ApiError(400, "Cancelled registrations cannot be reviewed");
  }

  if (registration.status === RegistrationStatus.CHECKED_IN) {
    throw new ApiError(400, "Checked-in registrations cannot be reviewed");
  }

  if (registration.event.status === "COMPLETED") {
    throw new ApiError(400, "Completed event registrations cannot be reviewed");
  }

  return prisma.eventRegistration.update({
    where: { id: registrationId },
    data: {
      status: input.status,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      reviewNote: input.reviewNote
    },
    include: registrationInclude
  });
};
