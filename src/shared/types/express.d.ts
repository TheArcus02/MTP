import { type users } from '../../db/schema';

export interface JwtPayload {
  userId: number;
  role: typeof users.$inferSelect.role;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
