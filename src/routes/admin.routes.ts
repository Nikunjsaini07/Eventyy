import { UserRole } from "@prisma/client";
import { Router } from "express";

import {
  activateUserController,
  assignCoordinatorController,
  createAdminController,
  createEventController,
  createEventGroupController,
  deactivateCoordinatorAssignmentController,
  deactivateUserController,
  deleteEventController,
  deleteEventGroupController,
  getSiteContentController,
  listAdminEventGroupsController,
  listAdminEventsController,
  listUsersController,
  promoteToAdminController,
  reviewUniversityBadgeController,
  updateEventController,
  updateEventGroupController,
  updateSiteContentController
} from "../controllers/admin.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import {
  assignCoordinatorSchema,
  assignmentIdParamsSchema
} from "../validators/coordinator.validators";
import {
  createEventGroupSchema,
  createEventSchema,
  eventIdParamsSchema,
  groupIdParamsSchema,
  updateEventGroupSchema,
  updateEventSchema
} from "../validators/event.validators";
import {
  adminUserParamsSchema,
  createAdminSchema,
  reviewUniversityBadgeSchema
} from "../validators/profile.validators";
import { updateSiteContentSchema } from "../validators/site.validators";

const router = Router();

router.use(requireAuth, requireRoles(UserRole.ADMIN));

router.get("/site-content", asyncHandler(getSiteContentController));
router.patch(
  "/site-content",
  validate({ body: updateSiteContentSchema }),
  asyncHandler(updateSiteContentController)
);

router.get("/users", asyncHandler(listUsersController));
router.get("/events", asyncHandler(listAdminEventsController));
router.get("/event-groups", asyncHandler(listAdminEventGroupsController));

router.post(
  "/create-admin",
  validate({ body: createAdminSchema }),
  asyncHandler(createAdminController)
);

router.post(
  "/users/:userId/make-admin",
  validate({ params: adminUserParamsSchema }),
  asyncHandler(promoteToAdminController)
);

router.patch(
  "/users/:userId/activate",
  validate({ params: adminUserParamsSchema }),
  asyncHandler(activateUserController)
);

router.patch(
  "/users/:userId/deactivate",
  validate({ params: adminUserParamsSchema }),
  asyncHandler(deactivateUserController)
);

router.patch(
  "/users/:userId/university-badge",
  validate({ params: adminUserParamsSchema, body: reviewUniversityBadgeSchema }),
  asyncHandler(reviewUniversityBadgeController)
);

router.post(
  "/event-groups",
  validate({ body: createEventGroupSchema }),
  asyncHandler(createEventGroupController)
);

router.patch(
  "/event-groups/:groupId",
  validate({ params: groupIdParamsSchema, body: updateEventGroupSchema }),
  asyncHandler(updateEventGroupController)
);

router.delete(
  "/event-groups/:groupId",
  validate({ params: groupIdParamsSchema }),
  asyncHandler(deleteEventGroupController)
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

router.post(
  "/events/:eventId/coordinators",
  validate({ params: eventIdParamsSchema, body: assignCoordinatorSchema }),
  asyncHandler(assignCoordinatorController)
);

router.patch(
  "/coordinator-assignments/:assignmentId/deactivate",
  validate({ params: assignmentIdParamsSchema }),
  asyncHandler(deactivateCoordinatorAssignmentController)
);

export default router;
