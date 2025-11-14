import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';
import { tryCatch } from '../utils/try-catch';

export const validate = (schema: ZodType) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const { error } = await tryCatch(schema.parseAsync(req.body));

    if (error) {
      return next(error);
    }

    next();
  };
};
