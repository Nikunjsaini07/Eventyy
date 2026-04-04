import { Router } from "express";

import {
  deleteMyAccountController,
  getMyProfileController,
  requestDeleteMyAccountOtpController,
  submitUniversityDetailsController
} from "../controllers/profile.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import {
  deleteMyAccountSchema,
  submitUniversityProfileSchema
} from "../validators/profile.validators";

const router = Router();

router.use(requireAuth);

router.get(
  "/me",
  asyncHandler(getMyProfileController)
);

router.post(
  "/me/request-delete-otp",
  asyncHandler(requestDeleteMyAccountOtpController)
);

router.delete(
  "/me",
  validate({ body: deleteMyAccountSchema }),
  asyncHandler(deleteMyAccountController)
);

router.patch(
  "/university",
  validate({ body: submitUniversityProfileSchema }),
  asyncHandler(submitUniversityDetailsController)
);

export default router;
