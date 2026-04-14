import {
  AudienceScope,
  EventStatus,
  EventType,
  PaymentStatus,
  ParticipationType,
  Prisma,
  RegistrationStatus,
  TeamMemberRole,
  UserRole,
  UniversityBadgeStatus
} from "@prisma/client";

import { prisma } from "../config/prisma";
import { ApiError } from "../utils/api-error";
import { slugify } from "../utils/slug";

type EventGroupMutationInput = {
  title: string;
  subtitle?: string;
  description?: string;
  bannerImageUrl?: string;
  venue?: string;
  startsAt?: string;
  endsAt?: string;
  audienceScope: AudienceScope;
  status: EventStatus;
  metadata?: Record<string, unknown>;
};

type EventMutationInput = {
  groupId?: string;
  title: string;
  description?: string;
  bannerImageUrl?: string;
  backgroundImageUrl?: string;
  participationType: ParticipationType;
  audienceScope: AudienceScope;
  status: EventStatus;
  requiresApproval: boolean;
  requiresPayment: boolean;
  entryFee?: number;
  venue?: string;
  startsAt?: string;
  endsAt?: string;
  registrationOpensAt?: string;
  registrationClosesAt?: string;
  maxParticipants?: number;
  teamSizeMin?: number;
  teamSizeMax?: number;
  metadata?: Record<string, unknown>;
};

type CreateEventGroupInput = EventGroupMutationInput;
type UpdateEventGroupInput = Partial<EventGroupMutationInput>;
type CreateEventInput = EventMutationInput;
type UpdateEventInput = Partial<EventMutationInput>;

const baseUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true
} satisfies Prisma.UserSelect;

const activeCoordinatorWhere = (): Prisma.CoordinatorAssignmentWhereInput => ({
  isActive: true,
});

const eventSummarySelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  bannerImageUrl: true,
  backgroundImageUrl: true,
  participationType: true,
  audienceScope: true,
  status: true,
  requiresApproval: true,
  requiresPayment: true,
  entryFee: true,
  venue: true,
  startsAt: true,
  endsAt: true,
  registrationOpensAt: true,
  registrationClosesAt: true,
  maxParticipants: true,
  teamSizeMin: true,
  teamSizeMax: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  group: {
    select: {
      id: true,
      title: true,
      slug: true,
      subtitle: true,
      bannerImageUrl: true,
      venue: true,
      startsAt: true,
      endsAt: true,
      audienceScope: true,
      status: true
    }
  },
  createdBy: {
    select: baseUserSelect
  },
  coordinatorAssignments: {
    where: activeCoordinatorWhere(),
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      user: {
        select: baseUserSelect
      }
    }
  },
  _count: {
    select: {
      registrations: {
        where: {
          status: {
            notIn: [RegistrationStatus.CANCELLED, RegistrationStatus.REJECTED]
          }
        }
      }
    }
  }
} satisfies Prisma.EventSelect;

const managerRegistrationSelect = {
  id: true,
  status: true,
  paymentStatus: true,
  createdAt: true,
  reviewedAt: true,
  reviewNote: true,
  user: {
    select: baseUserSelect
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
            select: baseUserSelect
          }
        }
      }
    }
  },
  reviewedBy: {
    select: baseUserSelect
  }
} satisfies Prisma.EventRegistrationSelect;

const adminEventSelect = {
  ...eventSummarySelect,
  registrations: {
    where: {
      status: {
        not: RegistrationStatus.CANCELLED
      }
    },
    select: managerRegistrationSelect,
    orderBy: {
      createdAt: "desc" as const
    }
  }
} satisfies Prisma.EventSelect;

const publicGroupSelect = (userCanSeeUniversityOnly: boolean) =>
  ({
    id: true,
    title: true,
    slug: true,
    subtitle: true,
    description: true,
    bannerImageUrl: true,
    venue: true,
    startsAt: true,
    endsAt: true,
    audienceScope: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    events: {
      where: {
        status: EventStatus.PUBLISHED,
        ...(userCanSeeUniversityOnly ? {} : { audienceScope: AudienceScope.OPEN })
      },
      select: eventSummarySelect,
      orderBy: [{ startsAt: "asc" as const }, { createdAt: "desc" as const }]
    }
  }) satisfies Prisma.EventGroupSelect;

