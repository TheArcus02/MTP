import type { Response } from 'express';

export const successResponse = <T>(
  res: Response,
  data: T,
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

export const errorResponse = (
  res: Response,
  message: string,
  code: string,
  statusCode = 500,
  details?: unknown
) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      ...(details !== undefined && { details }),
    },
  });
};
