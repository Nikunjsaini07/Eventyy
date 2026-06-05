import { Router } from "express";

import {
  cancelEventRegistrationController,
  getEventByIdController,
  getEventGroupByIdController,
  listEventGroupsController,
  listEventsController,
  registerForSoloEventController,
  registerTeamForEventController,
  joinTeamForEventController,
  removeTeamMemberController
} from "../controllers/event.controller";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import {
  eventIdParamsSchema,
  groupIdParamsSchema,
  listEventsQuerySchema,
  soloRegistrationSchema,
  teamRegistrationSchema,
  joinTeamSchema,
  removeTeamMemberSchema
} from "../validators/event.validators";

const router = Router();

router.get(
  "/groups",
  optionalAuth,
  asyncHandler(listEventGroupsController)
);

router.get(
  "/groups/:groupId",
  optionalAuth,
  validate({ params: groupIdParamsSchema }),
  asyncHandler(getEventGroupByIdController)
);

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

router.post(
  "/:eventId/join-team",
  requireAuth,
  validate({ params: eventIdParamsSchema, body: joinTeamSchema }),
  asyncHandler(joinTeamForEventController)
);

router.delete(
  "/:eventId/register",
  requireAuth,
  validate({ params: eventIdParamsSchema }),
  asyncHandler(cancelEventRegistrationController)
);

router.delete(
  "/:eventId/team/members/:userId",
  requireAuth,
  validate({ params: removeTeamMemberSchema }),
  asyncHandler(removeTeamMemberController)
);

export default router;