const adminGroupSelect = {
  id: true,
  title: true,
  slug: true,
  subtitle: true,
  description: true,
  bannerImageUrl: true,
  venue: true,
  startsAt: true,
  endsAt: true,
  audienceScope: true,
  status: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: baseUserSelect
  },
  events: {
    select: eventSummarySelect,
    orderBy: [{ startsAt: "asc" as const }, { createdAt: "desc" as const }]
  }
} satisfies Prisma.EventGroupSelect;

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

const parseOptionalDate = (value?: string) => (value ? new Date(value) : undefined);

const assertDateOrder = (startsAt?: Date | null, endsAt?: Date | null, message = "endsAt must be later than startsAt") => {
  if (startsAt && endsAt && endsAt <= startsAt) {
    throw new ApiError(400, message);
  }
};

const assertValidEventGroupInput = (input: {
  startsAt?: Date | null;
  endsAt?: Date | null;
}) => {
  assertDateOrder(input.startsAt, input.endsAt);
};

const assertValidEventInput = (input: {
  requiresPayment: boolean;
  entryFee?: number | Prisma.Decimal | null;
  participationType: ParticipationType;
  teamSizeMin?: number | null;
  teamSizeMax?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  registrationOpensAt?: Date | null;
  registrationClosesAt?: Date | null;
}) => {
  if (input.requiresPayment && !input.entryFee) {
    throw new ApiError(400, "entryFee is required when requiresPayment is true");
  }

  if (input.participationType === ParticipationType.TEAM && !input.teamSizeMax) {
    throw new ApiError(400, "teamSizeMax is required for team events");
  }

  if (
    input.participationType === ParticipationType.TEAM &&
    input.teamSizeMin &&
    input.teamSizeMax &&
    input.teamSizeMin > input.teamSizeMax
  ) {
    throw new ApiError(400, "teamSizeMin cannot be greater than teamSizeMax");
  }

  assertDateOrder(input.startsAt, input.endsAt);
  assertDateOrder(
    input.registrationOpensAt,
    input.registrationClosesAt,
    "registrationClosesAt must be later than registrationOpensAt"
  );
};

const getUniqueGroupSlug = async (title: string, excludeGroupId?: string) => {
  const baseSlug = slugify(title);
  const matches = await prisma.eventGroup.findMany({
    where: {
      ...(excludeGroupId
        ? {
            id: {
              not: excludeGroupId
            }
          }
        : {}),
      slug: {
        startsWith: baseSlug
      }
    },
    select: {
      slug: true
    }
  });

  if (matches.length === 0) {
    return baseSlug;
  }

  return `${baseSlug}-${matches.length + 1}`;
};

const getUniqueEventSlug = async (title: string, excludeEventId?: string) => {
  const baseSlug = slugify(title);
  const matches = await prisma.event.findMany({
    where: {
      ...(excludeEventId
        ? {
            id: {
              not: excludeEventId
            }
          }
        : {}),
      slug: {
        startsWith: baseSlug
      }
    },
    select: {
      slug: true
    }
  });

  if (matches.length === 0) {
    return baseSlug;
  }

  return `${baseSlug}-${matches.length + 1}`;
};

const ensureDefaultEventGroup = async (adminId: string) => {
  const existingGroup = await prisma.eventGroup.findFirst({
    where: {
      slug: "default-events"
    }
  });

  if (existingGroup) {
    return existingGroup;
  }

  return prisma.eventGroup.create({
    data: {
      title: "Default Events",
      slug: "default-events",
      subtitle: "System-created group for standalone event management",
      description: "This group keeps the current admin event UI working while grouped fest flows evolve.",
      audienceScope: AudienceScope.OPEN,
      status: EventStatus.PUBLISHED,
      createdById: adminId
    }
  });
};

const getVisibilityContext = async (currentUserId?: string) => {
  if (!currentUserId) {
    return {
      isAdmin: false,
      canSeeUniversityOnly: false
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: {
      role: true,
      universityBadgeStatus: true
    }
  });

  return {
    isAdmin: user?.role === UserRole.ADMIN,
    canSeeUniversityOnly:
      user?.role === UserRole.ADMIN ||
      user?.universityBadgeStatus === UniversityBadgeStatus.VERIFIED
  };
};

