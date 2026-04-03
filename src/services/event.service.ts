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

type EventMutationInput = {
  groupId: string;
  title: string;
  description?: string;
  type: EventType;
  participationType: ParticipationType;
  audienceScope: AudienceScope;
  status: EventStatus;
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
  roundsEnabled: boolean;
  roundCount?: number;
  winnerCount?: number;
  metadata?: Record<string, unknown>;
};

type CreateEventInput = EventMutationInput;
type UpdateEventInput = Partial<EventMutationInput>;

type EventGroupMutationInput = {
  title: string;
  description?: string;
  venue?: string;
  startsAt?: string;
  endsAt?: string;
  audienceScope: AudienceScope;
  status: EventStatus;
  metadata?: Record<string, unknown>;
};

type CreateEventGroupInput = EventGroupMutationInput;
type UpdateEventGroupInput = Partial<EventGroupMutationInput>;

const eventInclude = {
  group: {
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      audienceScope: true
    }
  },
  coordinatorAssignments: {
    where: {
      isActive: true
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    }
  },
  rounds: {
    orderBy: {
      roundNumber: "asc" as const
    }
  }
} satisfies Prisma.EventInclude;

const eventGroupInclude = {
  createdBy: {
    select: {
      id: true,
      fullName: true,
      email: true
    }
  },
  events: {
    include: {
      group: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true
        }
      }
    },
    orderBy: {
      createdAt: "asc" as const
    }
  }
} satisfies Prisma.EventGroupInclude;

const getEffectiveAudienceScope = (
  eventAudienceScope: AudienceScope,
  groupAudienceScope: AudienceScope
) =>
  eventAudienceScope === AudienceScope.UNIVERSITY_ONLY ||
  groupAudienceScope === AudienceScope.UNIVERSITY_ONLY
    ? AudienceScope.UNIVERSITY_ONLY
    : AudienceScope.OPEN;

const ensureUniversityEligibility = async (eventId: string, userId: string) => {
  const [event, user] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      include: {
        group: {
          select: {
            status: true,
            audienceScope: true
          }
        }
      }
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        universityBadgeStatus: true
      }
    })
  ]);

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (event.status !== EventStatus.PUBLISHED) {
    throw new ApiError(400, "Only published events can accept registrations");
  }

  if (event.group.status !== EventStatus.PUBLISHED) {
    throw new ApiError(400, "Only events inside published event groups can accept registrations");
  }

  if (
    getEffectiveAudienceScope(event.audienceScope, event.group.audienceScope) ===
      AudienceScope.UNIVERSITY_ONLY &&
    user?.universityBadgeStatus !== UniversityBadgeStatus.VERIFIED
  ) {
    throw new ApiError(403, "This event is only available to verified university students");
  }

  return event;
};

const parseOptionalDate = (value?: string) => (value ? new Date(value) : undefined);

const assertValidEventGroupInput = (input: {
  startsAt?: Date | null;
  endsAt?: Date | null;
}) => {
  if (input.startsAt && input.endsAt && input.endsAt <= input.startsAt) {
    throw new ApiError(400, "Event group endsAt must be later than startsAt");
  }
};

