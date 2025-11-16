import type { Request, Response } from 'express';
import { holidaysService } from './holidays.service';
import { successResponse } from '../../shared/utils/response';

export const getPublicHolidays = async (
  req: Request,
  res: Response
): Promise<void> => {
  const year = Number(req.params.year);
  const countryCode = req.params.countryCode.toUpperCase();

  const holidays = await holidaysService.getPublicHolidays(year, countryCode);
  successResponse(res, holidays);
};
