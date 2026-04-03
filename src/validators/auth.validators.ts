import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must be at most 128 characters long");

export const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(20).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: passwordSchema
});

export const emailOnlySchema = z.object({
  email: z.string().email()
});

export const verifyEmailOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().trim().length(6)
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().trim().length(6),
  newPassword: passwordSchema
});