const ensureEventWithinGroupRules = (
  group: {
    startsAt: Date | null;
    endsAt: Date | null;
    audienceScope: AudienceScope;
    status: EventStatus;
  },
  event: {
    startsAt?: Date | null;
    endsAt?: Date | null;
    audienceScope: AudienceScope;
    status: EventStatus;
  }
) => {
  if (group.status !== EventStatus.PUBLISHED && event.status === EventStatus.PUBLISHED) {
    throw new ApiError(400, "Events cannot be published while their event group is still in draft");
  }

  if (group.audienceScope === AudienceScope.UNIVERSITY_ONLY && event.audienceScope !== AudienceScope.UNIVERSITY_ONLY) {
    throw new ApiError(400, "Events inside a university-only group must also be university-only");
  }

  if (group.startsAt && event.startsAt && event.startsAt < group.startsAt) {
    throw new ApiError(400, "Event start time must fall inside the event group schedule");
  }

  if (group.endsAt && event.endsAt && event.endsAt > group.endsAt) {
    throw new ApiError(400, "Event end time must fall inside the event group schedule");
  }
};

const ensureVisibleEventGroup = async (groupId: string, currentUserId?: string) => {
  const visibility = await getVisibilityContext(currentUserId);
  const group = await prisma.eventGroup.findUnique({
    where: { id: groupId },
    select: publicGroupSelect(visibility.canSeeUniversityOnly)
  });

  if (!group) {
    throw new ApiError(404, "Event group not found");
  }

  if (group.status !== EventStatus.PUBLISHED && !visibility.isAdmin) {
    throw new ApiError(404, "Event group not found");
  }

  if (
    group.audienceScope === AudienceScope.UNIVERSITY_ONLY &&
    !visibility.canSeeUniversityOnly &&
    !visibility.isAdmin
  ) {
    throw new ApiError(403, "This event group is only visible to verified university students");
  }

  return group;
};

const ensureVisibleEvent = async (eventId: string, currentUserId?: string) => {
  const visibility = await getVisibilityContext(currentUserId);
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: eventSummarySelect
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if ((!event.group || event.group.status !== EventStatus.PUBLISHED || event.status !== EventStatus.PUBLISHED) && !visibility.isAdmin) {
    throw new ApiError(404, "Event not found");
  }

  if (
    (event.group.audienceScope === AudienceScope.UNIVERSITY_ONLY || event.audienceScope === AudienceScope.UNIVERSITY_ONLY) &&
    !visibility.canSeeUniversityOnly &&
    !visibility.isAdmin
  ) {
    throw new ApiError(403, "This event is only visible to verified university students");
  }

  return event;
};

const canManageEventRegistrations = async (eventId: string, userId?: string) => {
  if (!userId) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true
    }
  });

  if (!user) {
    return false;
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
    },
    select: {
      id: true
    }
  });

  return Boolean(assignment);
};

const ensureRegistrationWindowOpen = (event: {
  registrationOpensAt: Date | null;
  registrationClosesAt: Date | null;
  status: EventStatus;
  group: {
    status: EventStatus;
  };
}) => {
  if (event.group.status !== EventStatus.PUBLISHED || event.status !== EventStatus.PUBLISHED) {
    throw new ApiError(400, "Only published events can accept registrations");
  }

  const now = new Date();

  if (event.registrationOpensAt && event.registrationOpensAt > now) {
    throw new ApiError(400, "Registration has not opened yet");
  }

  if (event.registrationClosesAt && event.registrationClosesAt < now) {
    throw new ApiError(400, "Registration is closed for this event");
  }
};

const ensureCapacityAvailable = async (eventId: string, maxParticipants?: number | null) => {
  if (!maxParticipants) {
    return;
  }

  const activeRegistrations = await prisma.eventRegistration.count({
    where: {
      eventId,
      status: {
        notIn: [RegistrationStatus.CANCELLED, RegistrationStatus.REJECTED]
      }
    }
  });

  if (activeRegistrations >= maxParticipants) {
    throw new ApiError(400, "This event has reached maximum registration capacity");
  }
};

