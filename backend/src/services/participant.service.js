import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export const registerParticipant = async ({ gameId, studentId, teamId }) => {
  const game = await prisma.game.findUnique({ where: { id: gameId }, include: { _count: { select: { participants: true } } } });
  if (!game) throw new ApiError(404, 'Game not found');
  if (game._count.participants >= game.maxParticipants) throw new ApiError(400, 'Game is full');

  const user = await prisma.user.findUnique({ where: { id: studentId } });
  if (!user || user.role !== 'STUDENT') throw new ApiError(400, 'Only students can register');

  return prisma.participant.create({ data: { gameId, studentId, teamId } });
};
