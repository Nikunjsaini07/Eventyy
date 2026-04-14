import { UserRole } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

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
