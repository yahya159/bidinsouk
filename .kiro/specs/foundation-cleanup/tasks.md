# Implementation Plan

- [x] 1. Documentation cleanup and organization





  - Create `/docs/archive/` directory structure with subdirectories for fixes, summaries, and guides
  - Write script to identify and move all historical fix documents (files matching `*FIX*.md`, `*SUMMARY*.md` patterns) to appropriate archive subdirectories
  - Create `CURRENT_STATUS.md` file with accurate backend (70%) and frontend (25%) completion percentages, critical issues list, and next steps
  - Update `README.md` to reflect actual project status, remove misleading completion claims, and add link to CURRENT_STATUS.md
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Fix validation schemas for type safety




- [x] 2.1 Update products validation schema


  - Modify `lib/validations/products.ts` to replace `attributes: z.record(z.any())` with properly typed schema using `z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))`
  - Ensure all fields match database schema constraints from `prisma/schema.prisma`
  - Add proper min/max length constraints for title (min 3, max 255) and other string fields
  - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7_

- [x] 2.2 Update messages validation schema


  - Modify `lib/validations/messages.ts` to replace `attachments: z.any()` with properly typed array schema
  - Define attachment object schema with fields: filename (string), url (string.url()), size (number), mimeType (string)
  - Make attachments array optional but properly typed when present
  - _Requirements: 3.1, 3.2, 3.3, 3.7_

- [x] 2.3 Review and update remaining validation schemas


  - Check `lib/validations/stores.ts`, `lib/validations/auctions.ts`, and other validation files for any `z.any()` usage
  - Ensure all optional fields use `.optional()` only when database allows NULL
  - Verify all enum fields match database enum definitions
  - Add validation error messages for better user feedback
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [x] 3. Implement security middleware and rate limiting





