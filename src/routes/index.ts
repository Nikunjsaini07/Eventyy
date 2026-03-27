import { Router } from "express";

import adminRoutes from "./admin.routes";
import authRoutes from "./auth.routes";
import competitionRoutes from "./competition.routes";
import eventRoutes from "./event.routes";
import profileRoutes from "./profile.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    message: "Backend is running"
  });
});

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/admin", adminRoutes);
router.use("/events", eventRoutes);
router.use("/competition", competitionRoutes);

export default router;

