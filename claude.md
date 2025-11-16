# MTP Backend - Project Guide

## Project Overview

**Manager Terminów Pracowniczych (MTP)** - Employee Leave Management System

A TypeScript REST API backend for managing employee vacation/leave requests with two user roles:

- **Employee**: Register, login, submit/manage leave requests
- **Administrator**: Approve or reject employee leave requests

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js v5
- **Database**: SQLite3 with Drizzle ORM + better-sqlite3
- **Authentication**: JWT + bcryptjs
- **Validation**: Zod schemas (request validation), @t3-oss/env-core (environment validation)
- **Testing**: Jest + Supertest
- **Code Quality**: Biome (linter + formatter)

## Development Philosophy

### TDD (Test-Driven Development)

1. Write test first for the endpoint
2. Implement the endpoint
3. Run tests and iterate until all pass
4. Move to next endpoint

### Code Style

- **Simple POC-level code** - Don't overcomplicate
- **No unnecessary comments** - Code should be self-explanatory
- **Follow best practices** - But keep it straightforward
- **Clean separation of concerns** - Use the layered architecture
- **File naming**: Use kebab-case with module prefix (e.g., `auth.utils.ts`, `leave-request.service.ts`)

### Important Import Rules

- **Zod imports**: Always use `import { z } from 'zod/v4'` (not just `'zod'`)
- **Database**: Import from `'../../db/client'` (not `'../../config/database'`)
- **Errors**: Import from `'../../shared/errors/app-error'` (ConflictError, UnauthorizedError, etc.)

### Service Pattern

- **Always use class-based services**: Services should be implemented as classes with methods
- **Export singleton instance**: Export a single instance (e.g., `export const authService = new AuthService()`)
- **Example pattern**:

  ```typescript
  class AuthService {
    async registerUser(data: RegisterRequest): Promise<UserResponse> {
      // implementation
    }
  }

  export const authService = new AuthService();
  ```

### Module Documentation

- **Each module must have a claude.md file**: Create a `claude.md` file in each module directory
- **Purpose**: Provides context and documentation about the module's structure, responsibilities, and implementation
- **Contents**: API endpoints, file details, database schema, testing info, usage examples, and integration notes
- **Location**: `src/modules/{module-name}/claude.md`

## Folder Structure

**Feature-based Collocation** - Group related files by module/feature for better maintainability.

```
src/
├── index.ts                          # App entry point & server startup
├── app.ts                            # Express app configuration & middleware setup
├── config/
│   ├── database.ts                   # Drizzle DB connection & initialization
│   └── env.ts                        # Environment variable validation (@t3-oss/env-core)
├── db/
│   ├── schema.ts                     # Drizzle schema definitions
│   └── migrations/                   # Drizzle migration files
├── shared/
│   ├── middleware/
│   │   ├── errorHandler.ts           # Global error handling
│   │   ├── validation.ts             # Zod validation wrapper
│   │   └── __tests__/
│   │       └── errorHandler.test.ts
│   ├── types/
│   │   └── express.d.ts              # Express Request extension for JWT
│   └── utils/
│       ├── response.ts               # Standardized API response helpers
│       └── __tests__/
│           └── response.test.ts
└── modules/
    ├── auth/
    │   ├── auth.controller.ts        # Auth HTTP handlers
    │   ├── auth.service.ts           # Authentication business logic
    │   ├── auth.routes.ts            # Auth endpoints
    │   ├── auth.validators.ts        # Zod schemas for registration/login
    │   ├── auth.middleware.ts        # JWT verification
    │   ├── auth.types.ts             # Auth-related interfaces
    │   ├── auth.utils.ts             # JWT & password utilities
    │   ├── claude.md                 # Module documentation
    │   └── __tests__/
    │       ├── auth.service.test.ts  # Unit tests
    │       ├── auth.utils.test.ts    # Utils unit tests
    │       └── auth.integration.test.ts   # E2E endpoint tests
    ├── leave-request/
    │   ├── leaveRequest.controller.ts     # Leave request HTTP handlers
    │   ├── leaveRequest.service.ts        # Leave request business logic
    │   ├── leaveRequest.routes.ts         # Leave request endpoints
    │   ├── leaveRequest.validators.ts     # Zod schemas for leave requests
    │   ├── leaveRequest.middleware.ts     # Role-based access control
    │   ├── leaveRequest.types.ts          # Leave request interfaces
    │   ├── claude.md                      # Module documentation
    │   └── __tests__/
    │       ├── leaveRequest.service.test.ts
    │       └── leaveRequest.integration.test.ts
    └── holidays/
        ├── holidays.controller.ts    # External API HTTP handler
        ├── holidays.service.ts       # External API integration
        ├── holidays.routes.ts        # External API endpoint
        ├── claude.md                 # Module documentation
        └── __tests__/
            └── holidays.integration.test.ts

docs/
├── database-documentation.md               # Database documentation
└── user-stories.md                   # Complete user stories list
```