- [x] 3.1 Create rate limiter utility


  - Create `lib/security/rate-limiter.ts` with RateLimiter class implementing in-memory request tracking
  - Implement check method that tracks requests per identifier (IP address) within time windows
  - Define RATE_LIMITS configuration object with auth (5 req/15min), api (100 req/15min), and strict (10 req/15min) limits
  - Add automatic cleanup of expired rate limit records
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 3.2 Create rate limiting middleware wrapper


  - Create `lib/security/middleware.ts` with withRateLimit higher-order function
  - Implement identifier extraction from request (IP, x-forwarded-for header)
  - Add rate limit headers to responses (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
  - Return 429 status with retry-after information when rate limit exceeded
  - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [x] 3.3 Add security headers middleware


  - Create or update root `middleware.ts` to add security headers to all responses
  - Implement X-Frame-Options: DENY, X-Content-Type-Options: nosniff, X-XSS-Protection headers
  - Add Content-Security-Policy header with appropriate directives for Next.js app
  - Add Referrer-Policy and Permissions-Policy headers
  - Configure middleware matcher to apply to all routes except static files
  - _Requirements: 5.3, 5.6_

- [x] 4. Remove mock authentication and enforce proper auth




- [x] 4.1 Update vendor API routes authentication


  - Replace getCurrentUser() with requireRole() in `app/api/vendors/orders/route.ts` and `app/api/vendors/orders/[id]/status/route.ts`
  - Replace getCurrentUser() with requireRole() in `app/api/vendors/audit-logs/route.ts`
  - Update error handling to use try-catch pattern with 401/403 responses
  - Remove getCurrentUser() function definitions from these files
  - Test each endpoint with proper JWT authentication
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 4.2 Update vendor workspace API routes authentication


  - Replace getCurrentUser() with requireRole() in `app/api/vendor/reviews/route.ts`, `app/api/vendor/reports/route.ts`, `app/api/vendor/reports/generate/route.ts`
  - Replace getCurrentUser() with requireRole() in `app/api/vendor/dashboard/route.ts`, `app/api/vendor/clients/route.ts`, `app/api/vendor/analytics/route.ts`
  - Update error handling to use try-catch pattern with 401/403 responses
  - Remove getCurrentUser() function definitions from these files
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 4.3 Update admin API routes authentication


  - Replace getCurrentUser() with requireRole(['ADMIN']) in all admin routes: `app/api/admin/stores/[id]/route.ts`, `app/api/admin/stats/route.ts`, `app/api/admin/users/route.ts`, `app/api/admin/users/[id]/route.ts`
  - Replace getCurrentUser() with requireRole(['ADMIN']) in `app/api/admin/reviews/route.ts`, `app/api/admin/reviews/[id]/moderate/route.ts`, `app/api/admin/reports/route.ts`, `app/api/admin/reports/generate/route.ts`
  - Replace getCurrentUser() with requireRole(['ADMIN']) in `app/api/admin/dashboard/route.ts`, `app/api/admin/products/[id]/moderate/route.ts`, `app/api/admin/analytics/route.ts`, `app/api/admin/auctions/[id]/moderate/route.ts`
  - Update error handling and remove getCurrentUser() function definitions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 4.4 Update client-facing API routes authentication


  - Replace getCurrentUser() with requireAuth() in `app/api/saved-searches/route.ts` and `app/api/saved-searches/[id]/route.ts`
  - Replace getCurrentUser() with requireAuth() in `app/api/products/[id]/reviews/route.ts`
  - Replace getCurrentUser() with requireAuth() in `app/api/notifications/[id]/read/route.ts`
  - Update error handling and remove getCurrentUser() function definitions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_


- [x] 4.5 Update banner and abuse report API routes authentication

  - Replace getCurrentUser() with requireRole() in `app/api/banners/route.ts` and `app/api/banners/[id]/route.ts`
  - Replace getCurrentUser() with requireAuth() in `app/api/abuse-reports/route.ts` and `app/api/abuse-reports/[id]/route.ts`
  - Update error handling and remove getCurrentUser() function definitions
  - Verify no remaining instances of x-user-id, x-vendor-id, or x-client-id headers in codebase
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 5. Remove auto-creation patterns and enforce business logic






- [x] 5.1 Remove auto-creation from vendor products API

  - Modify `app/api/vendors/products/route.ts` POST handler to remove auto-vendor creation code block
  - Modify `app/api/vendors/products/route.ts` POST handler to remove auto-store creation code block
  - Add proper vendor and store existence checks with helpful error messages ("Vendor profile required", "Active store required")
  - Modify `app/api/vendors/products/route.ts` PUT handler to remove auto-vendor and auto-store creation code blocks
  - Add proper error handling for missing vendor profile or active store
  - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7_

- [x] 5.2 Remove auto-creation from vendor settings API


  - Modify `app/api/vendors/settings/route.ts` to remove auto-vendor creation code block
  - Modify `app/api/vendors/settings/route.ts` to remove auto-store creation code block
  - Add proper vendor and store existence checks with helpful error messages
  - Ensure settings can only be updated for existing, approved vendors with active stores
  - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7_

- [x] 5.3 Remove auto-creation from auctions API


  - Modify `app/api/auctions/route.ts` to remove auto-store creation code block (around line 287)
  - Add proper vendor and store existence checks before allowing auction creation
  - Ensure auction creation requires approved vendor status and active store
  - Add helpful error messages guiding users through proper vendor application workflow
  - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7_

- [x] 5.4 Verify business logic enforcement


  - Test product creation without vendor profile (should fail with clear error message)
  - Test product creation without active store (should fail with clear error message)
  - Test auction creation without vendor profile (should fail with clear error message)
  - Test settings update without vendor profile (should fail with clear error message)
  - Test successful product/auction creation with proper vendor and active store
  - Verify vendor application and store approval workflows are properly enforced
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 6. Integration testing and verification





  - Test all modified API endpoints with proper authentication (should work correctly)
  - Test all modified API endpoints without authentication (should return 401)
  - Test role-restricted endpoints with incorrect roles (should return 403)
  - Test validation schemas with valid and invalid data (should validate correctly)
  - Test rate limiting on auth endpoints (should block after 5 attempts)
  - Test rate limiting on API endpoints (should block after 100 requests)
  - Verify security headers present in all HTTP responses
  - Verify no mock authentication headers remain in codebase
  - Verify no z.any() usage remains in validation schemas
  - Verify no auto-creation patterns remain in API routes
  - _Requirements: 1.5, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.5, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
