import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination } from '../utils/pagination.js';

const coordinatorCanManageEvent = async (eventId, coordinatorId) => {
  const relation = await prisma.eventCoordinator.findUnique({ where: { eventId_coordinatorId: { eventId, coordinatorId } } });
  return Boolean(relation);
};

export const createGame = async (data, user) => {
  const event = await prisma.event.findUnique({ where: { id: data.eventId } });
  if (!event) throw new ApiError(404, 'Event not found');
  if (user.role === 'COORDINATOR') {
    const allowed = await coordinatorCanManageEvent(data.eventId, user.id);
    if (!allowed) throw new ApiError(403, 'Coordinator is not assigned to this event');
  }

  return prisma.game.create({ data });
};

export const updateGame = async (gameId, data, user) => {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new ApiError(404, 'Game not found');

  if (user.role === 'COORDINATOR') {
    const allowed = await coordinatorCanManageEvent(game.eventId, user.id);
    if (!allowed) throw new ApiError(403, 'Coordinator is not assigned to this event');
  }

  return prisma.game.update({ where: { id: gameId }, data });
};

export const listGames = async (query) => {
  const { page, pageSize, skip, take } = getPagination(query);
  const where = {
    eventId: query.eventId || undefined,
    ...(query.year
      ? {
          event: {
            startDate: {
              gte: new Date(`${query.year}-01-01T00:00:00.000Z`),
              lte: new Date(`${query.year}-12-31T23:59:59.999Z`)
            }
          }
        }
      : {})
  };
  const [items, total] = await Promise.all([
    prisma.game.findMany({ where, include: { event: true }, skip, take }),
    prisma.game.count({ where })
  ]);
  return { items, meta: { page, pageSize, total } };
};
