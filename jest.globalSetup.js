import dotenv from 'dotenv';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { sql } from 'drizzle-orm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function globalSetup() {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_PATH = './test.db';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-min-32-characters';
  process.env.JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';
  process.env.PORT = process.env.PORT || '3000';

  const testClient = createClient({
    url: `file:${process.env.DATABASE_PATH}`,
  });

  const testDb = drizzle(testClient);

  await testDb.run(sql`DROP TABLE IF EXISTS users`);

  await testDb.run(sql`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('employee', 'admin')),
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  testClient.close();

  console.log('✓ Test database initialized');
}
