import { db } from '../../../db/client';
import { users } from '../../../db/schema';
import {
  ConflictError,
  UnauthorizedError,
} from '../../../shared/errors/app-error';
import { authService } from '../auth.service';

describe('Auth Service', () => {
  beforeEach(async () => {
    await db.delete(users);
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'employee' as const,
      };

      const result = await authService.registerUser(userData);

      expect(result).toHaveProperty('userId');
      expect(result.email).toBe(userData.email);
      expect(result.fullName).toBe(userData.fullName);
      expect(result.role).toBe(userData.role);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictError for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'employee' as const,
      };

      await authService.registerUser(userData);

      await expect(authService.registerUser(userData)).rejects.toThrow(ConflictError);
    });

    it('should hash the password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'employee' as const,
      };

      await authService.registerUser(userData);

      const [user] = await db.select().from(users).limit(1);
      expect(user.passwordHash).not.toBe(userData.password);
      expect(user.passwordHash).toHaveLength(60);
    });
  });

  describe('loginUser', () => {
    beforeEach(async () => {
      await authService.registerUser({
        email: 'testuser@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'employee',
      });
    });

    it('should login successfully with correct credentials', async () => {
      const result = await authService.loginUser({
        email: 'testuser@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('testuser@example.com');
      expect(result.token).toBeTruthy();
    });

    it('should throw UnauthorizedError for non-existent email', async () => {
      await expect(
        authService.loginUser({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for incorrect password', async () => {
      await expect(
        authService.loginUser({
          email: 'testuser@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
