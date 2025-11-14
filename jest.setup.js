import dotenv from 'dotenv';

dotenv.config();

process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = './test.db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-min-32-characters';
process.env.JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';
process.env.PORT = process.env.PORT || '3000';
