import { UserRole } from "@prisma/client";
import { Router } from "express";

import {
  assignCoordinatorController,
  createEventController,
  deactivateCoordinatorAssignmentController,
  deleteEventController,
  listCoordinatorAssignmentsController,
  listUsersController,
  promoteToAdminController,
  reviewUniversityBadgeController,
  updateEventController
} from "../controllers/admin.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import { assignCoordinatorSchema } from "../validators/coordinator.validators";
import {
  createEventSchema,
  eventIdParamsSchema,
  updateEventSchema
} from "../validators/event.validators";
import { reviewUniversityBadgeSchema } from "../validators/profile.validators";

const router = Router();

router.use(requireAuth, requireRoles(UserRole.ADMIN));

router.get(
  "/users",
  asyncHandler(listUsersController)
);

router.get("/coordinators", asyncHandler(listCoordinatorAssignmentsController));

router.post("/users/:userId/make-admin", asyncHandler(promoteToAdminController));

router.patch(
  "/users/:userId/university-badge",
  validate({ body: reviewUniversityBadgeSchema }),
  asyncHandler(reviewUniversityBadgeController)
);

router.post(
  "/coordinators",
  validate({ body: assignCoordinatorSchema }),
  asyncHandler(assignCoordinatorController)
);

router.patch(
  "/coordinators/:assignmentId/deactivate",
  asyncHandler(deactivateCoordinatorAssignmentController)
);

router.post(
  "/events",
  validate({ body: createEventSchema }),
  asyncHandler(createEventController)
);

router.patch(
  "/events/:eventId",
  validate({ params: eventIdParamsSchema, body: updateEventSchema }),
  asyncHandler(updateEventController)
);

router.delete(
  "/events/:eventId",
  validate({ params: eventIdParamsSchema }),
  asyncHandler(deleteEventController)
);

export default router;
