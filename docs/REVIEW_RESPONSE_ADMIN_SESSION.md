## Review Response: Admin session checks

- Updated all new admin API routes introduced in this patch to call `isAdmin(session)` instead of `isAdmin(session.user)` so that role validation inspects the full NextAuth session object.
- Adjusted the following handlers: `app/api/admin/analytics/revenue/route.ts`, `app/api/admin/analytics/products/route.ts`, `app/api/admin/analytics/users/route.ts`, `app/api/admin/auctions/route.ts`, `app/api/admin/auctions/[id]/route.ts`, `app/api/admin/auctions/[id]/end/route.ts`, `app/api/admin/auctions/[id]/extend/route.ts`, `app/api/admin/reports/route.ts`, `app/api/admin/reports/[id]/route.ts`, and `app/api/admin/settings/route.ts`.
- Verified with `rg -F 'isAdmin(session.user)'` that no admin route still passes only the nested user object, preventing regressions in future endpoints.