## Database Schema (Drizzle ORM)

### Users Table

```typescript
// src/db/schema.ts
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role', { enum: ['employee', 'admin'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
```

### Leave Requests Table

```typescript
// src/db/schema.ts
export const leaveRequests = sqliteTable('leave_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  reason: text('reason').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] })
    .notNull()
    .default('pending'),
  adminComment: text('admin_comment'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user (employee or admin)
- `POST /api/auth/login` - Login and receive JWT token

### Leave Requests (Employee)

- `POST /api/leave-requests` - Create leave request [Auth Required]
- `GET /api/leave-requests` - Get own leave requests [Auth Required]
- `GET /api/leave-requests/:id` - Get specific leave request [Auth Required]
- `PUT /api/leave-requests/:id` - Update pending request [Auth Required]
- `DELETE /api/leave-requests/:id` - Delete pending request [Auth Required]

### Admin Operations

- `GET /api/admin/leave-requests` - Get all leave requests [Admin Required]
- `PATCH /api/admin/leave-requests/:id/approve` - Approve request [Admin Required]
- `PATCH /api/admin/leave-requests/:id/reject` - Reject request [Admin Required]

### External API

- `GET /api/holidays/:year/:countryCode` - Get public holidays from external API [Auth Required]

**External API**: Nager.Date API (https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode})

## Architecture Pattern

**Repository + Service Layer Pattern**

### Flow

```
Request → Route → Controller → Service → Model → Database
                     ↓
                 Middleware (Auth, Validation, Error)
```

### Responsibilities

- **Models**: Database operations only (CRUD)
- **Services**: Business logic, validation, data transformation (class-based singleton pattern)
- **Controllers**: HTTP request/response handling
- **Middleware**: Cross-cutting concerns (auth, validation, errors)
- **Routes**: Endpoint definitions

## Implementation Phases

### Phase 1: Foundation

1. Environment configuration (.env, config/env.ts using @t3-oss/env-core)
2. Database schema (db/schema.ts with Drizzle)
3. Database connection (config/database.ts with better-sqlite3)
4. Error handling (shared/middleware/error-handler.ts, custom error classes)
5. Response utilities (shared/utils/response.ts)
6. Validation middleware (shared/middleware/validation.ts)
7. Express types extension (shared/types/express.d.ts)

### Phase 2: Authentication Module

1. Write auth tests (modules/auth/**tests**/auth.integration.test.ts)
2. Auth utilities - JWT & password (modules/auth/auth.utils.ts + modules/auth/**tests**/auth.utils.test.ts)
3. Auth types (modules/auth/auth.types.ts)
4. Auth validators (modules/auth/auth.validators.ts) - Use `import { z } from 'zod/v4'`
5. Auth service (modules/auth/auth.service.ts + modules/auth/**tests**/auth.service.test.ts)
6. Auth middleware (modules/auth/auth.middleware.ts)
7. Auth controller (modules/auth/auth.controller.ts)
8. Auth routes (modules/auth/auth.routes.ts)
9. Create module documentation (modules/auth/claude.md)
10. Run tests until all pass

### Phase 3: Leave Request Module (Employee CRUD)

1. Write leave request tests (modules/leave-request/**tests**/leaveRequest.integration.test.ts)
2. Leave request types (modules/leave-request/leaveRequest.types.ts)
3. Leave request validators (modules/leave-request/leaveRequest.validators.ts) - Use `import { z } from 'zod/v4'`
4. Leave request service (modules/leave-request/leaveRequest.service.ts + modules/leave-request/**tests**/leaveRequest.service.test.ts)
5. Leave request controller (modules/leave-request/leaveRequest.controller.ts)
6. Leave request routes (modules/leave-request/leaveRequest.routes.ts)
7. Create module documentation (modules/leave-request/claude.md)
8. Run tests until all pass

### Phase 4: Admin Approval System

1. Write admin tests (extend modules/leave-request/**tests**/leaveRequest.integration.test.ts)
2. Role middleware (modules/leave-request/leaveRequest.middleware.ts)
3. Admin service methods (extend modules/leave-request/leaveRequest.service.ts)
4. Admin controller methods (extend modules/leave-request/leaveRequest.controller.ts)
5. Admin routes (extend modules/leave-request/leaveRequest.routes.ts)
6. Update module documentation (modules/leave-request/claude.md)
7. Run tests until all pass

### Phase 5: External API Integration (Holidays)

1. Write holidays tests (modules/holidays/**tests**/holidays.integration.test.ts)
2. Holidays service (modules/holidays/holidays.service.ts)
3. Holidays controller (modules/holidays/holidays.controller.ts)
4. Holidays routes (modules/holidays/holidays.routes.ts)
5. Create module documentation (modules/holidays/claude.md)
6. Run tests until all pass

### Phase 6: Documentation

1. Database documentation
2. User stories (docs/user-stories.md)
3. API documentation in README or separate doc

## Drizzle ORM Setup

### Required Dependencies

Install Drizzle and better-sqlite3:

```bash
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3
```

### Drizzle Config

Create `drizzle.config.ts` in project root:

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  driver: 'better-sqlite3',
  dbCredentials: {
    url: process.env.DATABASE_PATH || './mtp.db',
  },
} satisfies Config;
```

