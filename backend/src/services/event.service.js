import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination } from '../utils/pagination.js';

export const createEvent = (data, adminId) => prisma.event.create({ data: { ...data, startDate: new Date(data.startDate), endDate: new Date(data.endDate), createdBy: adminId } });

export const updateEvent = async (eventId, data) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new ApiError(404, 'Event not found');

  return prisma.event.update({
    where: { id: eventId },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined
    }
  });
};

export const deleteEvent = async (eventId) => {
  await prisma.event.delete({ where: { id: eventId } });
};

export const assignCoordinator = async (eventId, coordinatorId) => {
  const [event, coordinator] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.user.findUnique({ where: { id: coordinatorId } })
  ]);

  if (!event) throw new ApiError(404, 'Event not found');
  if (!coordinator || coordinator.role !== 'COORDINATOR') throw new ApiError(400, 'Invalid coordinator');

  return prisma.eventCoordinator.upsert({
    where: { eventId_coordinatorId: { eventId, coordinatorId } },
    update: {},
    create: { eventId, coordinatorId }
  });
};

export const listEvents = async (query) => {
  const { page, pageSize, skip, take } = getPagination(query);
  const where = {
    status: query.status || undefined,
    ...(query.year
      ? {
          startDate: {
            gte: new Date(`${query.year}-01-01T00:00:00.000Z`),
            lte: new Date(`${query.year}-12-31T23:59:59.999Z`)
          }
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.event.findMany({ where, skip, take, orderBy: { startDate: 'desc' }, include: { games: true } }),
    prisma.event.count({ where })
  ]);

  return { items, meta: { page, pageSize, total } };
};

export const getEventAnalytics = async () => {
  const [participantsByEvent, popularGame, activeStudents, winnersArchive] = await Promise.all([
    prisma.participant.groupBy({ by: ['gameId'], _count: { _all: true } }),
    prisma.participant.groupBy({ by: ['gameId'], _count: { _all: true }, orderBy: { _count: { gameId: 'desc' } }, take: 1 }),
    prisma.user.count({ where: { role: 'STUDENT', participants: { some: {} } } }),
    prisma.winner.groupBy({ by: ['year'], _count: { _all: true }, orderBy: { year: 'desc' } })
  ]);

  return {
    totalParticipants: participantsByEvent.reduce((acc, curr) => acc + curr._count._all, 0),
    mostPopularGame: popularGame[0] || null,
    activeStudents,
    pastWinnersArchive: winnersArchive
  };
};
