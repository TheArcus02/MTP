# Leave Request Module Documentation

## Overview

The leave request module handles employee leave/vacation request management with full CRUD operations. Employees can create, view, update, and delete their own leave requests. Administrators can view all leave requests and approve or reject them.

## Responsibilities

### Employee Functions
- Create leave requests with start date, end date, and reason
- View all leave requests for the authenticated user
- View a specific leave request by ID
- Update pending leave requests
- Delete pending leave requests
- Enforce business rule: only one pending request per user at a time

### Admin Functions
- View all leave requests from all users
- Approve pending leave requests (with optional comment)
- Reject pending leave requests (with mandatory comment)
- Status protection: only pending requests can be approved/rejected

## Module Structure

```
leave-request/
├── leave-request.controller.ts    # HTTP request/response handlers (employee & admin)
├── leave-request.service.ts       # Business logic (class-based)
├── leave-request.routes.ts        # Employee route definitions
├── admin.routes.ts                # Admin route definitions
├── leave-request.validators.ts    # Zod validation schemas
├── leave-request.middleware.ts    # Role-based access control (requireAdmin)
├── leave-request.types.ts         # TypeScript interfaces
├── claude.md                      # This documentation file
└── __tests__/
    ├── integration.test.ts        # E2E endpoint tests (employee & admin)
    └── service.test.ts            # Service unit tests
```

## API Endpoints

### POST /api/leave-requests
Create a new leave request (requires authentication)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```typescript
{
  startDate: string;    // ISO 8601 datetime, cannot be in the past
  endDate: string;      // ISO 8601 datetime, must be after startDate
  reason: string;       // Min 10 characters
}
```

**Response (201):**
```typescript
{
  success: true;
  data: {
    id: number;
    userId: number;
    startDate: Date;
    endDate: Date;
    reason: string;
    status: 'pending';
    adminComment: null;
    createdAt: Date;
    updatedAt: Date;
  }
}
```

**Errors:**
- 400: Validation error (past date, invalid range, short reason)
- 401: Not authenticated
- 409: User already has a pending request

### GET /api/leave-requests
Get all leave requests for the authenticated user

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```typescript
{
  success: true;
  data: LeaveRequestResponse[];  // Array of leave requests
}
```

**Errors:**
- 401: Not authenticated

### GET /api/leave-requests/:id
Get a specific leave request by ID

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `id` (number): Leave request ID

**Response (200):**
```typescript
{
  success: true;
  data: {
    id: number;
    userId: number;
    startDate: Date;
    endDate: Date;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    adminComment: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
}
```

**Errors:**
- 401: Not authenticated
- 404: Leave request not found or belongs to another user

### PUT /api/leave-requests/:id
Update a pending leave request

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `id` (number): Leave request ID

**Request Body:**
```typescript
{
  startDate: string;    // ISO 8601 datetime, cannot be in the past
  endDate: string;      // ISO 8601 datetime, must be after startDate
  reason: string;       // Min 10 characters
}
```

**Response (200):**
```typescript
{
  success: true;
  data: LeaveRequestResponse;
}
```

**Errors:**
- 400: Validation error
- 401: Not authenticated
- 404: Leave request not found or belongs to another user
- 409: Only pending requests can be updated

### DELETE /api/leave-requests/:id
Delete a pending leave request

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `id` (number): Leave request ID

**Response (200):**
```typescript
{
  success: true;
  data: {
    message: 'Leave request deleted successfully'
  }
}
```

**Errors:**
- 401: Not authenticated
- 404: Leave request not found or belongs to another user
- 409: Only pending requests can be deleted

## Admin Endpoints

### GET /api/admin/leave-requests
Get all leave requests from all users (admin only)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```typescript
{
  success: true;
  data: LeaveRequestResponse[];  // Array of all leave requests
}
```

**Errors:**
- 401: Not authenticated
- 403: Access denied (not an admin)

### PATCH /api/admin/leave-requests/:id/approve
Approve a pending leave request (admin only)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `id` (number): Leave request ID

**Request Body:**
```typescript
{
  adminComment?: string;  // Optional comment
}
```