const assertValidEventInput = (input: {
  requiresPayment: boolean;
  entryFee?: number | Prisma.Decimal | null;
  participationType: ParticipationType;
  teamSizeMin?: number | null;
  teamSizeMax?: number | null;
  type: EventType;
  roundCount?: number | null;
  winnerCount?: number | null;
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

  if (input.type === EventType.PVP && !input.roundCount) {
    throw new ApiError(400, "roundCount is required for PVP events");
  }

  if (input.type === EventType.RANKED && !input.winnerCount) {
    throw new ApiError(400, "winnerCount is required for ranked events");
  }

  if (input.startsAt && input.endsAt && input.endsAt <= input.startsAt) {
    throw new ApiError(400, "endsAt must be later than startsAt");
  }

  if (
    input.registrationOpensAt &&
    input.registrationClosesAt &&
    input.registrationClosesAt <= input.registrationOpensAt
  ) {
    throw new ApiError(400, "registrationClosesAt must be later than registrationOpensAt");
  }
};

const assertEventFitsWithinGroup = (
  input: {
    startsAt?: Date | null;
    endsAt?: Date | null;
    audienceScope: AudienceScope;
    status: EventStatus;
  },
  eventGroup: {
    startsAt?: Date | null;
    endsAt?: Date | null;
    audienceScope: AudienceScope;
    status: EventStatus;
  }
) => {
  if (
    eventGroup.audienceScope === AudienceScope.UNIVERSITY_ONLY &&
    input.audienceScope !== AudienceScope.UNIVERSITY_ONLY
  ) {
    throw new ApiError(
      400,
      "Child events inside a university-only event group must also be university-only"
    );
  }

  if (input.status === EventStatus.PUBLISHED && eventGroup.status !== EventStatus.PUBLISHED) {
    throw new ApiError(400, "A child event cannot be published while its event group is not published");
  }

  if (eventGroup.startsAt) {
    if (input.startsAt && input.startsAt < eventGroup.startsAt) {
      throw new ApiError(400, "Event startsAt must be within the event group schedule");
    }

    if (input.endsAt && input.endsAt < eventGroup.startsAt) {
      throw new ApiError(400, "Event endsAt must be within the event group schedule");
    }
  }

  if (eventGroup.endsAt) {
    if (input.startsAt && input.startsAt > eventGroup.endsAt) {
      throw new ApiError(400, "Event startsAt must be within the event group schedule");
    }

    if (input.endsAt && input.endsAt > eventGroup.endsAt) {
      throw new ApiError(400, "Event endsAt must be within the event group schedule");
    }
  }
};

const getUniqueSlug = async (title: string, excludeEventId?: string) => {
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

const getUniqueEventGroupSlug = async (title: string, excludeGroupId?: string) => {
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
      slug: await getUniqueEventGroupSlug(input.title),
      description: input.description,
      venue: input.venue,
      startsAt,
      endsAt,
      audienceScope: input.audienceScope,
      status: input.status,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
      createdById: adminId
    },
    include: eventGroupInclude
  });
};

export const updateEventGroup = async (groupId: string, input: UpdateEventGroupInput) => {
  const eventGroup = await prisma.eventGroup.findUnique({
    where: { id: groupId }
  });

  if (!eventGroup) {
    throw new ApiError(404, "Event group not found");
  }

  const startsAt = "startsAt" in input ? parseOptionalDate(input.startsAt) : eventGroup.startsAt;
  const endsAt = "endsAt" in input ? parseOptionalDate(input.endsAt) : eventGroup.endsAt;

  assertValidEventGroupInput({
    startsAt,
    endsAt
  });

  const data: Prisma.EventGroupUpdateInput = {
    ...(input.title
      ? {
          title: input.title,
          slug: await getUniqueEventGroupSlug(input.title, groupId)
        }
      : {}),
    ...("description" in input ? { description: input.description } : {}),
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
  };

  return prisma.eventGroup.update({
    where: { id: groupId },
    data,
    include: eventGroupInclude
  });
};

export const deleteEventGroup = async (groupId: string) => {
  const eventGroup = await prisma.eventGroup.findUnique({
    where: { id: groupId }
  });

  if (!eventGroup) {
    throw new ApiError(404, "Event group not found");
  }

  await prisma.eventGroup.delete({
    where: { id: groupId }
  });

  return {
    message: "Event group deleted successfully"
  };
};

export const createEvent = async (adminId: string, input: CreateEventInput) => {
  const startsAt = parseOptionalDate(input.startsAt);
  const endsAt = parseOptionalDate(input.endsAt);
  const registrationOpensAt = parseOptionalDate(input.registrationOpensAt);
  const registrationClosesAt = parseOptionalDate(input.registrationClosesAt);

  const eventGroup = await prisma.eventGroup.findUnique({
    where: { id: input.groupId }
  });

  if (!eventGroup) {
    throw new ApiError(404, "Event group not found");
  }

  assertValidEventInput({
    ...input,
    startsAt,
    endsAt,
    registrationOpensAt,
    registrationClosesAt
  });

  assertEventFitsWithinGroup(
    {
      startsAt,
      endsAt,
      audienceScope: input.audienceScope,
      status: input.status
    },
    eventGroup
  );

  return prisma.event.create({
    data: {
      groupId: input.groupId,
      title: input.title,
      slug: await getUniqueSlug(input.title),
      description: input.description,
      type: input.type,
      participationType: input.participationType,
      audienceScope: input.audienceScope,
      status: input.status,
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
      roundsEnabled: input.roundsEnabled,
      roundCount: input.roundCount,
      winnerCount: input.winnerCount,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
      createdById: adminId
    },
    include: eventInclude
  });
};

