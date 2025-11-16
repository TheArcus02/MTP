import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ForbiddenError } from '../../shared/errors/app-error';
import { db } from '../../db/client';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ForbiddenError('Access denied');
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0 || user[0].role !== 'admin') {
      throw new ForbiddenError('Access denied. Admin role required.');
    }

    next();
  } catch (error) {
    next(error);
  }
};
