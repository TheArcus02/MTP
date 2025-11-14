import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import type { JwtPayload } from '../../shared/types/express';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRATION,
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};
