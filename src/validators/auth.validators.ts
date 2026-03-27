import { z } from "zod";

export const requestOtpSchema = z.object({
  email: z.string().email(),
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(8).max(20).optional()
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().trim().length(6),
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(8).max(20).optional()
});

