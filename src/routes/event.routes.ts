import { Router } from "express";

import {
  cancelEventRegistrationController,
  getBracketController,
  getEventByIdController,
  getLeaderboardController,
  listEventsController,
  registerForSoloEventController,
  registerTeamForEventController
} from "../controllers/event.controller";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import {
  eventIdParamsSchema,
  listEventsQuerySchema,
  soloRegistrationSchema,
  teamRegistrationSchema
} from "../validators/event.validators";

const router = Router();

router.get(
  "/",
  optionalAuth,
  validate({ query: listEventsQuerySchema }),
  asyncHandler(listEventsController)
);

router.get(
  "/:eventId",
  optionalAuth,
  validate({ params: eventIdParamsSchema }),
  asyncHandler(getEventByIdController)
);

router.post(
  "/:eventId/register",
  requireAuth,
  validate({ params: eventIdParamsSchema, body: soloRegistrationSchema }),
  asyncHandler(registerForSoloEventController)
);

router.post(
  "/:eventId/register-team",
  requireAuth,
  validate({ params: eventIdParamsSchema, body: teamRegistrationSchema }),
  asyncHandler(registerTeamForEventController)
);

router.delete(
  "/:eventId/register",
  requireAuth,
  validate({ params: eventIdParamsSchema }),
  asyncHandler(cancelEventRegistrationController)
);

router.get(
  "/:eventId/bracket",
  validate({ params: eventIdParamsSchema }),
  asyncHandler(getBracketController)
);

router.get(
  "/:eventId/leaderboard",
  validate({ params: eventIdParamsSchema }),
  asyncHandler(getLeaderboardController)
);

export default router;
