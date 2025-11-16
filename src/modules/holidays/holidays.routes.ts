import { Router } from 'express';
import { getPublicHolidays } from './holidays.controller';
import { holidaysParamsSchema } from './holidays.validators';
import { validate } from '../../shared/middleware/validationMiddleware';
import { asyncMiddleware } from '../../shared/middleware/async-middleware';
import { authedMiddleware } from '../auth/auth.middleware';

const router = Router();

router.get(
  '/:year/:countryCode',
  authedMiddleware,
  validate(holidaysParamsSchema, 'params'),
  asyncMiddleware(getPublicHolidays)
);

export default router;
