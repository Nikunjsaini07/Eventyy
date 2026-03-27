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
