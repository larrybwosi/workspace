import { z } from 'zod';

/**
 * Common schema for environment variables used across the monorepo.
 */
export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3001'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_SANITY_DATASET: z.string().default('production'),
  NEXT_PUBLIC_AGORA_APP_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_VAPID_KEY: z.string().optional(),
});

/**
 * Schema for server-side only environment variables.
 */
export const serverEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  ABLY_API_KEY: z.string().optional(),
  STORAGE_PROVIDER: z.enum(['sanity', 'minio']).default('sanity'),
  SANITY_WRITE_TOKEN: z.string().optional(),
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_USE_SSL: z.preprocess(v => v === 'true' || v === true, z.boolean()).default(false),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  MINIO_BUCKET: z.string().default('uploads'),
  AGORA_APP_CERTIFICATE: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  DODO_PAYMENTS_WEBHOOK_SECRET: z.string().optional(),
  EXPO_ACCESS_TOKEN: z.string().optional(),
  DESKTOP_NOTIFICATION_ENDPOINT: z.string().url().default('http://localhost:3005'),
  BOT_TOKEN_SECRET: z.string().default('default_secret'),
  WEBHOOK_SECRET: z.string().default('default_secret'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3001'),
});

/**
 * Validates and returns the environment variables.
 * In the browser, it only validates public variables.
 */
export function validateEnv(envInput?: Record<string, any>) {
  const isServer = typeof window === 'undefined';

  // Detect environment source
  let sourceEnv: Record<string, any>;
  if (envInput) {
    sourceEnv = envInput;
  } else if (typeof process !== 'undefined' && process.env && Object.keys(process.env).length > 0) {
    sourceEnv = process.env;
  } else if (
    typeof (globalThis as any).import !== 'undefined' &&
    (globalThis as any).import.meta &&
    (globalThis as any).import.meta.env
  ) {
    sourceEnv = (globalThis as any).import.meta.env;
  } else {
    sourceEnv = {};
  }

  const schema = isServer ? serverEnvSchema : baseEnvSchema;
  const result = schema.safeParse(sourceEnv);

  if (!result.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));

    if (sourceEnv.NODE_ENV === 'production' && isServer) {
      throw new Error('Invalid environment variables in production');
    }

    // Return the data even if partial, but ensure it's not undefined
    return (result as any).data || schema.parse({});
  }

  return result.data;
}
