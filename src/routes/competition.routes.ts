import { Router } from "express";

import {
  createMatchesController,
  listEventRegistrationsController,
  publishResultsController,
  recordMatchResultController,
  syncRoundsController,
  upsertLeaderboardController
} from "../controllers/competition.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireEventManager } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import {
  createMatchesSchema,
  leaderboardSchema,
  matchResultParamsSchema,
  matchResultSchema,
  resultSchema,
  roundSyncSchema
} from "../validators/competition.validators";
import { eventIdParamsSchema } from "../validators/event.validators";

const router = Router();

router.use(requireAuth);

router.post(
  "/events/:eventId/rounds",
  validate({ params: eventIdParamsSchema, body: roundSyncSchema }),
  requireEventManager,
  asyncHandler(syncRoundsController)
);

router.get(
  "/events/:eventId/registrations",
  validate({ params: eventIdParamsSchema }),
  requireEventManager,
  asyncHandler(listEventRegistrationsController)
);

router.post(
  "/events/:eventId/matches",
  validate({ params: eventIdParamsSchema, body: createMatchesSchema }),
  requireEventManager,
  asyncHandler(createMatchesController)
);

router.patch(
  "/matches/:matchId/result",
  validate({ params: matchResultParamsSchema, body: matchResultSchema }),
  asyncHandler(recordMatchResultController)
);

router.put(
  "/events/:eventId/leaderboard",
  validate({ params: eventIdParamsSchema, body: leaderboardSchema }),
  requireEventManager,
  asyncHandler(upsertLeaderboardController)
);

router.put(
  "/events/:eventId/results",
  validate({ params: eventIdParamsSchema, body: resultSchema }),
  requireEventManager,
  asyncHandler(publishResultsController)
);

export default router;
