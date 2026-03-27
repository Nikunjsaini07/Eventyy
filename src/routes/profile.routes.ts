import { Router } from "express";

import {
  getMyProfileController,
  submitUniversityDetailsController
} from "../controllers/profile.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import { submitUniversityProfileSchema } from "../validators/profile.validators";

const router = Router();

router.use(requireAuth);

router.get(
  "/me",
  asyncHandler(getMyProfileController)
);

router.patch(
  "/university",
  validate({ body: submitUniversityProfileSchema }),
  asyncHandler(submitUniversityDetailsController)
);

export default router;
