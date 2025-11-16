import { eq, and } from 'drizzle-orm';
import { db } from '../../db/client';
import { leaveRequests } from '../../db/schema';
import {
  ConflictError,
  NotFoundError,
} from '../../shared/errors/app-error';
import type {
  CreateLeaveRequestInput,
  UpdateLeaveRequestInput,
  LeaveRequestResponse,
  ApproveLeaveRequestInput,
  RejectLeaveRequestInput,
} from './leave-request.types';

class LeaveRequestService {
  async createLeaveRequest(
    userId: number,
    data: CreateLeaveRequestInput
  ): Promise<LeaveRequestResponse> {
    const existingPending = await db
      .select()
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.userId, userId),
          eq(leaveRequests.status, 'pending')
        )
      )
      .limit(1);

    if (existingPending.length > 0) {
      throw new ConflictError(
        'You already have a pending leave request. Please wait for it to be processed or delete it before creating a new one.'
      );
    }

    const [newRequest] = await db
      .insert(leaveRequests)
      .values({
        userId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason,
        status: 'pending',
      })
      .returning();

    return this.mapToResponse(newRequest);
  }

  async getUserLeaveRequests(userId: number): Promise<LeaveRequestResponse[]> {
    const requests = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.userId, userId))
      .orderBy(leaveRequests.createdAt);

    return requests.map((req) => this.mapToResponse(req));
  }

  async getLeaveRequestById(
    userId: number,
    requestId: number
  ): Promise<LeaveRequestResponse> {
    const [request] = await db
      .select()
      .from(leaveRequests)
      .where(
        and(eq(leaveRequests.id, requestId), eq(leaveRequests.userId, userId))
      )
      .limit(1);

    if (!request) {
      throw new NotFoundError('Leave request not found');
    }

    return this.mapToResponse(request);
  }

  async updateLeaveRequest(
    userId: number,
    requestId: number,
    data: UpdateLeaveRequestInput
  ): Promise<LeaveRequestResponse> {
    const [existingRequest] = await db
      .select()
      .from(leaveRequests)
      .where(
        and(eq(leaveRequests.id, requestId), eq(leaveRequests.userId, userId))
      )
      .limit(1);

    if (!existingRequest) {
      throw new NotFoundError('Leave request not found');
    }

    if (existingRequest.status !== 'pending') {
      throw new ConflictError(
        'Only pending leave requests can be updated'
      );
    }

    const [updatedRequest] = await db
      .update(leaveRequests)
      .set({
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, requestId))
      .returning();

    return this.mapToResponse(updatedRequest);
  }

  async deleteLeaveRequest(
    userId: number,
    requestId: number
  ): Promise<void> {
    const [existingRequest] = await db
      .select()
      .from(leaveRequests)
      .where(
        and(eq(leaveRequests.id, requestId), eq(leaveRequests.userId, userId))
      )
      .limit(1);

    if (!existingRequest) {
      throw new NotFoundError('Leave request not found');
    }

    if (existingRequest.status !== 'pending') {
      throw new ConflictError(
        'Only pending leave requests can be deleted'
      );
    }

    await db.delete(leaveRequests).where(eq(leaveRequests.id, requestId));
  }

  async getAllLeaveRequests(): Promise<LeaveRequestResponse[]> {
    const requests = await db
      .select()
      .from(leaveRequests)
      .orderBy(leaveRequests.createdAt);

    return requests.map((req) => this.mapToResponse(req));
  }

  async approveLeaveRequest(
    requestId: number,
    data: ApproveLeaveRequestInput
  ): Promise<LeaveRequestResponse> {
    const [existingRequest] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, requestId))
      .limit(1);

    if (!existingRequest) {
      throw new NotFoundError('Leave request not found');
    }

    if (existingRequest.status !== 'pending') {
      throw new ConflictError(
        'Only pending leave requests can be approved'
      );
    }

    const [approvedRequest] = await db
      .update(leaveRequests)
      .set({
        status: 'approved',
        adminComment: data.adminComment || null,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, requestId))
      .returning();

    return this.mapToResponse(approvedRequest);
  }

  async rejectLeaveRequest(
    requestId: number,
    data: RejectLeaveRequestInput
  ): Promise<LeaveRequestResponse> {
    const [existingRequest] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, requestId))
      .limit(1);

    if (!existingRequest) {
      throw new NotFoundError('Leave request not found');
    }

    if (existingRequest.status !== 'pending') {
      throw new ConflictError(
        'Only pending leave requests can be rejected'
      );
    }

    const [rejectedRequest] = await db
      .update(leaveRequests)
      .set({
        status: 'rejected',
        adminComment: data.adminComment,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, requestId))
      .returning();

    return this.mapToResponse(rejectedRequest);
  }

  private mapToResponse(request: typeof leaveRequests.$inferSelect): LeaveRequestResponse {
    return {
      id: request.id,
      userId: request.userId,
      startDate: request.startDate,
      endDate: request.endDate,
      reason: request.reason,
      status: request.status as 'pending' | 'approved' | 'rejected',
      adminComment: request.adminComment,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }
}

export const leaveRequestService = new LeaveRequestService();
