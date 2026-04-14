import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

import { env } from "../config/env";

import { requireAuth } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/role.middleware";
import { UserRole } from "@prisma/client";

// Configure Cloudinary with env variables
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "eventyy_uploads",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
  } as any,
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = Router();

router.use(requireAuth, requireRoles(UserRole.ADMIN));

router.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image file provided" });
  }

  // Cloudinary returns the secure URL in req.file.path
  res.status(201).json({ url: req.file.path });
});

export default router;
