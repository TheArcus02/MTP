# Holidays Module Documentation

## Overview

The holidays module integrates with the Nager.Date external API to fetch public holiday information for different countries and years. This allows employees to view public holidays when planning their leave requests.

## Responsibilities

- Fetch public holidays from Nager.Date API (https://date.nager.at/)
- Validate year and country code parameters
- Handle API errors gracefully
- Require authentication for all requests
- Return holiday data in standardized format

## Module Structure

```
holidays/
├── holidays.controller.ts    # HTTP request/response handler
├── holidays.service.ts       # External API integration (class-based)
├── holidays.routes.ts        # Route definitions
├── holidays.validators.ts    # Zod validation schemas
├── holidays.types.ts         # TypeScript interfaces
├── CLAUDE.md                 # This documentation file
└── __tests__/
    └── holidays.integration.test.ts  # E2E endpoint tests
```

## API Endpoint

### GET /api/holidays/:year/:countryCode
Get public holidays for a specific year and country (requires authentication)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `year` (number): Year in YYYY format (2000-2035 range)
- `countryCode` (string): ISO 3166-1 alpha-2 country code (2 uppercase letters, e.g., PL, US, GB)

**Response (200):**
```typescript
{
  success: true;
  data: [
    {
      date: string;           // ISO date format (YYYY-MM-DD)
      localName: string;      // Holiday name in local language
      name: string;           // Holiday name in English
      countryCode?: string;   // Country code
      fixed?: boolean;        // Whether it's a fixed date
      global?: boolean;       // Whether it's a national holiday
      counties?: string[] | null;
      launchYear?: number | null;
      types?: string[] | null;
    }
  ]
}
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "localName": "Nowy Rok",
      "name": "New Year's Day",
      "countryCode": "PL",
      "fixed": true,
      "global": true,
      "counties": null,
      "launchYear": null,
      "types": ["Public"]
    },
    {
      "date": "2024-05-01",
      "localName": "Święto Pracy",
      "name": "Labour Day",
      "countryCode": "PL",
      "fixed": true,
      "global": true,
      "counties": null,
      "launchYear": null,
      "types": ["Public"]
    }
  ]
}
```

**Errors:**
- 400: Validation error (invalid year format, invalid country code)
- 401: Not authenticated
- 404: Country code not found in API

## Files Detail

### holidays.service.ts
**Pattern:** Class-based service with singleton export

**Class:** `HolidaysService`

**Properties:**
- `baseUrl`: `https://date.nager.at/api/v3` - Nager.Date API base URL

**Methods:**
- `getPublicHolidays(year: number, countryCode: string): Promise<PublicHoliday[]>`
  - Constructs API URL with year and country code
  - Fetches data from Nager.Date API
  - Handles 404 responses (invalid country code)
  - Throws NotFoundError for invalid country codes
  - Throws generic Error for other API failures
  - Returns array of public holidays

**Error Handling:**
- 404 from API → NotFoundError with user-friendly message
- Network errors → Generic Error with error details
- Invalid responses → Generic Error

**Export:** `export const holidaysService = new HolidaysService()`

### holidays.controller.ts
**Function:** `getPublicHolidays(req: Request, res: Response): Promise<void>`

**Process:**
1. Extracts year and countryCode from req.params
2. Converts year to number
3. Converts countryCode to uppercase
4. Calls `holidaysService.getPublicHolidays()`
5. Returns 200 status with holidays array

### holidays.routes.ts
Defines holidays endpoint with authentication and validation

**Routes:**
- `GET /:year/:countryCode` → authedMiddleware → validate(holidaysParamsSchema, 'params') → asyncMiddleware(getPublicHolidays)

**Mount Point:** `/api/holidays` (configured in router.ts)

### holidays.validators.ts
Zod validation schemas

**Schema:** `holidaysParamsSchema`
- Validates route parameters (year and countryCode)
- Year validation:
  - Must be 4-digit string
  - Converted to number
  - Must be between 2000 and current year + 10
- Country code validation:
  - Must be exactly 2 characters
  - Automatically converted to uppercase

**Import Note:** Always use `import { z } from 'zod/v4'`

### holidays.types.ts
TypeScript interfaces for type safety

**Types:**
- `PublicHoliday`: Holiday data structure from Nager.Date API
  - Core fields: date, localName, name
  - Optional fields: countryCode, fixed, global, counties, launchYear, types

- `HolidaysQueryParams`: Request parameters
  - year: number
  - countryCode: string

## External API

**Provider:** Nager.Date
**Documentation:** https://date.nager.at/
**Base URL:** https://date.nager.at/api/v3
**Endpoint Used:** `/PublicHolidays/{year}/{countryCode}`

**API Features:**
- Free and open source
- No API key required
- Supports 100+ countries
- Returns standardized holiday data
- Available years: typically current year ±10 years

**Common Country Codes:**
- PL - Poland
- US - United States
- GB - United Kingdom
- DE - Germany
- FR - France
- IT - Italy
- ES - Spain
- CA - Canada
- AU - Australia
- JP - Japan

## Validation Rules

1. **Year Format**: Must be exactly 4 digits (YYYY)
2. **Year Range**: Between 2000 and current year + 10
3. **Country Code Format**: Exactly 2 uppercase letters (ISO 3166-1 alpha-2)
4. **Authentication**: JWT token required

## Security Features

- ✅ Authentication required
- ✅ Input validation with Zod
- ✅ Year range validation (prevents API abuse)
- ✅ Country code format validation
- ✅ Error message sanitization (doesn't leak API details)

## Testing

### Integration Tests
- **holidays.integration.test.ts**: E2E tests for the endpoint
  - GET /api/holidays/:year/:countryCode (success for valid countries)
  - Authentication requirement
  - Year format validation
  - Year range validation (too old/too new)
  - Country code format validation
  - Non-existent country code handling (404)

**Test Coverage:** 8 tests covering all major scenarios

## Dependencies

```typescript
// External
import { z } from 'zod/v4';

// Internal
import { NotFoundError } from '../../shared/errors/app-error';
import { successResponse } from '../../shared/utils/response';
import { validate } from '../../shared/middleware/validationMiddleware';
import { asyncMiddleware } from '../../shared/middleware/async-middleware';
import { authedMiddleware } from '../auth/auth.middleware';

// Node.js built-in
import { fetch } from 'node:fetch' (available in Node 18+)
```

## Usage Example

### Get Public Holidays for Poland 2024
```bash
curl -X GET http://localhost:3000/api/holidays/2024/PL \
  -H "Authorization: Bearer <token>"
```

### Get Public Holidays for United States 2025
```bash
curl -X GET http://localhost:3000/api/holidays/2025/US \
  -H "Authorization: Bearer <token>"
```

### Response Example
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "localName": "Nowy Rok",
      "name": "New Year's Day",
      "countryCode": "PL",
      "fixed": true,
      "global": true
    }
  ]
}
```

## Integration with Other Modules

- **Auth Module**: Uses `authedMiddleware` to protect the endpoint and extract user identity
- **Validation Middleware**: Uses `validate` for parameter validation
- **Error Middleware**: Handles NotFoundError and other exceptions gracefully
- **Express Request Extension**: Requires authenticated user (req.user)

## Use Cases

1. **Leave Planning**: Employees can check public holidays before submitting leave requests
2. **Calendar Integration**: Display public holidays alongside leave dates
3. **Avoid Redundant Requests**: Don't request leave on public holidays
4. **Multi-Country Support**: Useful for companies with international offices

## Future Enhancements (Out of Scope for POC)

- Cache holiday data to reduce external API calls
- Support for regional/state-specific holidays
- Integration with leave request creation (show conflicts)
- Automatic holiday blocking in leave calendar
- Multi-year holiday fetching
- Available countries list endpoint
- Webhook for holiday updates

## Error Handling

### Client Errors (400)
- Invalid year format (not 4 digits)
- Year out of range (before 2000 or too far in future)
- Invalid country code format (not 2 characters)

### Server Errors
- External API unavailable → Generic error message
- Network timeout → Generic error message
- Invalid API response → Generic error message

### Not Found (404)
- Country code not recognized by Nager.Date API

## Performance Considerations

- External API calls add latency (typically 200-500ms)
- No caching implemented in POC (each request hits external API)
- Consider implementing cache for production use
- Rate limiting not required (Nager.Date API is generous)

## Notes

- Keep it simple - this is a POC
- Always use class-based service pattern
- Export singleton instance of service
- Use Zod v4 for validation
- Import errors from '../../shared/errors/app-error'
- Endpoint requires authentication
- External API may change - handle gracefully
- No API key required for Nager.Date
- Country codes are case-insensitive (automatically uppercased)
- Year validation prevents far-future/past requests
