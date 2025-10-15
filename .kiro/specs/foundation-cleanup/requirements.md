# Requirements Document

## Introduction

The Bidinsouk platform has accumulated technical debt during development, including security vulnerabilities, inconsistent code patterns, weak validation schemas, and problematic auto-creation workflows. This foundation cleanup initiative aims to establish a secure, maintainable codebase before proceeding with feature development and production deployment. The cleanup addresses five critical areas: documentation organization, authentication security, data validation integrity, business logic enforcement, and basic security hardening.

## Requirements

### Requirement 1: Documentation Organization

**User Story:** As a developer, I want a clean and organized documentation structure, so that I can quickly understand the current project state without confusion from historical fix documents.

#### Acceptance Criteria

1. WHEN the documentation cleanup is complete THEN the system SHALL have a `/docs/archive/` directory containing all historical fix documents
2. WHEN a developer looks for project status THEN the system SHALL provide a single `CURRENT_STATUS.md` file as the source of truth
3. WHEN the README is updated THEN it SHALL accurately reflect the actual completion status of backend and frontend components
4. WHEN historical documents are archived THEN the system SHALL maintain a clear separation between current documentation and historical records
5. IF a developer needs to reference past fixes THEN the archived documents SHALL remain accessible in the archive directory

### Requirement 2: Authentication Security Hardening

**User Story:** As a security-conscious developer, I want all mock authentication code removed and replaced with proper authentication, so that the application is secure and cannot be exploited through header manipulation.

#### Acceptance Criteria

1. WHEN searching the codebase THEN the system SHALL have zero instances of mock authentication headers (`x-user-id`, `x-vendor-id`, `x-client-id`)
2. WHEN an API endpoint requires authentication THEN it SHALL use the `requireAuth()` function from `lib/auth/api-auth.ts`
3. WHEN an API endpoint requires role-based access THEN it SHALL use the `requireRole()` function with appropriate role validation
4. WHEN mock authentication code is removed THEN all existing API endpoints SHALL continue to function correctly with proper authentication
5. IF an unauthenticated request is made to a protected endpoint THEN the system SHALL return a 401 Unauthorized response
6. IF an authenticated user without proper role access attempts to access a restricted endpoint THEN the system SHALL return a 403 Forbidden response

### Requirement 3: Validation Schema Integrity

**User Story:** As a backend developer, I want all Zod validation schemas to properly validate data types and constraints, so that invalid data cannot enter the database and type safety is maintained throughout the application.

#### Acceptance Criteria

1. WHEN reviewing validation schemas THEN the system SHALL have zero instances of `z.any()` usage
2. WHEN a validation schema is defined THEN it SHALL match the corresponding database schema requirements exactly
3. WHEN data is submitted to an API endpoint THEN the validation schema SHALL enforce proper types for all fields
4. WHEN optional fields are defined THEN they SHALL use `.optional()` only when the database allows null values
5. WHEN validation fails THEN the system SHALL return clear error messages indicating which fields failed validation
6. IF a field has database constraints (min/max length, format) THEN the validation schema SHALL enforce those same constraints
7. WHEN nested objects are validated THEN they SHALL use properly typed Zod schemas instead of `z.any()`

### Requirement 4: Business Logic Enforcement

**User Story:** As a platform administrator, I want the vendor application and store creation workflows to be properly enforced, so that all vendors go through proper verification and stores have meaningful information.

#### Acceptance Criteria

1. WHEN a user creates a product THEN the system SHALL NOT automatically create a vendor profile if one doesn't exist
2. WHEN a user creates an auction THEN the system SHALL NOT automatically create a vendor profile if one doesn't exist
3. WHEN a vendor is created THEN the system SHALL NOT automatically create a store with generic placeholder data
4. WHEN a user attempts to perform vendor actions without vendor status THEN the system SHALL return an appropriate error message
5. IF a user wants to become a vendor THEN they SHALL follow the proper vendor application workflow with admin approval
6. WHEN a vendor creates a store THEN they SHALL provide all required store information (name, description, contact details)
7. WHEN the auto-creation code is removed THEN the vendor application and KYC verification workflows SHALL be properly enforced

### Requirement 5: Basic Security Measures

**User Story:** As a system administrator, I want basic security protections in place, so that the application is protected from common attacks like brute force, DDoS, and lacks proper security headers.

#### Acceptance Criteria

1. WHEN rate limiting is implemented THEN authentication endpoints SHALL be limited to 5 attempts per 15 minutes per IP address
2. WHEN rate limiting is implemented THEN general API endpoints SHALL be limited to 100 requests per 15 minutes per IP address
3. WHEN security headers are added THEN the application SHALL include appropriate headers (X-Frame-Options, X-Content-Type-Options, etc.)
4. WHEN a user exceeds rate limits THEN the system SHALL return a 429 Too Many Requests response with appropriate retry-after information
5. IF an IP address is rate limited THEN the system SHALL log the event for security monitoring
6. WHEN security measures are in place THEN they SHALL not negatively impact legitimate user experience
7. WHEN the application starts THEN security middleware SHALL be properly initialized and active

## Success Criteria

The foundation cleanup will be considered successful when:

1. All 70+ historical fix documents are archived and a single CURRENT_STATUS.md exists
2. Zero mock authentication headers remain in the codebase
3. All validation schemas use proper types without `z.any()`
4. Auto-creation patterns are completely removed and proper workflows are enforced
5. Rate limiting and security headers are active and tested
6. All existing functionality continues to work with the cleaned-up code
7. The codebase passes a security audit with no critical vulnerabilities related to these areas

## Out of Scope

The following items are explicitly out of scope for this foundation cleanup:

- Frontend page development or UI improvements
- Integration of external services (UploadThing, Resend, Pusher)
- Payment processing implementation
- Performance optimization or caching
- Automated testing infrastructure (will be addressed in later phases)
- New feature development
- Database schema changes
- Deployment configuration or infrastructure setup
