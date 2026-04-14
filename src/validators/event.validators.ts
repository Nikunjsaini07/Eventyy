import { AudienceScope, EventStatus, ParticipationType } from "@prisma/client";
import { z } from "zod";

const optionalUrlSchema = z.string().trim().max(1000).optional().nullable();
const optionalDateTimeSchema = z.string().datetime().optional().nullable();

export const eventIdParamsSchema = z.object({
  eventId: z.string().trim().min(1)
});

export const groupIdParamsSchema = z.object({
  groupId: z.string().trim().min(1)
});

const eventGroupPayloadSchema = z.object({
  title: z.string().trim().min(3).max(140),
  subtitle: z.string().trim().max(160).optional().nullable(),
  description: z.string().trim().max(10000).optional().nullable(),
  bannerImageUrl: optionalUrlSchema,
  venue: z.string().trim().max(160).optional().nullable(),
  startsAt: optionalDateTimeSchema,
  endsAt: optionalDateTimeSchema,
  audienceScope: z.nativeEnum(AudienceScope).default(AudienceScope.OPEN),
  status: z.nativeEnum(EventStatus).default(EventStatus.DRAFT),
  metadata: z.record(z.string(), z.unknown()).optional().nullable()
});

const eventPayloadSchema = z.object({
  groupId: z.string().trim().min(1).optional().nullable(),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(10000).optional().nullable(),
  bannerImageUrl: optionalUrlSchema,
  backgroundImageUrl: optionalUrlSchema,
  participationType: z.nativeEnum(ParticipationType),
  audienceScope: z.nativeEnum(AudienceScope).default(AudienceScope.OPEN),
  status: z.nativeEnum(EventStatus).default(EventStatus.DRAFT),
  requiresApproval: z.boolean().default(false),
  requiresPayment: z.boolean().default(false),
  entryFee: z.number().nonnegative().optional().nullable(),
  venue: z.string().trim().max(160).optional().nullable(),
  startsAt: optionalDateTimeSchema,
  endsAt: optionalDateTimeSchema,
  registrationOpensAt: optionalDateTimeSchema,
  registrationClosesAt: optionalDateTimeSchema,
  maxParticipants: z.number().int().positive().optional().nullable(),
  teamSizeMin: z.number().int().positive().optional().nullable(),
  teamSizeMax: z.number().int().positive().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable()
});

export const createEventGroupSchema = eventGroupPayloadSchema;

export const updateEventGroupSchema = eventGroupPayloadSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided for update"
  }
);

export const createEventSchema = eventPayloadSchema;

export const updateEventSchema = eventPayloadSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided for update"
  }
);

export const listEventsQuerySchema = z.object({
  groupId: z.string().trim().min(1).optional(),
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

export const joinTeamSchema = z.object({
  teamCode: z.string().trim().min(1, "Team Code is required")
});

export const removeTeamMemberSchema = z.object({
  eventId: z.string().trim().min(1),
  userId: z.string().trim().min(1)
});