### Drizzle Commands

```bash
npm run db:generate   # Generate migrations from schema
npm run db:migrate    # Run migrations (push to database)
npm run db:studio     # Open Drizzle Studio (GUI)
```

Add to package.json scripts:

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```

## Environment Variables

Create `.env` file:

```
PORT=3000
DATABASE_PATH=./mtp.db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=24h
NODE_ENV=development
```

## Validation Rules

### Registration

- Email: valid email format, unique
- Password: min 8 characters
- Full name: required, min 2 characters
- Role: 'employee' or 'admin'

### Login

- Email: required, valid format
- Password: required

### Leave Request

- Start date: required, cannot be in the past
- End date: required, must be after start_date
- Reason: required, min 10 characters
- User can only have one pending request at a time (business rule)

### Admin Actions

- Can only approve/reject pending requests
- Must provide admin_comment when rejecting

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": []
  }
}
```

### Standard Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

## Testing Strategy

### Unit Tests

- Utils (JWT, password hashing)
- Services (business logic with mocked models)

### Integration Tests

- Full endpoint flows with real database (in-memory or test DB)
- Authentication flow
- Authorization checks
- CRUD operations
- Error scenarios

### Coverage Target

- Focus on critical paths (auth, business logic)

## Security Checklist

- [x] Password hashing with bcryptjs (10 salt rounds)
- [x] JWT tokens with expiration
- [x] Role-based access control
- [x] Input validation with Zod
- [x] SQL injection prevention (parameterized queries)
- [x] CORS configuration
- [x] Environment variables for secrets
- [x] Error messages don't leak sensitive info

## Running the Project

```bash
# Install dependencies
npm install

# Development mode (hot reload)
npm run dev

# Build TypeScript
npm run build

# Production mode
npm start

# Run tests
npm test

# Run tests in watch mode
npm test:watch
```

## Testing with Postman

Import endpoints and test:

1. Register admin and employee users
2. Login to get JWT tokens
3. Create leave requests as employee
4. Approve/reject as admin
5. Test authorization (employee can't access admin endpoints)
6. Test validation errors
7. Test external API endpoint

## Quick Start Checklist

- [ ] Create `.env` file with required variables
- [ ] Initialize database schema
- [ ] Implement Phase 1 (Foundation)
- [ ] Implement Phase 2 (Authentication) with TDD
- [ ] Implement Phase 3 (Leave Requests) with TDD
- [ ] Implement Phase 4 (Admin) with TDD
- [ ] Implement Phase 5 (External API) with TDD
- [ ] Write documentation
- [ ] Create database documentation
- [ ] Document user stories
- [ ] Run full test suite
- [ ] Test all endpoints in Postman

## Notes for Future Claude Sessions

- Always follow TDD: test first, implement second
- Keep code simple and readable
- Don't add comments for obvious code
- Use TypeScript types for documentation
- Follow the layered architecture strictly
- Validate all inputs with Zod (import from 'zod/v4')
- Handle all errors gracefully
- Return consistent response formats
- Test authorization thoroughly
- Keep services focused and small
- Use kebab-case in file namings with module prefix (e.g., auth.utils.ts)
- Import db from '../../db/client' (not config/database)
- Import errors from '../../shared/errors/app-error'
- **Services must be class-based**: Always implement services as classes and export singleton instance
- **Create claude.md for each module**: Document structure, API endpoints, files, testing, and integration notes
