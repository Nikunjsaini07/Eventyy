import { UserRole } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

import { prisma } from "../config/prisma";
import { ApiError } from "../utils/api-error";

export const requireRoles =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You are not allowed to perform this action"));
    }

    return next();
  };

export const requireEventManager = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (req.user.role === UserRole.ADMIN) {
    return next();
  }

  const eventId = String(req.params.eventId ?? "");

  if (!eventId) {
    return next(new ApiError(400, "Event id is required"));
  }

  const now = new Date();

  const assignment = await prisma.coordinatorAssignment.findFirst({
    where: {
      userId: req.user.id,
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
    return next(new ApiError(403, "Coordinator access is required for this event"));
  }

  return next();
};
