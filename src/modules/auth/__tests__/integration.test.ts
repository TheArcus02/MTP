import request from 'supertest';
import app from '../../../app';
import { users } from '../../../db/schema';
import { db } from '../../../db/client';

describe('Auth Integration Tests', () => {
  beforeEach(async () => {
    await db.delete(users);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new employee user', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'employee@example.com',
        password: 'password123',
        fullName: 'John Doe',
        role: 'employee',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.data).toHaveProperty(
        'email',
        'employee@example.com'
      );
      expect(response.body.data).toHaveProperty('fullName', 'John Doe');
      expect(response.body.data).toHaveProperty('role', 'employee');
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('should register a new admin user', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'admin@example.com',
        password: 'adminpass123',
        fullName: 'Admin User',
        role: 'admin',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('role', 'admin');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'invalid-email',
        password: 'password123',
        fullName: 'John Doe',
        role: 'employee',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with short password', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'user@example.com',
        password: 'short',
        fullName: 'John Doe',
        role: 'employee',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with duplicate email', async () => {
      await request(app).post('/api/auth/register').send({
        email: 'duplicate@example.com',
        password: 'password123',
        fullName: 'First User',
        role: 'employee',
      });

      const response = await request(app).post('/api/auth/register').send({
        email: 'duplicate@example.com',
        password: 'password456',
        fullName: 'Second User',
        role: 'employee',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid role', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'user@example.com',
        password: 'password123',
        fullName: 'John Doe',
        role: 'superadmin',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with short full name', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'user@example.com',
        password: 'password123',
        fullName: 'J',
        role: 'employee',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        email: 'testuser@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'employee',
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'testuser@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty(
        'email',
        'testuser@example.com'
      );
      expect(response.body.data.user).toHaveProperty('role', 'employee');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'wrong@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'testuser@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing email', async () => {
      const response = await request(app).post('/api/auth/login').send({
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'testuser@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
