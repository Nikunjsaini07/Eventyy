import { z } from "zod";

export const assignmentIdParamsSchema = z.object({
  assignmentId: z.string().trim().min(1)
});

export const registrationIdParamsSchema = z.object({
  registrationId: z.string().trim().min(1)
});

export const assignCoordinatorSchema = z.object({
  userId: z.string().trim().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime()
});

export const reviewRegistrationSchema = z.object({
  status: z.enum(["CONFIRMED", "REJECTED"]),
  reviewNote: z.string().trim().max(300).optional()
});
