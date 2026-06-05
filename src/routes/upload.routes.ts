import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

import { env } from "../config/env";

import { requireAuth } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/role.middleware";
import { UserRole } from "@prisma/client";

const hasCloudinaryConfig = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

const upload = hasCloudinaryConfig
  ? (() => {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
      });

      const storage = new CloudinaryStorage({
        cloudinary,
        params: {
          folder: "eventyy_uploads",
          allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
        } as any,
      });

      return multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 },
      });
    })()
  : null;

const router = Router();

router.use(requireAuth, requireRoles(UserRole.ADMIN));

router.post("/", (req, res, next) => {
  if (!upload) {
    return res.status(503).json({
      message: "Image upload is unavailable because Cloudinary environment variables are not configured.",
    });
  }

  return upload.single("image")(req, res, next);
});

router.post("/", (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image file provided" });
  }

  // Cloudinary returns the secure URL in req.file.path
  res.status(201).json({ url: req.file.path });
});

export default router;
