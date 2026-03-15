import { prisma } from '../config/prisma.js';
import { verifyAccessToken } from '../utils/authTokens.js';
import { ApiError } from '../utils/ApiError.js';

export const authenticate = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authorization token missing'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user || !user.isActive) {
      return next(new ApiError(401, 'Invalid user session'));
    }
    req.user = user;
    return next();
  } catch {
    return next(new ApiError(401, 'Invalid or expired access token'));
  }
};

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Insufficient permissions'));
  }
  return next();
};
