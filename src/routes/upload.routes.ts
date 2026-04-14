import fs from "fs";
import path from "path";
import { Router } from "express";
import multer from "multer";

import { requireAuth } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/role.middleware";
import { UserRole } from "@prisma/client";

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
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

  // The frontend can use this URL directly
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(201).json({ url: fileUrl });
});

export default router;
