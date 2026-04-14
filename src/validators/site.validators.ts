import { z } from "zod";

const optionalUrlSchema = z.string().trim().url().max(1000).optional();

export const updateSiteContentSchema = z
  .object({
    collegeName: z.string().trim().min(2).max(160).optional(),
    campusName: z.string().trim().min(2).max(160).optional(),
    festivalName: z.string().trim().min(2).max(160).optional(),
    tagline: z.string().trim().max(220).optional(),
    heroTitle: z.string().trim().min(3).max(220).optional(),
    heroSubtitle: z.string().trim().max(500).optional(),
    heroImageUrl: optionalUrlSchema,
    aboutTitle: z.string().trim().max(160).optional(),
    aboutDescription: z.string().trim().max(2500).optional(),
    contactEmail: z.string().trim().email().optional(),
    contactPhone: z.string().trim().max(30).optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update"
  });
