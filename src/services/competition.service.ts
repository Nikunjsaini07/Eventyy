import { EventType, MatchStatus, UserRole } from "@prisma/client";

import { prisma } from "../config/prisma";
import { ApiError } from "../utils/api-error";

export const ensureEventManagerAccess = async (userId: string, eventId: string, role: string) => {
  if (role === UserRole.ADMIN) {
    return;
  }

  const now = new Date();

  const assignment = await prisma.coordinatorAssignment.findFirst({
    where: {
      userId,
      isActive: true,
      eventId,
      startsAt: {
        lte: now
      },
      endsAt: {
        gte: now
      }
    }
  });

  if (!assignment) {
    throw new ApiError(403, "Coordinator access is required for this event");
  }
};

export const syncRounds = async (
  userId: string,
  role: string,
  eventId: string,
  input: {
    rounds: { roundNumber: number; name: string; isOptional?: boolean }[];
  }
) => {
  await ensureEventManagerAccess(userId, eventId, role);

  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (event.type === EventType.VISITING) {
    throw new ApiError(400, "Visiting events do not support rounds");
  }

  await prisma.$transaction(
    input.rounds.map((round) =>
      prisma.eventRound.upsert({
        where: {
          eventId_roundNumber: {
            eventId,
            roundNumber: round.roundNumber
          }
        },
        update: {
          name: round.name,
          isOptional: round.isOptional ?? false
        },
        create: {
          eventId,
          roundNumber: round.roundNumber,
          name: round.name,
          isOptional: round.isOptional ?? false
        }
      })
    )
  );

  return prisma.eventRound.findMany({
    where: { eventId },
    orderBy: {
      roundNumber: "asc"
    }
  });
};

export const createMatches = async (
  userId: string,
  role: string,
  eventId: string,
  input: {
    matches: Array<{
      roundId?: string;
      roundNumber: number;
      slotLabel?: string;
      participantARegistrationId?: string;
      participantBRegistrationId?: string;
      nextMatchId?: string;
      nextMatchSlot?: number;
      scheduledAt?: string;
      notes?: string;
    }>;
  }
) => {
  await ensureEventManagerAccess(userId, eventId, role);

  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (event.type !== EventType.PVP) {
    throw new ApiError(400, "Matches are only supported for PVP events");
  }

  return prisma.$transaction(async (tx) => {
    for (const match of input.matches) {
      const registrationIds = [
        match.participantARegistrationId,
        match.participantBRegistrationId
      ].filter(Boolean) as string[];

      if (registrationIds.length > 0) {
        const registrations = await tx.eventRegistration.count({
          where: {
            eventId,
            id: {
              in: registrationIds
            }
          }
        });

        if (registrations !== registrationIds.length) {
          throw new ApiError(400, "Match participants must belong to the same event");
        }
      }
    }

    await tx.pvpMatch.createMany({
      data: input.matches.map((match) => ({
        eventId,
        roundId: match.roundId,
        roundNumber: match.roundNumber,
        slotLabel: match.slotLabel,
        participantARegistrationId: match.participantARegistrationId,
        participantBRegistrationId: match.participantBRegistrationId,
        nextMatchId: match.nextMatchId,
        nextMatchSlot: match.nextMatchSlot,
        scheduledAt: match.scheduledAt ? new Date(match.scheduledAt) : undefined,
        notes: match.notes
      }))
    });

    return tx.pvpMatch.findMany({
      where: { eventId },
      orderBy: [{ roundNumber: "asc" }, { createdAt: "asc" }]
    });
  });
};