const ensureEligibleRegistrant = async (
  event: {
    audienceScope: AudienceScope;
    group: {
      audienceScope: AudienceScope;
    };
  },
  userIds: string[]
) => {
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds
      },
      isActive: true
    },
    select: {
      id: true,
      role: true,
      universityBadgeStatus: true
    }
  });

  if (users.length !== userIds.length) {
    throw new ApiError(400, "One or more users were not found");
  }

  const nonStudentUser = users.find((user) => user.role !== UserRole.STUDENT);

  if (nonStudentUser) {
    throw new ApiError(403, "Only student accounts can register for events");
  }

  const requiresVerifiedBadge =
    event.group.audienceScope === AudienceScope.UNIVERSITY_ONLY ||
    event.audienceScope === AudienceScope.UNIVERSITY_ONLY;

  if (requiresVerifiedBadge) {
    const unverifiedUser = users.find(
      (user) => user.universityBadgeStatus !== UniversityBadgeStatus.VERIFIED
    );

    if (unverifiedUser) {
      throw new ApiError(403, "Only verified university students can join this event");
    }
  }
};

const ensureUsersHaveNoActiveRegistrations = async (userIds: string[]) => {
  const existingRegistration = await prisma.eventRegistration.findFirst({
    where: {
      status: {
        notIn: [RegistrationStatus.CANCELLED, RegistrationStatus.REJECTED]
      },
      OR: [
        {
          userId: {
            in: userIds
          }
        },
        {
          team: {
            members: {
              some: {
                userId: {
                  in: userIds
                }
              }
            }
          }
        }
      ]
    },
    select: {
      id: true
    }
  });

  if (existingRegistration) {
    throw new ApiError(400, "A student can register for only one event at a time");
  }
};

const buildRegistrationStatus = (event: {
  requiresApproval: boolean;
}) => (event.requiresApproval ? RegistrationStatus.PENDING : RegistrationStatus.CONFIRMED);

const buildPaymentStatus = (event: {
  requiresPayment: boolean;
}) => (event.requiresPayment ? PaymentStatus.PENDING : PaymentStatus.NOT_REQUIRED);

export const createEventGroup = async (adminId: string, input: CreateEventGroupInput) => {
  const startsAt = parseOptionalDate(input.startsAt);
  const endsAt = parseOptionalDate(input.endsAt);

  assertValidEventGroupInput({
    startsAt,
    endsAt
  });

  return prisma.eventGroup.create({
    data: {
      title: input.title,
      slug: await getUniqueGroupSlug(input.title),
      subtitle: input.subtitle,
      description: input.description,
      bannerImageUrl: input.bannerImageUrl,
      venue: input.venue,
      startsAt,
      endsAt,
      audienceScope: input.audienceScope,
      status: input.status,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
      createdById: adminId
    },
    select: adminGroupSelect
  });
};

export const listAdminEventGroups = async () =>
  prisma.eventGroup.findMany({
    select: adminGroupSelect,
    orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }]
  });

export const updateEventGroup = async (groupId: string, input: UpdateEventGroupInput) => {
  const existingGroup = await prisma.eventGroup.findUnique({
    where: { id: groupId }
  });

  if (!existingGroup) {
    throw new ApiError(404, "Event group not found");
  }

  const startsAt = "startsAt" in input ? parseOptionalDate(input.startsAt) : existingGroup.startsAt;
  const endsAt = "endsAt" in input ? parseOptionalDate(input.endsAt) : existingGroup.endsAt;

  assertValidEventGroupInput({
    startsAt,
    endsAt
  });

  return prisma.eventGroup.update({
    where: { id: groupId },
    data: {
      ...(input.title
        ? {
            title: input.title,
            slug: await getUniqueGroupSlug(input.title, groupId)
          }
        : {}),
      ...("subtitle" in input ? { subtitle: input.subtitle } : {}),
      ...("description" in input ? { description: input.description } : {}),
      ...("bannerImageUrl" in input ? { bannerImageUrl: input.bannerImageUrl } : {}),
      ...("venue" in input ? { venue: input.venue } : {}),
      ...("startsAt" in input ? { startsAt } : {}),
      ...("endsAt" in input ? { endsAt } : {}),
      ...("audienceScope" in input ? { audienceScope: input.audienceScope } : {}),
      ...("status" in input ? { status: input.status } : {}),
      ...("metadata" in input
        ? {
            metadata: input.metadata as Prisma.InputJsonValue | undefined
          }
        : {})
    },
    select: adminGroupSelect
  });
};

