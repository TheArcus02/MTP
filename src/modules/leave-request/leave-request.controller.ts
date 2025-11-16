import type { Request, Response } from 'express';
import { leaveRequestService } from './leave-request.service';
import type {
  CreateLeaveRequestInput,
  UpdateLeaveRequestInput,
  ApproveLeaveRequestInput,
  RejectLeaveRequestInput,
} from './leave-request.types';
import { successResponse } from '../../shared/utils/response';

export const createLeaveRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user!.userId;
  const data = req.body as CreateLeaveRequestInput;
  const leaveRequest = await leaveRequestService.createLeaveRequest(
    userId,
    data
  );
  successResponse(res, leaveRequest, 201);
};

export const getUserLeaveRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user!.userId;
  const leaveRequests = await leaveRequestService.getUserLeaveRequests(userId);
  successResponse(res, leaveRequests);
};

export const getLeaveRequestById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user!.userId;
  const requestId = Number(req.params.id);
  const leaveRequest = await leaveRequestService.getLeaveRequestById(
    userId,
    requestId
  );
  successResponse(res, leaveRequest);
};

export const updateLeaveRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user!.userId;
  const requestId = Number(req.params.id);
  const data = req.body as UpdateLeaveRequestInput;
  const leaveRequest = await leaveRequestService.updateLeaveRequest(
    userId,
    requestId,
    data
  );
  successResponse(res, leaveRequest);
};

export const deleteLeaveRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user!.userId;
  const requestId = Number(req.params.id);
  await leaveRequestService.deleteLeaveRequest(userId, requestId);
  successResponse(res, { message: 'Leave request deleted successfully' });
};

export const getAllLeaveRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  const leaveRequests = await leaveRequestService.getAllLeaveRequests();
  successResponse(res, leaveRequests);
};

export const approveLeaveRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const requestId = Number(req.params.id);
  const data = req.body as ApproveLeaveRequestInput;
  const leaveRequest = await leaveRequestService.approveLeaveRequest(
    requestId,
    data
  );
  successResponse(res, leaveRequest);
};

export const rejectLeaveRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const requestId = Number(req.params.id);
  const data = req.body as RejectLeaveRequestInput;
  const leaveRequest = await leaveRequestService.rejectLeaveRequest(
    requestId,
    data
  );
  successResponse(res, leaveRequest);
};