export const recordMatchResult = async (
  userId: string,
  role: string,
  matchId: string,
  input: {
    winnerRegistrationId: string;
    notes?: string;
  }
) => {
  const match = await prisma.pvpMatch.findUnique({
    where: { id: matchId }
  });

  if (!match) {
    throw new ApiError(404, "Match not found");
  }

  await ensureEventManagerAccess(userId, match.eventId, role);

  if (
    input.winnerRegistrationId !== match.participantARegistrationId &&
    input.winnerRegistrationId !== match.participantBRegistrationId
  ) {
    throw new ApiError(400, "Winner must be one of the match participants");
  }

  return prisma.$transaction(async (tx) => {
    const updatedMatch = await tx.pvpMatch.update({
      where: { id: matchId },
      data: {
        winnerRegistrationId: input.winnerRegistrationId,
        status: MatchStatus.COMPLETED,
        notes: input.notes,
        completedAt: new Date()
      }
    });

    if (updatedMatch.nextMatchId && updatedMatch.nextMatchSlot) {
      await tx.pvpMatch.update({
        where: {
          id: updatedMatch.nextMatchId
        },
        data:
          updatedMatch.nextMatchSlot === 1
            ? { participantARegistrationId: input.winnerRegistrationId }
            : { participantBRegistrationId: input.winnerRegistrationId }
      });
    }

    return tx.pvpMatch.findUnique({
      where: { id: matchId },
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
    });
  });
};

export const upsertLeaderboard = async (
  userId: string,
  role: string,
  eventId: string,
  input: {
    entries: Array<{
      registrationId: string;
      score: number;
      wins?: number;
      losses?: number;
      draws?: number;
      position?: number;
      qualified?: boolean;
      notes?: string;
    }>;
  }
) => {
  await ensureEventManagerAccess(userId, eventId, role);

  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (event.type !== EventType.RANKED) {
    throw new ApiError(400, "Leaderboard updates are only supported for ranked events");
  }

  await prisma.$transaction(
    input.entries.map((entry) =>
      prisma.leaderboardEntry.upsert({
        where: {
          eventId_registrationId: {
            eventId,
            registrationId: entry.registrationId
          }
        },
        update: {
          score: entry.score,
          wins: entry.wins ?? 0,
          losses: entry.losses ?? 0,
          draws: entry.draws ?? 0,
          position: entry.position,
          qualified: entry.qualified ?? false,
          notes: entry.notes
        },
        create: {
          eventId,
          registrationId: entry.registrationId,
          score: entry.score,
          wins: entry.wins ?? 0,
          losses: entry.losses ?? 0,
          draws: entry.draws ?? 0,
          position: entry.position,
          qualified: entry.qualified ?? false,
          notes: entry.notes
        }
      })
    )
  );

  return prisma.leaderboardEntry.findMany({
    where: { eventId },
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
    },
    orderBy: [{ position: "asc" }, { score: "desc" }]
  });
};

export const publishResults = async (
  userId: string,
  role: string,
  eventId: string,
  input: {
    results: Array<{
      registrationId: string;
      rank: number;
      title?: string;
      isWinner?: boolean;
    }>;
  }
) => {
  await ensureEventManagerAccess(userId, eventId, role);

  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  const registrationCount = await prisma.eventRegistration.count({
    where: {
      eventId,
      id: {
        in: input.results.map((result) => result.registrationId)
      }
    }
  });

  if (registrationCount !== input.results.length) {
    throw new ApiError(400, "Every result must reference a registration from this event");
  }

  await prisma.$transaction(async (tx) => {
    await tx.eventResult.deleteMany({
      where: {
        eventId
      }
    });

    for (const result of input.results) {
      await tx.eventResult.create({
        data: {
          eventId,
          registrationId: result.registrationId,
          rank: result.rank,
          title: result.title,
          isWinner: result.isWinner ?? result.rank === 1
        }
      });
    }
  });

  return prisma.eventResult.findMany({
    where: { eventId },
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
    },
    orderBy: {
      rank: "asc"
    }
  });
};

export const listEventRegistrations = async (userId: string, role: string, eventId: string) => {
  await ensureEventManagerAccess(userId, eventId, role);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      registrations: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              universityBadgeStatus: true
            }
          },
          team: {
            include: {
              captain: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              },
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      email: true,
                      universityBadgeStatus: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  return event;
};
