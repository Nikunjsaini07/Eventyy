import { Router } from "express";

import adminRoutes from "./admin.routes";
import authRoutes from "./auth.routes";
import coordinatorRoutes from "./coordinator.routes";
import eventRoutes from "./event.routes";
import profileRoutes from "./profile.routes";
import siteRoutes from "./site.routes";
import uploadRoutes from "./upload.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    message: "Backend is running"
  });
});

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/admin", adminRoutes);
router.use("/site-content", siteRoutes);
router.use("/coordinator", coordinatorRoutes);
router.use("/events", eventRoutes);
router.use("/upload", uploadRoutes);

export default router;
