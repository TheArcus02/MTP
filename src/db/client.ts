import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { env } from '../config/env.js';

export const client = createClient({
  url: `file:${env.DATABASE_PATH}`,
});

export const db = drizzle(client);
