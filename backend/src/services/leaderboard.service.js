import { prisma } from '../config/prisma.js';
import { getPagination } from '../utils/pagination.js';

const pointsByPosition = {
  '1st': 100,
  '2nd': 60,
  '3rd': 40
};

export const updateLeaderboardForWinner = async (tx, studentId, position) => {
  const points = pointsByPosition[position] || 20;
  const existing = await tx.leaderboard.findUnique({ where: { studentId } });

  if (!existing) {
    await tx.leaderboard.create({ data: { studentId, totalPoints: points } });
    return;
  }

  await tx.leaderboard.update({ where: { studentId }, data: { totalPoints: existing.totalPoints + points } });
};

export const getLeaderboard = async (query) => {
  const { page, pageSize, skip, take } = getPagination(query);
  const where = query.department
    ? {
        student: {
          department: query.department
        }
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.leaderboard.findMany({ where, include: { student: true }, orderBy: { totalPoints: 'desc' }, skip, take }),
    prisma.leaderboard.count({ where })
  ]);

  return { items, meta: { page, pageSize, total } };
};
