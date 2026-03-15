import { z } from 'zod';

export const createGameSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(2),
  rules: z.string().optional(),
  maxParticipants: z.number().int().positive(),
  gameType: z.enum(['INDIVIDUAL', 'TEAM'])
});

export const updateGameSchema = createGameSchema.partial();