export const deleteEventGroup = async (groupId: string) => {
  const group = await prisma.eventGroup.findUnique({
    where: { id: groupId }
  });

  if (!group) {
    throw new ApiError(404, "Event group not found");
  }

  await prisma.eventGroup.delete({
    where: { id: groupId }
  });

  return {
    message: "Event group deleted successfully"
  };
};

export const listEventGroups = async (currentUserId?: string) => {
  const visibility = await getVisibilityContext(currentUserId);

  const groups = await prisma.eventGroup.findMany({
    where: {
      status: EventStatus.PUBLISHED,
      ...(visibility.canSeeUniversityOnly ? {} : { audienceScope: AudienceScope.OPEN })
    },
    select: publicGroupSelect(visibility.canSeeUniversityOnly),
    orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }]
  });

  return groups.filter((group) => group.events.length > 0 || Boolean(group.bannerImageUrl || group.description));
};

export const getEventGroupById = async (groupId: string, currentUserId?: string) =>
  ensureVisibleEventGroup(groupId, currentUserId);

export const createEvent = async (adminId: string, input: CreateEventInput) => {
  const group =
    input.groupId
      ? await prisma.eventGroup.findUnique({
          where: { id: input.groupId }
        })
      : await ensureDefaultEventGroup(adminId);

  if (!group) {
    throw new ApiError(404, "Event group not found");
  }

  const startsAt = parseOptionalDate(input.startsAt);
  const endsAt = parseOptionalDate(input.endsAt);
  const registrationOpensAt = parseOptionalDate(input.registrationOpensAt);
  const registrationClosesAt = parseOptionalDate(input.registrationClosesAt);

  assertValidEventInput({
    ...input,
    startsAt,
    endsAt,
    registrationOpensAt,
    registrationClosesAt
  });

  ensureEventWithinGroupRules(group, {
    startsAt,
    endsAt,
    audienceScope: input.audienceScope,
    status: input.status
  });

  return prisma.event.create({
    data: {
      groupId: group.id,
      title: input.title,
      slug: await getUniqueEventSlug(input.title),
      description: input.description,
      bannerImageUrl: input.bannerImageUrl,
      backgroundImageUrl: input.backgroundImageUrl,
      type: EventType.VISITING,
      participationType: input.participationType,
      audienceScope: input.audienceScope,
      status: input.status,
      requiresApproval: input.requiresApproval,
      requiresPayment: input.requiresPayment,
      entryFee: input.entryFee,
      venue: input.venue,
      startsAt,
      endsAt,
      registrationOpensAt,
      registrationClosesAt,
      maxParticipants: input.maxParticipants,
      teamSizeMin: input.teamSizeMin,
      teamSizeMax: input.teamSizeMax,
      roundsEnabled: false,
      roundCount: null,
      winnerCount: null,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
      createdById: adminId
    },
    select: adminEventSelect
  });
};

export const listAdminEvents = async () =>
  prisma.event.findMany({
    select: adminEventSelect,
    orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }]
  });

