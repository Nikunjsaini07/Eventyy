import { AudienceScope, EventStatus, EventType, ParticipationType } from "@prisma/client";
import { z } from "zod";

export const eventIdParamsSchema = z.object({
  eventId: z.string().trim().min(1)
});

const eventPayloadSchema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(1000).optional(),
  type: z.nativeEnum(EventType),
  participationType: z.nativeEnum(ParticipationType),
  audienceScope: z.nativeEnum(AudienceScope).default(AudienceScope.OPEN),
  status: z.nativeEnum(EventStatus).default(EventStatus.DRAFT),
  requiresPayment: z.boolean().default(false),
  entryFee: z.number().nonnegative().optional(),
  venue: z.string().trim().max(160).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  registrationOpensAt: z.string().datetime().optional(),
  registrationClosesAt: z.string().datetime().optional(),
  maxParticipants: z.number().int().positive().optional(),
  teamSizeMin: z.number().int().positive().optional(),
  teamSizeMax: z.number().int().positive().optional(),
  roundsEnabled: z.boolean().default(false),
  roundCount: z.number().int().positive().optional(),
  winnerCount: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const createEventSchema = eventPayloadSchema;
export const updateEventSchema = eventPayloadSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided for update"
  }
);

export const listEventsQuerySchema = z.object({
  type: z.nativeEnum(EventType).optional(),
  participationType: z.nativeEnum(ParticipationType).optional(),
  audienceScope: z.nativeEnum(AudienceScope).optional(),
  requiresPayment: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional()
});

export const soloRegistrationSchema = z.object({});

export const teamRegistrationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  memberIds: z.array(z.string().trim().min(1)).max(20).optional()
});
