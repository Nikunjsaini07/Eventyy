import { z } from 'zod';

export const updateMatchResultSchema = z.object({
  winnerId: z.string().uuid(),
  scoreData: z.record(z.any()).optional()
});