**Response (200):**
```typescript
{
  success: true;
  data: {
    id: number;
    userId: number;
    startDate: Date;
    endDate: Date;
    reason: string;
    status: 'approved';
    adminComment: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: Access denied (not an admin)
- 404: Leave request not found
- 409: Only pending requests can be approved

### PATCH /api/admin/leave-requests/:id/reject
Reject a pending leave request (admin only)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `id` (number): Leave request ID

**Request Body:**
```typescript
{
  adminComment: string;  // Required - reason for rejection
}
```

**Response (200):**
```typescript
{
  success: true;
  data: {
    id: number;
    userId: number;
    startDate: Date;
    endDate: Date;
    reason: string;
    status: 'rejected';
    adminComment: string;
    createdAt: Date;
    updatedAt: Date;
  }
}
```

**Errors:**
- 400: Validation error (adminComment required)
- 401: Not authenticated
- 403: Access denied (not an admin)
- 404: Leave request not found
- 409: Only pending requests can be rejected

## Files Detail

### leave-request.service.ts
**Pattern:** Class-based service with singleton export

**Class:** `LeaveRequestService`

**Methods:**
- `createLeaveRequest(userId: number, data: CreateLeaveRequestInput): Promise<LeaveRequestResponse>`
  - Checks for existing pending requests (only one allowed per user)
  - Creates new leave request with 'pending' status
  - Returns created leave request

- `getUserLeaveRequests(userId: number): Promise<LeaveRequestResponse[]>`
  - Retrieves all leave requests for a specific user
  - Orders by creation date
  - Returns array of leave requests

- `getLeaveRequestById(userId: number, requestId: number): Promise<LeaveRequestResponse>`
  - Retrieves a specific leave request
  - Verifies ownership (userId must match)
  - Throws NotFoundError if not found or unauthorized

- `updateLeaveRequest(userId: number, requestId: number, data: UpdateLeaveRequestInput): Promise<LeaveRequestResponse>`
  - Verifies request exists and belongs to user
  - Only allows updates to 'pending' requests
  - Updates startDate, endDate, reason, and updatedAt
  - Returns updated request

- `deleteLeaveRequest(userId: number, requestId: number): Promise<void>`
  - Verifies request exists and belongs to user
  - Only allows deletion of 'pending' requests
  - Permanently deletes the request

- `getAllLeaveRequests(): Promise<LeaveRequestResponse[]>`
  - Retrieves all leave requests from all users (admin only)
  - Orders by creation date
  - Returns array of all leave requests

- `approveLeaveRequest(requestId: number, data: ApproveLeaveRequestInput): Promise<LeaveRequestResponse>`
  - Verifies request exists
  - Only allows approval of 'pending' requests
  - Updates status to 'approved' and sets optional adminComment
  - Returns updated request

- `rejectLeaveRequest(requestId: number, data: RejectLeaveRequestInput): Promise<LeaveRequestResponse>`
  - Verifies request exists
  - Only allows rejection of 'pending' requests
  - Updates status to 'rejected' and sets mandatory adminComment
  - Returns updated request

**Private Methods:**
- `mapToResponse(request): LeaveRequestResponse`
  - Maps database record to response format

**Export:** `export const leaveRequestService = new LeaveRequestService()`

### leave-request.controller.ts
**Employee Functions:**
- `createLeaveRequest(req: Request, res: Response): Promise<void>`
  - Extracts userId from req.user (set by authenticate middleware)
  - Calls `leaveRequestService.createLeaveRequest()`
  - Returns 201 status on success

- `getUserLeaveRequests(req: Request, res: Response): Promise<void>`
  - Extracts userId from req.user
  - Calls `leaveRequestService.getUserLeaveRequests()`
  - Returns 200 status with array

- `getLeaveRequestById(req: Request, res: Response): Promise<void>`
  - Extracts userId from req.user and id from params
  - Calls `leaveRequestService.getLeaveRequestById()`
  - Returns 200 status

- `updateLeaveRequest(req: Request, res: Response): Promise<void>`
  - Extracts userId from req.user and id from params
  - Calls `leaveRequestService.updateLeaveRequest()`
  - Returns 200 status

- `deleteLeaveRequest(req: Request, res: Response): Promise<void>`
  - Extracts userId from req.user and id from params
  - Calls `leaveRequestService.deleteLeaveRequest()`
  - Returns 200 status with success message

**Admin Functions:**
- `getAllLeaveRequests(req: Request, res: Response): Promise<void>`
  - Calls `leaveRequestService.getAllLeaveRequests()`
  - Returns 200 status with array of all requests

- `approveLeaveRequest(req: Request, res: Response): Promise<void>`
  - Extracts requestId from params and data from body
  - Calls `leaveRequestService.approveLeaveRequest()`
  - Returns 200 status with updated request

- `rejectLeaveRequest(req: Request, res: Response): Promise<void>`
  - Extracts requestId from params and data from body
  - Calls `leaveRequestService.rejectLeaveRequest()`
  - Returns 200 status with updated request

### leave-request.routes.ts
Defines employee leave request endpoints with authentication and validation

**Routes:**
- `POST /` → authedMiddleware → validate(createLeaveRequestSchema) → asyncMiddleware(createLeaveRequest)
- `GET /` → authedMiddleware → asyncMiddleware(getUserLeaveRequests)
- `GET /:id` → authedMiddleware → validate(leaveRequestIdSchema, 'params') → asyncMiddleware(getLeaveRequestById)
- `PUT /:id` → authedMiddleware → validate(leaveRequestIdSchema, 'params') → validate(updateLeaveRequestSchema) → asyncMiddleware(updateLeaveRequest)
- `DELETE /:id` → authedMiddleware → validate(leaveRequestIdSchema, 'params') → asyncMiddleware(deleteLeaveRequest)

**Mount Point:** `/api/leave-requests` (configured in router.ts)

### admin.routes.ts
Defines admin-only leave request endpoints with authentication, authorization, and validation

**Routes:**
- `GET /leave-requests` → authedMiddleware → requireAdmin → asyncMiddleware(getAllLeaveRequests)
- `PATCH /leave-requests/:id/approve` → authedMiddleware → requireAdmin → validate(leaveRequestIdSchema, 'params') → validate(approveLeaveRequestSchema) → asyncMiddleware(approveLeaveRequest)
- `PATCH /leave-requests/:id/reject` → authedMiddleware → requireAdmin → validate(leaveRequestIdSchema, 'params') → validate(rejectLeaveRequestSchema) → asyncMiddleware(rejectLeaveRequest)

**Mount Point:** `/api/admin` (configured in router.ts)

### leave-request.middleware.ts
Role-based access control middleware

**Function:** `requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction)`

**Purpose:** Verifies that the authenticated user has admin role

**Process:**
1. Extracts userId from req.user (set by authedMiddleware)
2. Queries database for user record
3. Checks if user.role === 'admin'
4. Calls next() if admin
5. Throws ForbiddenError (403) if not admin or user not found

**Usage:** Applied to all admin routes after authedMiddleware

### leave-request.validators.ts
Zod validation schemas

**Schemas:**
- `createLeaveRequestSchema`: Validates creation data
  - startDate: ISO 8601 datetime format
  - endDate: ISO 8601 datetime format
  - reason: min 10 characters
  - Custom refinements:
    - Start date cannot be in the past
    - End date must be after start date

- `updateLeaveRequestSchema`: Validates update data
  - Same validation as createLeaveRequestSchema

- `leaveRequestIdSchema`: Validates route params
  - id: numeric string converted to number

- `approveLeaveRequestSchema`: Validates approval data
  - adminComment: optional string

- `rejectLeaveRequestSchema`: Validates rejection data
  - adminComment: required string (min 1 character)

**Import Note:** Always use `import { z } from 'zod/v4'`

### leave-request.types.ts
TypeScript interfaces for type safety

**Types:**
- `LeaveRequestStatus`: 'pending' | 'approved' | 'rejected'
- `CreateLeaveRequestInput`: Creation payload
- `UpdateLeaveRequestInput`: Update payload
- `LeaveRequestResponse`: Full leave request data returned to client
- `ApproveLeaveRequestInput`: Approval payload with optional adminComment
- `RejectLeaveRequestInput`: Rejection payload with required adminComment

## Database

**Table:** `leave_requests`

**Fields:**
- `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT)
- `userId` (INTEGER, NOT NULL, FOREIGN KEY → users.id, CASCADE DELETE)
- `startDate` (INTEGER/TIMESTAMP, NOT NULL)
- `endDate` (INTEGER/TIMESTAMP, NOT NULL)
- `reason` (TEXT, NOT NULL)
- `status` (TEXT, NOT NULL, ENUM: 'pending', 'approved', 'rejected', DEFAULT: 'pending')
- `adminComment` (TEXT, NULLABLE)
- `createdAt` (INTEGER/TIMESTAMP, NOT NULL, DEFAULT: CURRENT_TIMESTAMP)
- `updatedAt` (INTEGER/TIMESTAMP, NOT NULL, DEFAULT: CURRENT_TIMESTAMP)

