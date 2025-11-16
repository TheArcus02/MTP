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
import { authedMiddleware } from '../auth/auth.middleware';

const router = Router();

router.post(
  '/',
  authedMiddleware,
  validate(createLeaveRequestSchema),
  asyncMiddleware(createLeaveRequest)
);

router.get('/', authedMiddleware, asyncMiddleware(getUserLeaveRequests));

router.get(
  '/:id',
  authedMiddleware,
  validate(leaveRequestIdSchema, 'params'),
  asyncMiddleware(getLeaveRequestById)
);

router.put(
  '/:id',
  authedMiddleware,
  validate(leaveRequestIdSchema, 'params'),
  validate(updateLeaveRequestSchema),
  asyncMiddleware(updateLeaveRequest)
);

router.delete(
  '/:id',
  authedMiddleware,
  validate(leaveRequestIdSchema, 'params'),
  asyncMiddleware(deleteLeaveRequest)
);

export default router;
