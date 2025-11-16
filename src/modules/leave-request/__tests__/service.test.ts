import { db } from '../../../db/client';
import { users, leaveRequests } from '../../../db/schema';
import { leaveRequestService } from '../leave-request.service';
import { ConflictError, NotFoundError } from '../../../shared/errors/app-error';

describe('LeaveRequestService', () => {
  let testUserId: number;
  let anotherUserId: number;

  beforeEach(async () => {
    await db.delete(leaveRequests);
    await db.delete(users);

    const [user1] = await db
      .insert(users)
      .values({
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        fullName: 'Test User',
        role: 'employee',
      })
      .returning();
    testUserId = user1.id;

    const [user2] = await db
      .insert(users)
      .values({
        email: 'another@example.com',
        passwordHash: 'hashedpassword',
        fullName: 'Another User',
        role: 'employee',
      })
      .returning();
    anotherUserId = user2.id;
  });

  describe('createLeaveRequest', () => {
    it('should create a new leave request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const result = await leaveRequestService.createLeaveRequest(testUserId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: 'Vacation for family trip',
      });

      expect(result).toHaveProperty('id');
      expect(result.userId).toBe(testUserId);
      expect(result.status).toBe('pending');
      expect(result.reason).toBe('Vacation for family trip');
    });

    it('should throw ConflictError when user already has a pending request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      await leaveRequestService.createLeaveRequest(testUserId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: 'First vacation request',
      });

      const startDate2 = new Date();
      startDate2.setDate(startDate2.getDate() + 21);
      const endDate2 = new Date();
      endDate2.setDate(endDate2.getDate() + 28);

      await expect(
        leaveRequestService.createLeaveRequest(testUserId, {
          startDate: startDate2.toISOString(),
          endDate: endDate2.toISOString(),
          reason: 'Second vacation request',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('getUserLeaveRequests', () => {
    it('should return all leave requests for a user', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      await leaveRequestService.createLeaveRequest(testUserId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: 'Vacation request',
      });

      const results = await leaveRequestService.getUserLeaveRequests(
        testUserId
      );

      expect(results).toHaveLength(1);
      expect(results[0].userId).toBe(testUserId);
    });

    it('should return empty array when user has no requests', async () => {
      const results = await leaveRequestService.getUserLeaveRequests(
        testUserId
      );

      expect(results).toHaveLength(0);
    });

    it('should only return requests for the specified user', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      await leaveRequestService.createLeaveRequest(testUserId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: 'User 1 vacation',
      });

      await leaveRequestService.createLeaveRequest(anotherUserId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: 'User 2 vacation',
      });

      const results = await leaveRequestService.getUserLeaveRequests(
        testUserId
      );

      expect(results).toHaveLength(1);
      expect(results[0].userId).toBe(testUserId);
    });
  });

  describe('getLeaveRequestById', () => {
    it('should return a specific leave request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const created = await leaveRequestService.createLeaveRequest(testUserId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: 'Specific vacation',
      });

      const result = await leaveRequestService.getLeaveRequestById(
        testUserId,
        created.id
      );

      expect(result.id).toBe(created.id);
      expect(result.userId).toBe(testUserId);
      expect(result.reason).toBe('Specific vacation');
    });

    it('should throw NotFoundError when request does not exist', async () => {
      await expect(
        leaveRequestService.getLeaveRequestById(testUserId, 99999)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when requesting another user\'s request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const created = await leaveRequestService.createLeaveRequest(testUserId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: 'User 1 vacation',
      });

      await expect(
        leaveRequestService.getLeaveRequestById(anotherUserId, created.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateLeaveRequest', () => {
    it('should update a pending leave request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const created = await leaveRequestService.createLeaveRequest(testUserId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: 'Original reason',
      });

      const newStartDate = new Date();
      newStartDate.setDate(newStartDate.getDate() + 10);
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + 17);

      const updated = await leaveRequestService.updateLeaveRequest(
        testUserId,
        created.id,
        {
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString(),
          reason: 'Updated reason with more details',
        }
      );

      expect(updated.id).toBe(created.id);
      expect(updated.reason).toBe('Updated reason with more details');
    });

    it('should throw NotFoundError when request does not exist', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      await expect(
        leaveRequestService.updateLeaveRequest(testUserId, 99999, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Non-existent request',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when updating another user\'s request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const created = await leaveRequestService.createLeaveRequest(testUserId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: 'User 1 vacation',
      });

      await expect(
        leaveRequestService.updateLeaveRequest(anotherUserId, created.id, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Trying to update',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when updating non-pending request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const [approvedRequest] = await db
        .insert(leaveRequests)
        .values({
          userId: testUserId,
          startDate,
          endDate,
          reason: 'Approved vacation',
          status: 'approved',
        })
        .returning();

      await expect(
        leaveRequestService.updateLeaveRequest(testUserId, approvedRequest.id, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Trying to update approved',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('deleteLeaveRequest', () => {
    it('should delete a pending leave request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const created = await leaveRequestService.createLeaveRequest(testUserId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: 'To be deleted',
      });

      await leaveRequestService.deleteLeaveRequest(testUserId, created.id);

      await expect(
        leaveRequestService.getLeaveRequestById(testUserId, created.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when request does not exist', async () => {
      await expect(
        leaveRequestService.deleteLeaveRequest(testUserId, 99999)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when deleting another user\'s request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const created = await leaveRequestService.createLeaveRequest(testUserId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: 'User 1 vacation',
      });

      await expect(
        leaveRequestService.deleteLeaveRequest(anotherUserId, created.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when deleting non-pending request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const [approvedRequest] = await db
        .insert(leaveRequests)
        .values({
          userId: testUserId,
          startDate,
          endDate,
          reason: 'Approved vacation',
          status: 'approved',
        })
        .returning();

      await expect(
        leaveRequestService.deleteLeaveRequest(testUserId, approvedRequest.id)
      ).rejects.toThrow(ConflictError);
    });
  });
});
