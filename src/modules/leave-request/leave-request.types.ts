export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';

export interface CreateLeaveRequestInput {
  startDate: string;
  endDate: string;
  reason: string;
}

export interface UpdateLeaveRequestInput {
  startDate: string;
  endDate: string;
  reason: string;
}

export interface LeaveRequestResponse {
  id: number;
  userId: number;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveRequestStatus;
  adminComment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApproveLeaveRequestInput {
  adminComment?: string;
}

export interface RejectLeaveRequestInput {
  adminComment: string;
}