export const updateEvent = async (eventId: string, input: UpdateEventInput) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  const nextGroupId = input.groupId ?? event.groupId;
  const group = await prisma.eventGroup.findUnique({
    where: { id: nextGroupId }
  });

  if (!group) {
    throw new ApiError(404, "Event group not found");
  }

  const startsAt = "startsAt" in input ? parseOptionalDate(input.startsAt) : event.startsAt;
  const endsAt = "endsAt" in input ? parseOptionalDate(input.endsAt) : event.endsAt;
  const registrationOpensAt =
    "registrationOpensAt" in input
      ? parseOptionalDate(input.registrationOpensAt)
      : event.registrationOpensAt;
  const registrationClosesAt =
    "registrationClosesAt" in input
      ? parseOptionalDate(input.registrationClosesAt)
      : event.registrationClosesAt;

  assertValidEventInput({
    requiresPayment: input.requiresPayment ?? event.requiresPayment,
    entryFee: input.entryFee ?? event.entryFee,
    participationType: input.participationType ?? event.participationType,
    teamSizeMin: input.teamSizeMin ?? event.teamSizeMin,
    teamSizeMax: input.teamSizeMax ?? event.teamSizeMax,
    startsAt,
    endsAt,
    registrationOpensAt,
    registrationClosesAt
  });

  ensureEventWithinGroupRules(group, {
    startsAt,
    endsAt,
    audienceScope: input.audienceScope ?? event.audienceScope,
    status: input.status ?? event.status
  });

  return prisma.event.update({
    where: { id: eventId },
    data: {
      ...("groupId" in input ? { groupId: input.groupId } : {}),
      ...(input.title
        ? {
            title: input.title,
            slug: await getUniqueEventSlug(input.title, eventId)
          }
        : {}),
      ...("description" in input ? { description: input.description } : {}),
      ...("bannerImageUrl" in input ? { bannerImageUrl: input.bannerImageUrl } : {}),
      ...("backgroundImageUrl" in input ? { backgroundImageUrl: input.backgroundImageUrl } : {}),
      ...("participationType" in input ? { participationType: input.participationType } : {}),
      ...("audienceScope" in input ? { audienceScope: input.audienceScope } : {}),
      ...("status" in input ? { status: input.status } : {}),
      ...("requiresApproval" in input ? { requiresApproval: input.requiresApproval } : {}),
      ...("requiresPayment" in input ? { requiresPayment: input.requiresPayment } : {}),
      ...("entryFee" in input ? { entryFee: input.entryFee } : {}),
      ...("venue" in input ? { venue: input.venue } : {}),
      ...("startsAt" in input ? { startsAt } : {}),
      ...("endsAt" in input ? { endsAt } : {}),
      ...("registrationOpensAt" in input ? { registrationOpensAt } : {}),
      ...("registrationClosesAt" in input ? { registrationClosesAt } : {}),
      ...("maxParticipants" in input ? { maxParticipants: input.maxParticipants } : {}),
      ...("teamSizeMin" in input ? { teamSizeMin: input.teamSizeMin } : {}),
      ...("teamSizeMax" in input ? { teamSizeMax: input.teamSizeMax } : {}),
      ...("metadata" in input
        ? {
            metadata: input.metadata as Prisma.InputJsonValue | undefined
          }
        : {}),
      type: EventType.VISITING,
      roundsEnabled: false,
      roundCount: null,
      winnerCount: null
    },
    select: adminEventSelect
  });
};

export const deleteEvent = async (eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  await prisma.event.delete({
    where: { id: eventId }
  });

  return {
    message: "Event deleted successfully"
  };
};

export const listEvents = async (
  currentUserId?: string,
  filters?: {
    participationType?: ParticipationType;
    audienceScope?: AudienceScope;
    requiresPayment?: boolean;
    groupId?: string;
  }
) => {
  const visibility = await getVisibilityContext(currentUserId);

  if (!visibility.canSeeUniversityOnly && filters?.audienceScope === AudienceScope.UNIVERSITY_ONLY) {
    return [];
  }

  return prisma.event.findMany({
    where: {
      status: EventStatus.PUBLISHED,
      group: {
        status: EventStatus.PUBLISHED,
        ...(visibility.canSeeUniversityOnly ? {} : { audienceScope: AudienceScope.OPEN })
      },
      ...(filters?.groupId ? { groupId: filters.groupId } : {}),
      ...(filters?.participationType ? { participationType: filters.participationType } : {}),
      ...(typeof filters?.requiresPayment === "boolean"
        ? { requiresPayment: filters.requiresPayment }
        : {}),
      ...(filters?.audienceScope
        ? { audienceScope: filters.audienceScope }
        : visibility.canSeeUniversityOnly
          ? {}
          : { audienceScope: AudienceScope.OPEN })
    },
    select: eventSummarySelect,
    orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }]
  });
};

export const getEventById = async (eventId: string, currentUserId?: string) => {
  const event = await ensureVisibleEvent(eventId, currentUserId);
  const canManageRegistrations = await canManageEventRegistrations(eventId, currentUserId);

  const registrations = canManageRegistrations
    ? await prisma.eventRegistration.findMany({
        where: {
          eventId,
          status: {
            not: RegistrationStatus.CANCELLED
          }
        },
        include: registrationInclude,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }]
      })
    : [];

  const myRegistration = currentUserId
    ? await prisma.eventRegistration.findFirst({
        where: {
          eventId,
          status: {
            notIn: [RegistrationStatus.CANCELLED]
          },
          OR: [{ userId: currentUserId }, { team: { members: { some: { userId: currentUserId } } } }]
        },
        include: registrationInclude
      })
    : null;

  return {
    ...event,
    registrations,
    canManageRegistrations,
    registrationCount: event._count.registrations,
    myRegistration
  };
};

