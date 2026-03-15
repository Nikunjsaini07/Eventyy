import { z } from 'zod';

export const registerSchema = z.object({
  rollNumber: z.string().min(3),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  department: z.string().optional()
});

export const loginSchema = z.object({
  rollNumber: z.string().min(3),
  password: z.string().min(8)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});
