import { Router } from "express";

import {
  getCurrentUserController,
  requestOtpController,
  verifyOtpController
} from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import { requestOtpSchema, verifyOtpSchema } from "../validators/auth.validators";

const router = Router();

router.post(
  "/request-otp",
  validate({ body: requestOtpSchema }),
  asyncHandler(requestOtpController)
);

router.post(
  "/verify-otp",
  validate({ body: verifyOtpSchema }),
  asyncHandler(verifyOtpController)
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(getCurrentUserController)
);

export default router;