export const updateEvent = async (eventId: string, input: UpdateEventInput) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      group: {
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          audienceScope: true,
          status: true
        }
      }
    }
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
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

  const targetGroup =
    input.groupId && input.groupId !== event.group.id
      ? await prisma.eventGroup.findUnique({
          where: { id: input.groupId },
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            audienceScope: true,
            status: true
          }
        })
      : event.group;

  if (!targetGroup) {
    throw new ApiError(404, "Event group not found");
  }

  assertValidEventInput({
    requiresPayment: input.requiresPayment ?? event.requiresPayment,
    entryFee: input.entryFee ?? event.entryFee,
    participationType: input.participationType ?? event.participationType,
    teamSizeMin: input.teamSizeMin ?? event.teamSizeMin,
    teamSizeMax: input.teamSizeMax ?? event.teamSizeMax,
    type: input.type ?? event.type,
    roundCount: input.roundCount ?? event.roundCount,
    winnerCount: input.winnerCount ?? event.winnerCount,
    startsAt,
    endsAt,
    registrationOpensAt,
    registrationClosesAt
  });

  assertEventFitsWithinGroup(
    {
      startsAt,
      endsAt,
      audienceScope: input.audienceScope ?? event.audienceScope,
      status: input.status ?? event.status
    },
    targetGroup
  );

  const data: Prisma.EventUpdateInput = {
    ...("groupId" in input
      ? {
          group: {
            connect: {
              id: input.groupId
            }
          }
        }
      : {}),
    ...(input.title
      ? {
          title: input.title,
          slug: await getUniqueSlug(input.title, eventId)
        }
      : {}),
    ...("description" in input ? { description: input.description } : {}),
    ...("type" in input ? { type: input.type } : {}),
    ...("participationType" in input ? { participationType: input.participationType } : {}),
    ...("audienceScope" in input ? { audienceScope: input.audienceScope } : {}),
    ...("status" in input ? { status: input.status } : {}),
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
    ...("roundsEnabled" in input ? { roundsEnabled: input.roundsEnabled } : {}),
    ...("roundCount" in input ? { roundCount: input.roundCount } : {}),
    ...("winnerCount" in input ? { winnerCount: input.winnerCount } : {}),
    ...("metadata" in input
      ? {
          metadata: input.metadata as Prisma.InputJsonValue | undefined
        }
      : {})
  };

  return prisma.event.update({
    where: { id: eventId },
    data,
    include: eventInclude
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
    groupId?: string;
    type?: EventType;
    participationType?: ParticipationType;
    audienceScope?: AudienceScope;
    requiresPayment?: boolean;
  }
) => {
  let canSeeUniversityOnly = false;

  if (currentUserId) {
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        role: true,
        universityBadgeStatus: true
      }
    });

    canSeeUniversityOnly =
      currentUser?.role === UserRole.ADMIN ||
      currentUser?.universityBadgeStatus === UniversityBadgeStatus.VERIFIED;
  }

  if (!canSeeUniversityOnly && filters?.audienceScope === AudienceScope.UNIVERSITY_ONLY) {
    return [];
  }

  const andFilters: Prisma.EventWhereInput[] = [
    { status: EventStatus.PUBLISHED },
    { group: { is: { status: EventStatus.PUBLISHED } } }
  ];

  if (filters?.groupId) {
    andFilters.push({ groupId: filters.groupId });
  }

  if (filters?.type) {
    andFilters.push({ type: filters.type });
  }

  if (filters?.participationType) {
    andFilters.push({ participationType: filters.participationType });
  }

  if (typeof filters?.requiresPayment === "boolean") {
    andFilters.push({ requiresPayment: filters.requiresPayment });
  }

  if (filters?.audienceScope === AudienceScope.OPEN) {
    andFilters.push({ audienceScope: AudienceScope.OPEN });
    andFilters.push({ group: { is: { audienceScope: AudienceScope.OPEN } } });
  } else if (filters?.audienceScope === AudienceScope.UNIVERSITY_ONLY) {
    andFilters.push({
      OR: [
        { audienceScope: AudienceScope.UNIVERSITY_ONLY },
        { group: { is: { audienceScope: AudienceScope.UNIVERSITY_ONLY } } }
      ]
    });
  } else if (!canSeeUniversityOnly) {
    andFilters.push({ audienceScope: AudienceScope.OPEN });
    andFilters.push({ group: { is: { audienceScope: AudienceScope.OPEN } } });
  }

  const where: Prisma.EventWhereInput = {
    AND: andFilters
  };

  return prisma.event.findMany({
    where,
    include: {
      createdBy: {
        select: {
          id: true,
          fullName: true
        }
      },
      group: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};

export const getEventById = async (eventId: string, currentUserId?: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      ...eventInclude,
      registrations: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true
            }
          },
          team: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (event.status !== EventStatus.PUBLISHED) {
    const currentUser = currentUserId
      ? await prisma.user.findUnique({
          where: { id: currentUserId },
          select: { role: true }
        })
      : null;

    if (currentUser?.role !== UserRole.ADMIN) {
      throw new ApiError(404, "Event not found");
    }
  }

  if (event.group.status !== EventStatus.PUBLISHED) {
    const currentUser = currentUserId
      ? await prisma.user.findUnique({
          where: { id: currentUserId },
          select: { role: true }
        })
      : null;

    if (currentUser?.role !== UserRole.ADMIN) {
      throw new ApiError(404, "Event not found");
    }
  }

  if (
    getEffectiveAudienceScope(event.audienceScope, event.group.audienceScope) ===
    AudienceScope.UNIVERSITY_ONLY
  ) {
    if (!currentUserId) {
      throw new ApiError(403, "This event is only visible to verified university students");
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        role: true,
        universityBadgeStatus: true
      }
    });

    if (
      currentUser?.role !== UserRole.ADMIN &&
      currentUser?.universityBadgeStatus !== UniversityBadgeStatus.VERIFIED
    ) {
      throw new ApiError(403, "This event is only visible to verified university students");
    }
  }

  return event;
};

