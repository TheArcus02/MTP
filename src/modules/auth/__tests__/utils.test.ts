import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
} from '../auth.utils';

describe('Auth Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'password123';
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash).toHaveLength(60);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'password123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'password123';
      const hash = await hashPassword(password);
      const result = await comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'password123';
      const hash = await hashPassword(password);
      const result = await comparePassword('wrongpassword', hash);

      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = { userId: 1, role: 'employee' as const };
      const token = generateToken(payload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const payload = { userId: 1, role: 'employee' as const };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyToken(invalidToken)).toThrow();
    });
  });
});
