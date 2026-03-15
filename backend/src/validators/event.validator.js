import { z } from 'zod';

export const createEventSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  bannerImage: z.string().url().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  venue: z.string().min(2),
  status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED']).optional()
});

export const updateEventSchema = createEventSchema.partial();

export const assignCoordinatorSchema = z.object({
  coordinatorId: z.string().uuid()
});
