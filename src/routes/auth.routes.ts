import { Router } from "express";

import {
  getCurrentUserController,
  loginController,
  registerController,
  requestEmailVerificationOtpController,
  requestPasswordResetOtpController,
  resetPasswordController,
  verifyEmailOtpController
} from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import {
  emailOnlySchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailOtpSchema
} from "../validators/auth.validators";

const router = Router();

router.post("/register", validate({ body: registerSchema }), asyncHandler(registerController));

router.post("/login", validate({ body: loginSchema }), asyncHandler(loginController));

router.post(
  "/request-verification-otp",
  validate({ body: emailOnlySchema }),
  asyncHandler(requestEmailVerificationOtpController)
);

router.post(
  "/verify-email",
  validate({ body: verifyEmailOtpSchema }),
  asyncHandler(verifyEmailOtpController)
);

router.post(
  "/request-password-reset-otp",
  validate({ body: emailOnlySchema }),
  asyncHandler(requestPasswordResetOtpController)
);

router.post(
  "/reset-password",
  validate({ body: resetPasswordSchema }),
  asyncHandler(resetPasswordController)
);

router.get("/me", requireAuth, asyncHandler(getCurrentUserController));

export default router;
