import { eq } from 'drizzle-orm';
import { users } from '../../db/schema';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserResponse,
} from './auth.types';
import { comparePassword, generateToken, hashPassword } from './auth.utils';
import { db } from '../../db/client';
import {
  ConflictError,
  UnauthorizedError,
} from '../../shared/errors/app-error';

class AuthService {
  async registerUser(data: RegisterRequest): Promise<UserResponse> {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictError('Email already exists');
    }

    const passwordHash = await hashPassword(data.password);

    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        role: data.role,
      })
      .returning();

    return {
      userId: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };
  }

  async loginUser(data: LoginRequest): Promise<LoginResponse> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await comparePassword(
      data.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
    });

    return {
      token,
      user: {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }
}

export const authService = new AuthService();
