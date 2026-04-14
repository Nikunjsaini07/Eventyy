import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

export const validate =
  (schema: { body?: ZodTypeAny; query?: ZodTypeAny; params?: ZodTypeAny }) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (schema.body) {
      Object.defineProperty(req, "body", {
        value: schema.body.parse(req.body),
        enumerable: true
      });
    }

    if (schema.query) {
      Object.defineProperty(req, "query", {
        value: schema.query.parse(req.query),
        enumerable: true
      });
    }

    if (schema.params) {
      Object.defineProperty(req, "params", {
        value: schema.params.parse(req.params),
        enumerable: true
      });
    }

    next();
  };
