import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export const setUserActiveState = async (userId, isActive) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');

  return prisma.user.update({ where: { id: userId }, data: { isActive } });
};
