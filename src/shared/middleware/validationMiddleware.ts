import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';
import { tryCatch } from '../utils/try-catch';

type ValidateSource = 'body' | 'params' | 'query';

export const validate = (schema: ZodType, source: ValidateSource = 'body') => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const dataToValidate = req[source];
    const { error } = await tryCatch(schema.parseAsync(dataToValidate));

    if (error) {
      return next(error);
    }

    next();
  };
};
