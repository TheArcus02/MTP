import { Router } from 'express';
import {
  getAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
} from './leave-request.controller';
import {
  leaveRequestIdSchema,
  approveLeaveRequestSchema,
  rejectLeaveRequestSchema,
} from './leave-request.validators';
import { validate } from '../../shared/middleware/validationMiddleware';
import { asyncMiddleware } from '../../shared/middleware/async-middleware';
import { authedMiddleware } from '../auth/auth.middleware';
import { requireAdmin } from './leave-request.middleware';

const router = Router();

router.get(
  '/leave-requests',
  authedMiddleware,
  requireAdmin,
  asyncMiddleware(getAllLeaveRequests)
);

router.patch(
  '/leave-requests/:id/approve',
  authedMiddleware,
  requireAdmin,
  validate(leaveRequestIdSchema, 'params'),
  validate(approveLeaveRequestSchema),
  asyncMiddleware(approveLeaveRequest)
);

router.patch(
  '/leave-requests/:id/reject',
  authedMiddleware,
  requireAdmin,
  validate(leaveRequestIdSchema, 'params'),
  validate(rejectLeaveRequestSchema),
  asyncMiddleware(rejectLeaveRequest)
);

export default router;
