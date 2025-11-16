import request from 'supertest';
import app from '../../../app';
import { users, leaveRequests } from '../../../db/schema';
import { db } from '../../../db/client';

describe('Leave Request Integration Tests', () => {
  let employeeToken: string;
  let employeeId: number;
  let anotherEmployeeToken: string;
  let anotherEmployeeId: number;
  let adminToken: string;
  let adminId: number;

  beforeEach(async () => {
    await db.delete(leaveRequests);
    await db.delete(users);

    const employeeRes = await request(app).post('/api/auth/register').send({
      email: 'employee@example.com',
      password: 'password123',
      fullName: 'John Doe',
      role: 'employee',
    });
    employeeId = employeeRes.body.data.userId;

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'employee@example.com',
      password: 'password123',
    });
    employeeToken = loginRes.body.data.token;

    const anotherEmployeeRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'employee2@example.com',
        password: 'password123',
        fullName: 'Jane Smith',
        role: 'employee',
      });
    anotherEmployeeId = anotherEmployeeRes.body.data.userId;

    const anotherLoginRes = await request(app).post('/api/auth/login').send({
      email: 'employee2@example.com',
      password: 'password123',
    });
    anotherEmployeeToken = anotherLoginRes.body.data.token;

    const adminRes = await request(app).post('/api/auth/register').send({
      email: 'admin@example.com',
      password: 'password123',
      fullName: 'Admin User',
      role: 'admin',
    });
    adminId = adminRes.body.data.userId;

    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'password123',
    });
    adminToken = adminLoginRes.body.data.token;
  });

  describe('POST /api/leave-requests', () => {
    it('should create a leave request with valid data', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const response = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Family vacation planned for next month',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('userId', employeeId);
      expect(response.body.data).toHaveProperty('status', 'pending');
      expect(response.body.data).toHaveProperty(
        'reason',
        'Family vacation planned for next month'
      );
      expect(response.body.data).toHaveProperty('startDate');
      expect(response.body.data).toHaveProperty('endDate');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    it('should fail without authentication', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const response = await request(app)
        .post('/api/leave-requests')
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Family vacation planned for next month',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with start date in the past', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const response = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Past vacation attempt',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with end date before start date', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 14);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const response = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Invalid date range',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with short reason', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const response = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Short',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail when user already has a pending request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'First request for vacation',
        });

      const startDate2 = new Date();
      startDate2.setDate(startDate2.getDate() + 21);
      const endDate2 = new Date();
      endDate2.setDate(endDate2.getDate() + 28);

      const response = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate2.toISOString(),
          endDate: endDate2.toISOString(),
          reason: 'Second request while first is pending',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/leave-requests', () => {
    it('should get all leave requests for authenticated user', async () => {
      const startDate1 = new Date();
      startDate1.setDate(startDate1.getDate() + 7);
      const endDate1 = new Date();
      endDate1.setDate(endDate1.getDate() + 14);

      await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate1.toISOString(),
          endDate: endDate1.toISOString(),
          reason: 'First vacation request',
        });

      const response = await request(app)
        .get('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('userId', employeeId);
    });

    it('should only return requests for the authenticated user', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Employee 1 vacation',
        });

      await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${anotherEmployeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Employee 2 vacation',
        });

      const response = await request(app)
        .get('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('userId', employeeId);
    });

    it('should return empty array when user has no requests', async () => {
      const response = await request(app)
        .get('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/api/leave-requests');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/leave-requests/:id', () => {
    it('should get a specific leave request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const createRes = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Vacation request details',
        });

      const requestId = createRes.body.data.id;

      const response = await request(app)
        .get(`/api/leave-requests/${requestId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', requestId);
      expect(response.body.data).toHaveProperty('userId', employeeId);
      expect(response.body.data).toHaveProperty(
        'reason',
        'Vacation request details'
      );
    });

    it('should fail when requesting another user\'s leave request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const createRes = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Employee 1 vacation',
        });

      const requestId = createRes.body.data.id;

      const response = await request(app)
        .get(`/api/leave-requests/${requestId}`)
        .set('Authorization', `Bearer ${anotherEmployeeToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent request id', async () => {
      const response = await request(app)
        .get('/api/leave-requests/99999')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/api/leave-requests/1');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/leave-requests/:id', () => {
    it('should update a pending leave request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const createRes = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Original vacation reason',
        });

      const requestId = createRes.body.data.id;

      const newStartDate = new Date();
      newStartDate.setDate(newStartDate.getDate() + 10);
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + 17);

      const response = await request(app)
        .put(`/api/leave-requests/${requestId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString(),
          reason: 'Updated vacation reason with more details',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', requestId);
      expect(response.body.data).toHaveProperty(
        'reason',
        'Updated vacation reason with more details'
      );
    });

    it('should fail when updating another user\'s request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const createRes = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Employee 1 vacation',
        });

      const requestId = createRes.body.data.id;

      const response = await request(app)
        .put(`/api/leave-requests/${requestId}`)
        .set('Authorization', `Bearer ${anotherEmployeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Trying to update someone else request',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid data', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const createRes = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Original vacation reason',
        });

      const requestId = createRes.body.data.id;

      const response = await request(app)
        .put(`/api/leave-requests/${requestId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Short',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/api/leave-requests/1')
        .send({
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          reason: 'Trying without auth',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/leave-requests/:id', () => {
    it('should delete a pending leave request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const createRes = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Vacation to be deleted',
        });

      const requestId = createRes.body.data.id;

      const response = await request(app)
        .delete(`/api/leave-requests/${requestId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const getResponse = await request(app)
        .get(`/api/leave-requests/${requestId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should fail when deleting another user\'s request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const createRes = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Employee 1 vacation',
        });

      const requestId = createRes.body.data.id;

      const response = await request(app)
        .delete(`/api/leave-requests/${requestId}`)
        .set('Authorization', `Bearer ${anotherEmployeeToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent request id', async () => {
      const response = await request(app)
        .delete('/api/leave-requests/99999')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app).delete('/api/leave-requests/1');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/leave-requests', () => {
    it('should get all leave requests as admin', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Employee 1 vacation request',
        });

      await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${anotherEmployeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Employee 2 vacation request',
        });

      const response = await request(app)
        .get('/api/admin/leave-requests')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should fail when accessed by employee', async () => {
      const response = await request(app)
        .get('/api/admin/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/api/admin/leave-requests');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/admin/leave-requests/:id/approve', () => {
    it('should approve a pending leave request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const createRes = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Vacation request to be approved',
        });

      const requestId = createRes.body.data.id;

      const response = await request(app)
        .patch(`/api/admin/leave-requests/${requestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminComment: 'Approved - enjoy your vacation!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', requestId);
      expect(response.body.data).toHaveProperty('status', 'approved');
      expect(response.body.data).toHaveProperty(
        'adminComment',
        'Approved - enjoy your vacation!'
      );
    });

    it('should approve without admin comment', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const createRes = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Vacation request to be approved',
        });

      const requestId = createRes.body.data.id;

      const response = await request(app)
        .patch(`/api/admin/leave-requests/${requestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status', 'approved');
    });

    it('should fail when employee tries to approve', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const createRes = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Vacation request',
        });

      const requestId = createRes.body.data.id;

      const response = await request(app)
        .patch(`/api/admin/leave-requests/${requestId}/approve`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          adminComment: 'Trying to self-approve',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent request id', async () => {
      const response = await request(app)
        .patch('/api/admin/leave-requests/99999/approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminComment: 'Approving non-existent request',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail when approving already approved request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const createRes = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Vacation request',
        });

      const requestId = createRes.body.data.id;

      await request(app)
        .patch(`/api/admin/leave-requests/${requestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminComment: 'First approval',
        });

      const response = await request(app)
        .patch(`/api/admin/leave-requests/${requestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminComment: 'Trying to approve again',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .patch('/api/admin/leave-requests/1/approve')
        .send({
          adminComment: 'No auth',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/admin/leave-requests/:id/reject', () => {
    it('should reject a pending leave request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const createRes = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Vacation request to be rejected',
        });

      const requestId = createRes.body.data.id;

      const response = await request(app)
        .patch(`/api/admin/leave-requests/${requestId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminComment: 'Rejected - insufficient staffing during this period',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', requestId);
      expect(response.body.data).toHaveProperty('status', 'rejected');
      expect(response.body.data).toHaveProperty(
        'adminComment',
        'Rejected - insufficient staffing during this period'
      );
    });

    it('should fail when rejecting without admin comment', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const createRes = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Vacation request',
        });

      const requestId = createRes.body.data.id;

      const response = await request(app)
        .patch(`/api/admin/leave-requests/${requestId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail when employee tries to reject', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const createRes = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Vacation request',
        });

      const requestId = createRes.body.data.id;

      const response = await request(app)
        .patch(`/api/admin/leave-requests/${requestId}/reject`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          adminComment: 'Trying to self-reject',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent request id', async () => {
      const response = await request(app)
        .patch('/api/admin/leave-requests/99999/reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminComment: 'Rejecting non-existent request',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail when rejecting already rejected request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);

      const createRes = await request(app)
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Vacation request',
        });

      const requestId = createRes.body.data.id;

      await request(app)
        .patch(`/api/admin/leave-requests/${requestId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminComment: 'First rejection',
        });

      const response = await request(app)
        .patch(`/api/admin/leave-requests/${requestId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminComment: 'Trying to reject again',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .patch('/api/admin/leave-requests/1/reject')
        .send({
          adminComment: 'No auth',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