**Import Path:** `import { leaveRequests } from '../../db/schema'`
**DB Client Path:** `import { db } from '../../db/client'`

## Business Rules

1. **One Pending Request Rule**: A user can only have one pending request at a time. This prevents request spam and simplifies admin workflow.

2. **Past Date Prevention**: Leave requests cannot start in the past. Dates are compared with time set to 00:00:00.

3. **Date Range Validation**: End date must be after start date.

4. **Ownership Enforcement**: Users can only view, update, or delete their own leave requests.

5. **Status Protection**: Only pending requests can be updated or deleted. Approved/rejected requests are immutable (by employees).

6. **Admin Status Protection**: Only pending requests can be approved or rejected by admins. Already approved/rejected requests cannot be changed.

7. **Rejection Comment Required**: Admins must provide a comment when rejecting a leave request to inform the employee of the reason.

8. **Approval Comment Optional**: Admins can optionally provide a comment when approving a leave request.

## Security Features

- ✅ Authentication required for all endpoints
- ✅ Role-based access control (admin endpoints require admin role)
- ✅ User ownership verification (users can only access their own requests)
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Drizzle parameterized queries)
- ✅ Status-based access control (pending only for updates/deletes/approvals/rejections)

## Testing

### Unit Tests
- **service.test.ts**: Tests for business logic with real database
  - Create leave request (success & conflict)
  - Get user leave requests (all, empty, filtered)
  - Get by ID (success, not found, unauthorized)
  - Update (success, not found, unauthorized, non-pending)
  - Delete (success, not found, unauthorized, non-pending)

