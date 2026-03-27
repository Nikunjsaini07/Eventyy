import { z } from "zod";

export const roundSyncSchema = z.object({
  rounds: z
    .array(
      z.object({
        roundNumber: z.number().int().positive(),
        name: z.string().trim().min(2).max(60),
        isOptional: z.boolean().optional()
      })
    )
    .min(1)
});

export const createMatchesSchema = z.object({
  matches: z
    .array(
      z.object({
        roundId: z.string().trim().min(1).optional(),
        roundNumber: z.number().int().positive(),
        slotLabel: z.string().trim().max(40).optional(),
        participantARegistrationId: z.string().trim().min(1).optional(),
        participantBRegistrationId: z.string().trim().min(1).optional(),
        nextMatchId: z.string().trim().min(1).optional(),
        nextMatchSlot: z.number().int().min(1).max(2).optional(),
        scheduledAt: z.string().datetime().optional(),
        notes: z.string().trim().max(300).optional()
      })
    )
    .min(1)
});

export const matchResultParamsSchema = z.object({
  matchId: z.string().trim().min(1)
});

export const matchResultSchema = z.object({
  winnerRegistrationId: z.string().trim().min(1),
  notes: z.string().trim().max(300).optional()
});

export const leaderboardSchema = z.object({
  entries: z
    .array(
      z.object({
        registrationId: z.string().trim().min(1),
        score: z.number(),
        wins: z.number().int().min(0).optional(),
        losses: z.number().int().min(0).optional(),
        draws: z.number().int().min(0).optional(),
        position: z.number().int().positive().optional(),
        qualified: z.boolean().optional(),
        notes: z.string().trim().max(300).optional()
      })
    )
    .min(1)
});

export const resultSchema = z.object({
  results: z
    .array(
      z.object({
        registrationId: z.string().trim().min(1),
        rank: z.number().int().positive(),
        title: z.string().trim().max(120).optional(),
        isWinner: z.boolean().optional()
      })
    )
    .min(1)
});
