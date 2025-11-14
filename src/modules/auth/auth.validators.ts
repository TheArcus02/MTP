import { z } from 'zod/v4';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['employee', 'admin'], {
    message: 'Role must be either employee or admin',
  }),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});
