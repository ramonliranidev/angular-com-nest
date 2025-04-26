import * as dotenv from 'dotenv';
import * as path from 'path';
import { z } from 'zod';

dotenv.config({
  path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`),
});

const envSchema = z.object({
  PORT: z.coerce.number().default(3101),
  NODE_ENV: z.enum(['dev', 'test', 'prod']).default('dev'),
  RUN_SEED_PERMISSIONS: z.coerce.boolean().default(false),
  DATABASE_URL: z.string(),
  PUBLIC_KEY: z.string(),
  PRIVATE_KEY: z.string(),
  SENDGRID_API_KEY: z.string(),
  FRONTEND_URL: z.string(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Invalid environment variables.');
}

export const env = parsedEnv.data;
