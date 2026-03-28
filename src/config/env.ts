import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("30d"),
  OTP_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  SENDER_EMAIL : z.string()

});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";

