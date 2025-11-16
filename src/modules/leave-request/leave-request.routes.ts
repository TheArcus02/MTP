import { Router } from 'express';
import {
  createLeaveRequest,
  getUserLeaveRequests,
  getLeaveRequestById,
  updateLeaveRequest,
  deleteLeaveRequest,
} from './leave-request.controller';
import {
  createLeaveRequestSchema,
  updateLeaveRequestSchema,
  leaveRequestIdSchema,
} from './leave-request.validators';
import { validate } from '../../shared/middleware/validationMiddleware';
import { asyncMiddleware } from '../../shared/middleware/async-middleware';
import { authenticate } from '../auth/auth.middleware';

const router = Router();

router.post(
  '/',
  authenticate,
  validate(createLeaveRequestSchema),
  asyncMiddleware(createLeaveRequest)
);

router.get('/', authenticate, asyncMiddleware(getUserLeaveRequests));

router.get(
  '/:id',
  authenticate,
  validate(leaveRequestIdSchema, 'params'),
  asyncMiddleware(getLeaveRequestById)
);

router.put(
  '/:id',
  authenticate,
  validate(leaveRequestIdSchema, 'params'),
  validate(updateLeaveRequestSchema),
  asyncMiddleware(updateLeaveRequest)
);

router.delete(
  '/:id',
  authenticate,
  validate(leaveRequestIdSchema, 'params'),
  asyncMiddleware(deleteLeaveRequest)
);

export default router;