export const registerForSoloEvent = async (eventId: string, userId: string) => {
  const event = await ensureVisibleEvent(eventId, userId);

  if (event.participationType !== ParticipationType.SOLO) {
    throw new ApiError(400, "Use the team registration endpoint for this event");
  }

  ensureRegistrationWindowOpen(event);
  await ensureCapacityAvailable(eventId, event.maxParticipants);
  await ensureEligibleRegistrant(event, [userId]);
  await ensureUsersHaveNoActiveRegistrations([userId]);

  const existingRegistration = await prisma.eventRegistration.findFirst({
    where: {
      eventId,
      userId,
      status: {
        notIn: [RegistrationStatus.CANCELLED, RegistrationStatus.REJECTED]
      }
    }
  });

  if (existingRegistration) {
    throw new ApiError(400, "You are already registered for this event");
  }

  return prisma.eventRegistration.create({
    data: {
      eventId,
      userId,
      status: buildRegistrationStatus(event),
      paymentStatus: buildPaymentStatus(event),
      amountDue: event.entryFee
    },
    include: registrationInclude
  });
};

export const registerTeamForEvent = async (
  eventId: string,
  captainId: string,
  input: { name: string; memberIds?: string[] }
) => {
  const event = await ensureVisibleEvent(eventId, captainId);

  if (event.participationType !== ParticipationType.TEAM) {
    throw new ApiError(400, "This event only supports solo registration");
  }

  ensureRegistrationWindowOpen(event);
  await ensureCapacityAvailable(eventId, event.maxParticipants);

  const uniqueMemberIds = [...new Set([captainId, ...(input.memberIds ?? [])])];

  if (event.teamSizeMin && uniqueMemberIds.length < event.teamSizeMin) {
    throw new ApiError(400, `Team must include at least ${event.teamSizeMin} members`);
  }

  if (event.teamSizeMax && uniqueMemberIds.length > event.teamSizeMax) {
    throw new ApiError(400, `Team cannot include more than ${event.teamSizeMax} members`);
  }

  await ensureEligibleRegistrant(event, uniqueMemberIds);
  await ensureUsersHaveNoActiveRegistrations(uniqueMemberIds);

  const existingRegistration = await prisma.eventRegistration.findFirst({
    where: {
      eventId,
      status: {
        notIn: [RegistrationStatus.CANCELLED, RegistrationStatus.REJECTED]
      },
      OR: [
        {
          userId: {
            in: uniqueMemberIds
          }
        },
        {
          team: {
            members: {
              some: {
                userId: {
                  in: uniqueMemberIds
                }
              }
            }
          }
        }
      ]
    }
  });

  if (existingRegistration) {
    throw new ApiError(400, "One or more team members are already registered for this event");
  }

  return prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        eventId,
        captainId,
        name: input.name,
        members: {
          create: uniqueMemberIds.map((memberId) => ({
            userId: memberId,
            role: memberId === captainId ? TeamMemberRole.CAPTAIN : TeamMemberRole.MEMBER
          }))
        }
      }
    });

    return tx.eventRegistration.create({
      data: {
        eventId,
        userId: captainId,
        teamId: team.id,
        status: buildRegistrationStatus(event),
        paymentStatus: buildPaymentStatus(event),
        amountDue: event.entryFee
      },
      include: registrationInclude
    });
  });
};

export const cancelEventRegistration = async (eventId: string, userId: string) => {
  const registration = await prisma.eventRegistration.findFirst({
    where: {
      eventId,
      status: {
        notIn: [RegistrationStatus.CANCELLED]
      },
      OR: [{ userId }, { team: { captainId: userId } }]
    },
    include: {
      ...registrationInclude,
      event: {
        select: {
          id: true,
          status: true
        }
      }
    }
  });

  if (!registration) {
    throw new ApiError(404, "Registration not found for this user and event");
  }

  if (registration.checkedInAt) {
    throw new ApiError(400, "Checked-in registrations cannot be cancelled");
  }

  if (registration.event.status === EventStatus.COMPLETED) {
    throw new ApiError(400, "Completed event registrations cannot be cancelled");
  }

  return prisma.eventRegistration.update({
    where: {
      id: registration.id
    },
    data: {
      status: RegistrationStatus.CANCELLED
    },
    include: registrationInclude
  });
};