### Integration Tests
- **integration.test.ts**: E2E tests for all endpoints (employee and admin)
  - POST /api/leave-requests (success, auth, validation, conflict)
  - GET /api/leave-requests (success, auth, filtering)
  - GET /api/leave-requests/:id (success, auth, ownership)
  - PUT /api/leave-requests/:id (success, auth, validation, ownership)
  - DELETE /api/leave-requests/:id (success, auth, ownership)
  - GET /api/admin/leave-requests (success, auth, authorization)
  - PATCH /api/admin/leave-requests/:id/approve (success, auth, authorization, validation, status protection)
  - PATCH /api/admin/leave-requests/:id/reject (success, auth, authorization, validation, status protection, required comment)

**Test Database:** Tests use the same database client, cleaned before each test

## Dependencies

```typescript
// External
import { z } from 'zod/v4';
import { eq, and } from 'drizzle-orm';

// Internal
import { db } from '../../db/client';
import { leaveRequests, users } from '../../db/schema';
import { ConflictError, NotFoundError, ForbiddenError } from '../../shared/errors/app-error';
import { successResponse } from '../../shared/utils/response';
import { validate } from '../../shared/middleware/validationMiddleware';
import { asyncMiddleware } from '../../shared/middleware/async-middleware';
import { authedMiddleware } from '../auth/auth.middleware';
import { requireAdmin } from './leave-request.middleware';
```

## Usage Example

### Create Leave Request
```bash
curl -X POST http://localhost:3000/api/leave-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "startDate": "2025-12-01T00:00:00.000Z",
    "endDate": "2025-12-15T00:00:00.000Z",
    "reason": "Family vacation during the holidays"
  }'
```

### Get All Leave Requests
```bash
curl -X GET http://localhost:3000/api/leave-requests \
  -H "Authorization: Bearer <token>"
```

### Get Specific Leave Request
```bash
curl -X GET http://localhost:3000/api/leave-requests/1 \
  -H "Authorization: Bearer <token>"
```

### Update Leave Request
```bash
curl -X PUT http://localhost:3000/api/leave-requests/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "startDate": "2025-12-05T00:00:00.000Z",
    "endDate": "2025-12-20T00:00:00.000Z",
    "reason": "Extended family vacation with more details"
  }'
```

### Delete Leave Request
```bash
curl -X DELETE http://localhost:3000/api/leave-requests/1 \
  -H "Authorization: Bearer <token>"
```

### Admin: Get All Leave Requests
```bash
curl -X GET http://localhost:3000/api/admin/leave-requests \
  -H "Authorization: Bearer <admin_token>"
```

### Admin: Approve Leave Request
```bash
curl -X PATCH http://localhost:3000/api/admin/leave-requests/1/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "adminComment": "Approved - enjoy your vacation!"
  }'
```

### Admin: Reject Leave Request
```bash
curl -X PATCH http://localhost:3000/api/admin/leave-requests/1/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "adminComment": "Rejected - insufficient staffing during this period"
  }'
```

## Integration with Other Modules

- **Auth Module**: Uses `authedMiddleware` to protect all endpoints and extract user identity
- **Role-based Authorization**: Uses `requireAdmin` middleware to restrict admin endpoints to users with admin role
- **Express Request Extension**: Uses `req.user.userId` and `req.user.role` to identify the authenticated user

## Future Enhancements (Out of Scope for POC)

- Email notifications when request status changes
- Calendar integration for approved leave dates
- Leave balance tracking
- Conflict detection (multiple employees on leave same day)
- Department-based approval workflows
- Leave request history and analytics

## Notes

- Keep it simple - this is a POC
- Always use class-based service pattern
- Export singleton instance of service
- Use Zod v4 for validation
- Import db from '../../db/client'
- Import errors from '../../shared/errors/app-error'
- All endpoints require authentication
- Admin endpoints require admin role (enforced by requireAdmin middleware)
- Users can only manage their own requests
- Admins can manage all requests
- Pending status is enforced for updates/deletes/approvals/rejections
- Admin comment is required when rejecting, optional when approving
