# Leave Request Module Documentation

## Overview

The leave request module handles employee leave/vacation request management with full CRUD operations. Employees can create, view, update, and delete their own leave requests.

## Responsibilities

- Create leave requests with start date, end date, and reason
- View all leave requests for the authenticated user
- View a specific leave request by ID
- Update pending leave requests
- Delete pending leave requests
- Enforce business rule: only one pending request per user at a time

## Module Structure

```
leave-request/
├── leave-request.controller.ts    # HTTP request/response handlers
├── leave-request.service.ts       # Business logic (class-based)
├── leave-request.routes.ts        # Route definitions
├── leave-request.validators.ts    # Zod validation schemas
├── leave-request.types.ts         # TypeScript interfaces
├── claude.md                      # This documentation file
└── __tests__/
    ├── integration.test.ts        # E2E endpoint tests
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

**Private Methods:**
- `mapToResponse(request): LeaveRequestResponse`
  - Maps database record to response format

**Export:** `export const leaveRequestService = new LeaveRequestService()`

### leave-request.controller.ts
**Functions:**
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

### leave-request.routes.ts
Defines leave request endpoints with authentication and validation

**Routes:**
- `POST /` → authenticate → validate(createLeaveRequestSchema) → asyncMiddleware(createLeaveRequest)
- `GET /` → authenticate → asyncMiddleware(getUserLeaveRequests)
- `GET /:id` → authenticate → validate(leaveRequestIdSchema, 'params') → asyncMiddleware(getLeaveRequestById)
- `PUT /:id` → authenticate → validate(leaveRequestIdSchema, 'params') → validate(updateLeaveRequestSchema) → asyncMiddleware(updateLeaveRequest)
- `DELETE /:id` → authenticate → validate(leaveRequestIdSchema, 'params') → asyncMiddleware(deleteLeaveRequest)

**Mount Point:** `/api/leave-requests` (configured in router.ts)

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

**Import Note:** Always use `import { z } from 'zod/v4'`

### leave-request.types.ts
TypeScript interfaces for type safety

**Types:**
- `LeaveRequestStatus`: 'pending' | 'approved' | 'rejected'
- `CreateLeaveRequestInput`: Creation payload
- `UpdateLeaveRequestInput`: Update payload
- `LeaveRequestResponse`: Full leave request data returned to client

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

## Security Features

- ✅ Authentication required for all endpoints
- ✅ User ownership verification (users can only access their own requests)
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Drizzle parameterized queries)
- ✅ Status-based access control (pending only for updates/deletes)

## Testing

### Unit Tests
- **service.test.ts**: Tests for business logic with real database
  - Create leave request (success & conflict)
  - Get user leave requests (all, empty, filtered)
  - Get by ID (success, not found, unauthorized)
  - Update (success, not found, unauthorized, non-pending)
  - Delete (success, not found, unauthorized, non-pending)

### Integration Tests
- **integration.test.ts**: E2E tests for all endpoints
  - POST /api/leave-requests (success, auth, validation, conflict)
  - GET /api/leave-requests (success, auth, filtering)
  - GET /api/leave-requests/:id (success, auth, ownership)
  - PUT /api/leave-requests/:id (success, auth, validation, ownership)
  - DELETE /api/leave-requests/:id (success, auth, ownership)

**Test Database:** Tests use the same database client, cleaned before each test

## Dependencies

```typescript
// External
import { z } from 'zod/v4';
import { eq, and } from 'drizzle-orm';

// Internal
import { db } from '../../db/client';
import { leaveRequests } from '../../db/schema';
import { ConflictError, NotFoundError } from '../../shared/errors/app-error';
import { successResponse } from '../../shared/utils/response';
import { validate } from '../../shared/middleware/validationMiddleware';
import { asyncMiddleware } from '../../shared/middleware/async-middleware';
import { authenticate } from '../auth/auth.middleware';
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

## Integration with Other Modules

- **Auth Module**: Uses `authenticate` middleware to protect all endpoints and extract user identity
- **Admin Module** (Phase 4): Will extend this module with admin-only endpoints for approval/rejection
- **Express Request Extension**: Uses `req.user.userId` to identify the authenticated user

## Future Enhancements (Phase 4 - Admin)

- Admin endpoints to view all requests
- Admin endpoints to approve/reject requests
- Role-based middleware to restrict admin actions
- Admin comments on approval/rejection
- Notifications when request status changes

## Notes

- Keep it simple - this is a POC
- Always use class-based service pattern
- Export singleton instance of service
- Use Zod v4 for validation
- Import db from '../../db/client'
- Import errors from '../../shared/errors/app-error'
- All endpoints require authentication
- Users can only manage their own requests
- Pending status is enforced for updates/deletes
