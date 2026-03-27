import { z } from "zod";

export const assignCoordinatorSchema = z.object({
  userId: z.string().trim().min(1),
  eventId: z.string().trim().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  permissions: z.array(z.string().trim().min(1)).optional()
}).refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
  message: "endsAt must be later than startsAt",
  path: ["endsAt"]
});
