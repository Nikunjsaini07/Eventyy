import { NextFunction, Request, Response } from "express";

import { prisma } from "../config/prisma";
import { ApiError } from "../utils/api-error";
import { verifyAccessToken } from "../utils/jwt";

const extractBearerToken = (authorization?: string) => {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
};

const attachUserFromToken = async (token: string, req: Request) => {
  const payload = verifyAccessToken(token);

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true
    }
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, "User account is inactive");
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role
  };
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return next();
    }

    await attachUserFromToken(token, req);
    return next();
  } catch {
    return next();
  }
};

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return next(new ApiError(401, "Authentication token is required"));
  }

  try {
    await attachUserFromToken(token, req);
    return next();
  } catch (error) {
    return next(new ApiError(401, "Invalid or expired token", error));
  }
};

