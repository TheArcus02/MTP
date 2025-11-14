import type { users } from '../../db/schema';

export type UserRole = typeof users.$inferSelect.role;

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  userId: number;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}
