import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(3000),
    DATABASE_PATH: z.string().default('./mtp.db'),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRATION: z.string().default('24h'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
