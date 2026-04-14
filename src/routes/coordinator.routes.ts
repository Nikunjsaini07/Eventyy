import { Router } from "express";

import {
  listCoordinatorEventsController,
  listManageableRegistrationsController,
  reviewRegistrationController
} from "../controllers/coordinator.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import {
  registrationIdParamsSchema,
  reviewRegistrationSchema
} from "../validators/coordinator.validators";
import { eventIdParamsSchema } from "../validators/event.validators";

const router = Router();

router.use(requireAuth);

router.get("/events", asyncHandler(listCoordinatorEventsController));

router.get(
  "/events/:eventId/registrations",
  validate({ params: eventIdParamsSchema }),
  asyncHandler(listManageableRegistrationsController)
);

router.patch(
  "/registrations/:registrationId/review",
  validate({ params: registrationIdParamsSchema, body: reviewRegistrationSchema }),
  asyncHandler(reviewRegistrationController)
);

export default router;
