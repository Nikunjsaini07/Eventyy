import { UniversityBadgeStatus } from "@prisma/client";
import { z } from "zod";

export const submitUniversityProfileSchema = z.object({
  universityName: z.string().trim().min(2).max(120),
  universityEmail: z.string().email(),
  universityStudentId: z.string().trim().min(2).max(50),
  department: z.string().trim().min(2).max(80).optional(),
  course: z.string().trim().min(2).max(120).optional(),
  year: z.number().int().min(1).max(10).optional()
});

export const reviewUniversityBadgeSchema = z.object({
  status: z.enum([UniversityBadgeStatus.VERIFIED, UniversityBadgeStatus.REJECTED]),
  notes: z.string().trim().max(300).optional()
});

export const adminUserParamsSchema = z.object({
  userId: z.string().cuid()
});

export const deleteMyAccountSchema = z.object({
  code: z.string().trim().length(6)
});

export const createAdminSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(100),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(20).optional()
});