export const listEventGroups = async (
  currentUserId?: string,
  filters?: { audienceScope?: AudienceScope }
) => {
  let canSeeUniversityOnly = false;

  if (currentUserId) {
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        role: true,
        universityBadgeStatus: true
      }
    });

    canSeeUniversityOnly =
      currentUser?.role === UserRole.ADMIN ||
      currentUser?.universityBadgeStatus === UniversityBadgeStatus.VERIFIED;
  }

  const where: Prisma.EventGroupWhereInput = {
    status: EventStatus.PUBLISHED,
    ...(filters?.audienceScope
      ? { audienceScope: filters.audienceScope }
      : canSeeUniversityOnly
        ? {}
        : { audienceScope: AudienceScope.OPEN })
  };

  if (!canSeeUniversityOnly && filters?.audienceScope === AudienceScope.UNIVERSITY_ONLY) {
    return [];
  }

  return prisma.eventGroup.findMany({
    where,
    include: {
      createdBy: {
        select: {
          id: true,
          fullName: true
        }
      },
      events: {
        where: {
          status: EventStatus.PUBLISHED,
          ...(canSeeUniversityOnly ? {} : { audienceScope: AudienceScope.OPEN })
        },
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          participationType: true,
          status: true,
          audienceScope: true
        },
        orderBy: {
          createdAt: "asc"
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};

export const getEventGroupById = async (groupId: string, currentUserId?: string) => {
  const eventGroup = await prisma.eventGroup.findUnique({
    where: { id: groupId },
    include: {
      createdBy: {
        select: {
          id: true,
          fullName: true
        }
      },
      events: {
        include: {
          group: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });

  if (!eventGroup) {
    throw new ApiError(404, "Event group not found");
  }

  const currentUser = currentUserId
    ? await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          role: true,
          universityBadgeStatus: true
        }
      })
    : null;

  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const canSeeUniversityOnly =
    isAdmin || currentUser?.universityBadgeStatus === UniversityBadgeStatus.VERIFIED;

  if (eventGroup.status !== EventStatus.PUBLISHED) {
    if (!isAdmin) {
      throw new ApiError(404, "Event group not found");
    }
  }

  if (eventGroup.audienceScope === AudienceScope.UNIVERSITY_ONLY) {
    if (!currentUserId) {
      throw new ApiError(403, "This event group is only visible to verified university students");
    }

    if (
      !isAdmin &&
      currentUser?.universityBadgeStatus !== UniversityBadgeStatus.VERIFIED
    ) {
      throw new ApiError(403, "This event group is only visible to verified university students");
    }
  }

  return {
    ...eventGroup,
    events: isAdmin
      ? eventGroup.events
      : eventGroup.events.filter(
          (event) =>
            event.status === EventStatus.PUBLISHED &&
            (canSeeUniversityOnly || event.audienceScope === AudienceScope.OPEN)
        )
  };
};

export const registerForSoloEvent = async (eventId: string, userId: string) => {
  const event = await ensureUniversityEligibility(eventId, userId);

  if (event.participationType !== ParticipationType.SOLO) {
    throw new ApiError(400, "Use the team registration endpoint for this event");
  }

  const existingRegistration = await prisma.eventRegistration.findFirst({
    where: {
      eventId,
      userId
    }
  });

  if (existingRegistration) {
    throw new ApiError(400, "You are already registered for this event");
  }

  return prisma.eventRegistration.create({
    data: {
      eventId,
      userId,
      status: event.requiresPayment ? RegistrationStatus.PENDING : RegistrationStatus.CONFIRMED,
      paymentStatus: event.requiresPayment ? PaymentStatus.PENDING : PaymentStatus.NOT_REQUIRED,
      amountDue: event.entryFee
    },
    include: {
      event: true
    }
  });
};

export const registerTeamForEvent = async (
  eventId: string,
  captainId: string,
  input: { name: string; memberIds?: string[] }
) => {
  const event = await ensureUniversityEligibility(eventId, captainId);

  if (event.participationType !== ParticipationType.TEAM) {
    throw new ApiError(400, "This event is only available for solo registration");
  }

  const uniqueMemberIds = [...new Set([captainId, ...(input.memberIds ?? [])])];

  if (event.teamSizeMin && uniqueMemberIds.length < event.teamSizeMin) {
    throw new ApiError(400, `Team must include at least ${event.teamSizeMin} members`);
  }

  if (event.teamSizeMax && uniqueMemberIds.length > event.teamSizeMax) {
    throw new ApiError(400, `Team cannot include more than ${event.teamSizeMax} members`);
  }

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: uniqueMemberIds
      }
    },
    select: {
      id: true,
      universityBadgeStatus: true
    }
  });

  if (users.length !== uniqueMemberIds.length) {
    throw new ApiError(400, "One or more team members were not found");
  }

  if (event.audienceScope === AudienceScope.UNIVERSITY_ONLY) {
    const unverifiedMember = users.find(
      (user) => user.universityBadgeStatus !== UniversityBadgeStatus.VERIFIED
    );

    if (unverifiedMember) {
      throw new ApiError(403, "Every team member must have a verified university badge");
    }
  }

  const existingRegistration = await prisma.eventRegistration.findFirst({
    where: {
      eventId,
      OR: [{ userId: captainId }, { team: { captainId } }]
    }
  });

  if (existingRegistration) {
    throw new ApiError(400, "You already manage a registration for this event");
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
        status: event.requiresPayment ? RegistrationStatus.PENDING : RegistrationStatus.CONFIRMED,
        paymentStatus: event.requiresPayment ? PaymentStatus.PENDING : PaymentStatus.NOT_REQUIRED,
        amountDue: event.entryFee
      },
      include: {
        event: true,
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true
                  }
                }
              }
            }
          }
        }
      }
    });
  });
};

export const getBracket = async (eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      rounds: {
        orderBy: {
          roundNumber: "asc"
        },
        include: {
          matches: {
            orderBy: {
              createdAt: "asc"
            },
            include: {
              participantA: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true
                    }
                  },
                  team: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              },
              participantB: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true
                    }
                  },
                  team: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              },
              winner: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true
                    }
                  },
                  team: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  return event;
};

export const getLeaderboard = async (eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      leaderboardEntries: {
        orderBy: [{ position: "asc" }, { score: "desc" }],
        include: {
          registration: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true
                }
              },
              team: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  return event;
};

export const cancelEventRegistration = async (eventId: string, userId: string) => {
  const registration = await prisma.eventRegistration.findFirst({
    where: {
      eventId,
      OR: [{ userId }, { team: { captainId: userId } }]
    },
    include: {
      event: true,
      team: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!registration) {
    throw new ApiError(404, "Registration not found for this user and event");
  }

  if (registration.status === RegistrationStatus.CANCELLED) {
    throw new ApiError(400, "Registration is already cancelled");
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
    include: {
      event: true,
      team: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true
                }
              }
            }
          }
        }
      }
    }
  });
};
