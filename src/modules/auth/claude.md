# Auth Module Documentation

## Overview

The authentication module handles user registration, login, and JWT-based authentication for the MTP application.

## Responsibilities

- User registration (employee and admin roles)
- User login with JWT token generation
- Password hashing and verification
- JWT token generation and verification
- Authentication middleware for protected routes

## Module Structure

```
auth/
├── auth.controller.ts        # HTTP request/response handlers
├── auth.service.ts           # Business logic (class-based)
├── auth.routes.ts            # Route definitions
├── auth.validators.ts        # Zod validation schemas
├── auth.middleware.ts        # JWT authentication middleware
├── auth.types.ts             # TypeScript interfaces
├── auth.utils.ts             # JWT & password utilities
├── claude.md                 # This documentation file
└── __tests__/
    ├── auth.integration.test.ts  # E2E endpoint tests
    ├── auth.service.test.ts      # Service unit tests
    └── auth.utils.test.ts        # Utils unit tests
```

## API Endpoints

### POST /api/auth/register
Register a new user (employee or admin)

**Request Body:**
```typescript
{
  email: string;        // Valid email format
  password: string;     // Min 8 characters
  fullName: string;     // Min 2 characters
  role: 'employee' | 'admin';
}
```

**Response (201):**
```typescript
{
  success: true;
  data: {
    userId: number;
    email: string;
    fullName: string;
    role: 'employee' | 'admin';
    createdAt: Date;
  }
}
```

**Errors:**
- 400: Validation error (invalid email, short password, etc.)
- 409: Email already exists

### POST /api/auth/login
Login and receive JWT token

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Response (200):**
```typescript
{
  success: true;
  data: {
    token: string;
    user: {
      userId: number;
      email: string;
      fullName: string;
      role: 'employee' | 'admin';
      createdAt: Date;
    }
  }
}
```

**Errors:**
- 400: Validation error (missing fields)
- 401: Invalid email or password

## Files Detail

### auth.service.ts
**Pattern:** Class-based service with singleton export

**Class:** `AuthService`

**Methods:**
- `registerUser(data: RegisterRequest): Promise<UserResponse>`
  - Checks for existing email
  - Hashes password with bcrypt
  - Creates user in database
  - Returns user data (without password hash)

- `loginUser(data: LoginRequest): Promise<LoginResponse>`
  - Finds user by email
  - Verifies password
  - Generates JWT token
  - Returns token and user data

**Export:** `export const authService = new AuthService()`

### auth.controller.ts
**Functions:**
- `register(req: Request, res: Response): Promise<void>`
  - Calls `authService.registerUser()`
  - Returns 201 status on success

- `login(req: Request, res: Response): Promise<void>`
  - Calls `authService.loginUser()`
  - Returns 200 status on success

### auth.routes.ts
Defines authentication endpoints with validation middleware

**Routes:**
- `POST /register` → validate(registerSchema) → asyncMiddleware(register)
- `POST /login` → validate(loginSchema) → asyncMiddleware(login)

**Mount Point:** `/api/auth` (configured in app.ts)

### auth.validators.ts
Zod validation schemas

**Schemas:**
- `registerSchema`: Validates registration data
  - Email format validation
  - Password min 8 characters
  - Full name min 2 characters
  - Role enum: 'employee' | 'admin'

- `loginSchema`: Validates login data
  - Email format validation
  - Password required

**Import Note:** Always use `import { z } from 'zod/v4'`

### auth.middleware.ts
**Function:** `authenticate(req: Request, res: Response, next: NextFunction)`

**Purpose:** Verifies JWT token and attaches user payload to request

**Process:**
1. Extracts token from `Authorization: Bearer <token>` header
2. Verifies token using `verifyToken()` utility
3. Attaches decoded payload to `req.user`
4. Calls `next()` if valid
5. Throws `UnauthorizedError` if invalid or missing

**Usage:** Apply to protected routes
```typescript
router.get('/protected', authenticate, controller);
```

### auth.types.ts
TypeScript interfaces for type safety

**Types:**
- `UserRole`: 'employee' | 'admin' (inferred from schema)
- `RegisterRequest`: Registration payload
- `LoginRequest`: Login payload
- `UserResponse`: User data returned to client (no password)
- `LoginResponse`: Login response with token and user

### auth.utils.ts
Utility functions for password and JWT operations

**Functions:**
- `hashPassword(password: string): Promise<string>`
  - Uses bcrypt with 10 salt rounds
  - Returns hashed password

- `comparePassword(password: string, hash: string): Promise<boolean>`
  - Compares plain password with hash
  - Returns true if match

- `generateToken(payload: JwtPayload): string`
  - Signs JWT with secret and expiration
  - Returns token string

- `verifyToken(token: string): JwtPayload`
  - Verifies and decodes JWT
  - Returns payload or throws error

**JwtPayload:**
```typescript
{
  userId: number;
  role: 'employee' | 'admin';
}
```

## Database

**Table:** `users`

**Fields:**
- `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT)
- `email` (TEXT, NOT NULL, UNIQUE)
- `passwordHash` (TEXT, NOT NULL)
- `fullName` (TEXT, NOT NULL)
- `role` (TEXT, NOT NULL, ENUM: 'employee', 'admin')
- `createdAt` (INTEGER/TIMESTAMP, NOT NULL, DEFAULT: CURRENT_TIMESTAMP)

**Import Path:** `import { users } from '../../db/schema'`
**DB Client Path:** `import { db } from '../../db/client'`

## Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT tokens with expiration (configured via env)
- ✅ Email uniqueness validation
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Drizzle parameterized queries)
- ✅ No password exposure in responses

## Testing

### Unit Tests
- **auth.utils.test.ts**: Tests for password hashing and JWT operations
- **auth.service.test.ts**: Tests for business logic with real database

### Integration Tests
- **auth.integration.test.ts**: E2E tests for registration and login endpoints
  - Tests successful registration (employee & admin)
  - Tests validation errors (invalid email, short password, etc.)
  - Tests duplicate email conflict
  - Tests successful login
  - Tests login failures (wrong email/password)

**Test Database:** Tests use the same database client, cleaned before each test

## Dependencies

```typescript
// External
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod/v4';
import { eq } from 'drizzle-orm';

// Internal
import { db } from '../../db/client';
import { users } from '../../db/schema';
import { ConflictError, UnauthorizedError } from '../../shared/errors/app-error';
import { successResponse } from '../../shared/utils/response';
import { validate } from '../../shared/middleware/validationMiddleware';
import { asyncMiddleware } from '../../shared/middleware/asyncMiddleware';
```

## Environment Variables

Required in `.env`:
```
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h
```

## Usage Example

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employee@example.com",
    "password": "password123",
    "fullName": "John Doe",
    "role": "employee"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employee@example.com",
    "password": "password123"
  }'
```

### Use Token for Protected Routes
```bash
curl -X GET http://localhost:3000/api/protected \
  -H "Authorization: Bearer <token>"
```

## Integration with Other Modules

- **Leave Request Module**: Uses `authenticate` middleware to protect endpoints
- **Admin Module**: Uses `authenticate` + role check to protect admin endpoints
- **Express Request Extension**: `req.user` contains JWT payload after authentication

## Future Enhancements (Out of Scope for POC)

- Password reset functionality
- Email verification
- Refresh tokens
- Rate limiting for login attempts
- Account lockout after failed attempts
- OAuth integration
- Two-factor authentication

## Notes

- Keep it simple - this is a POC
- Always use class-based service pattern
- Export singleton instance of service
- Use Zod v4 for validation
- Import db from '../../db/client'
- Import errors from '../../shared/errors/app-error'
