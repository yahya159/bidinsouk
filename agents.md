# Bidinsouk Agent Guardrails

This document tells Codex agents how to work inside the Bidinsouk marketplace repo without breaking established standards. Read it before you touch code and keep it open while you work.

## Primary References
- `.cursorrules` – source of truth for coding standards (imports, logging, Prisma usage, error handling).
- `START_HERE.md`, `README.md`, `QUICK_START_GUIDE.md` – environment setup, feature map, project intent.
- `COMMIT_GUIDE.md` – commit strategy and message format.
- `docs/` – architecture deep dives (auth, auctions, vendor approval, realtime bidding, message-to-order flows).
- `API_AUDIT_REPORT.md`, `FINAL_AUDIT_REPORT.md`, `DEEP_CLEAN_REPORT.md` – rationale for current structure; revisit if you plan architectural shifts.

## Architecture Snapshot
- Next.js 15 (App Router) with React 19, TypeScript `strict`, path alias `@/*`.
- UI is Mantine-first with a shared theme in `app/providers.tsx` and `lib/theme.ts`.
- Server logic stays in `app/api/**` for routes and `lib/services/**` for business rules.
- Prisma (MySQL) models live in `prisma/schema.prisma`; IDs are `BigInt`, monetary values use `Decimal`.
- Real-time behavior is built around Pusher (`lib/realtime/pusher.ts`) with resilient hooks under `hooks/`.
- Localization uses `next-intl`; messages are stored in `messages/<locale>.json` and loaded via `i18n/request.ts`.

## Coding Patterns to Follow
- Always import shared utilities from the canonical paths in `.cursorrules` (`@/lib/db/prisma`, `@/lib/auth/config`, `@/lib/logger`, `@/lib/api/responses`).
- Keep API handlers thin: validate input, enforce auth/roles, call a `lib/services/**` function, return standardized responses.
- Prefer Mantine components and the shared `theme` for UI consistency; register new providers through `app/providers.tsx`.
- Use context + hooks (see `contexts/MessageCountsContext.tsx`, `hooks/useMessageCounts.ts`) when wiring client-side state across layouts.
- Centralize reusable helpers in `lib/utils` (`bigint`, `pagination`, `imageOptimization`, etc.) before adding new utility code in-line.
- When you need middleware-like concerns for server logic, check `lib/middleware/**` (admin auth, vendor context, activity logging) and extend there instead of scattering logic.

## Error Handling, Logging, and Responses
- Use `logger` for errors and telemetry; do not reintroduce raw `console.log/error` in production paths.
- Return API results through `successResponse` / `ErrorResponses.*`. If a handler still uses raw `NextResponse`, refactor toward the shared helpers.
- Always wrap Prisma calls with try/catch in API handlers, log errors with context, and return user-friendly messages.
- Use `lib/security/rate-limiter.ts` or existing guards for sensitive endpoints instead of ad-hoc rate limiting.

## Authentication & Authorization
- Authentication relies on NextAuth JWT credentials (`lib/auth/config.ts`, `lib/auth/session.ts`). Always reuse these helpers.
- Enforce identity with `requireAuth(req)`; enforce authorization with `requireRole(req, ['ROLE'])` or `requireAllRoles`.
- Respect role semantics (CLIENT, VENDOR, ADMIN). Vendor/admin areas should confirm role membership before exposing data, often via `lib/middleware/vendor-context.ts` or related helpers.
- Do not bypass or duplicate auth logic inside API handlers or UI components; extend the helpers if the project needs new role checks.

## Data Access & Prisma
- Reuse the singleton client from `@/lib/db/prisma`; never instantiate Prisma directly elsewhere.
- Maintain the no N+1 rule by using `include`, `select`, and aggregations. See `lib/services/auctions.ts` and `lib/services/abuseReports.ts` for patterns.
- Keep all new business logic inside `lib/services/**` (or module-specific service files) and ensure naming mirrors the domain.
- Use `lib/utils/bigint.ts` when reading or serializing `BigInt` values; never cast to `number` without the safe guard.
- When introducing schema changes: add a Prisma migration, update DTOs/validations, and reflect the change in relevant docs.

## Validation & DTOs
- Define input validation with Zod under `lib/validations/**`. Every new API or form entry point should reference a schema before using data.
- Localized error messages should match the existing French tone; extend the `messages/<locale>.json` files if UI strings change.

## Real-time & Messaging
- Use the shared Pusher utilities (`lib/realtime/pusher.ts`) to publish or subscribe to channels. Always gate operations behind the environment checks provided there.
- Client hooks like `useRealtimeAuction`, `useMessagesRealtime`, `useMessageCounts` already handle fallbacks—extend them rather than creating new Pusher wiring from scratch.
- Message counts and similar cross-cutting concerns should go through context providers (`MessageCountsProvider`) to prevent duplicated state.

## UI, UX, and Localization
- Default language is French (`lang="fr"` in `app/layout.tsx`). Keep copy in French unless product direction changes; update translation files for new strings.
- Mantine styling is centralized. If a component needs new styling, rely on Mantine props or extend the theme rather than hard-coded CSS.
- For imagery, lean on the optimizers in `lib/utils/imageOptimization.ts` and the `next.config.ts` remotePatterns.

## Environment & Configuration
- Required environment variables are documented in `.env.example`. Ensure new features declare vars there and in relevant docs.
- Maintain security headers enforced in `middleware.ts` and `next.config.ts`. Add new headers via these centralized files.
- Production builds depend on `output: 'standalone'`; avoid config changes that break Docker/Vercel deploys without review.

## Testing & Quality Gates
- Minimum checks before handoff: `npm run type-check`, `npm run lint`, and (when applicable) targeted scripts under `scripts/` (`health-check`, `test-endpoints`, etc.).
- For higher-risk changes, run the relevant TSX scripts (e.g., real-time, dashboard, navigation) instead of writing ad-hoc tests.
- Health verification relies on `scripts/health-check.ts`; keep it passing by ensuring schemas, env vars, and generated clients are up to date.

## Documentation & Communication
- Update documentation whenever you alter architecture, data models, or workflows. Choose the closest doc (README, guides in `docs/`, audit reports) and summarize the change.
- Align commit messages with `COMMIT_GUIDE.md` (`type(scope): message`), grouping changes logically.
- If a change affects operational posture (security headers, rate limits, env requirements), document it in `PROJECT_STATUS.md` or a new doc as appropriate.

## Explicit Guardrails
- **Do not**: resurrect deprecated imports (`@/lib/prisma`, route-level auth configs), reintroduce `console.*`, fetch entire tables to count in memory, or sidestep role checks.
- **Do not**: scatter configuration/env lookups; route them through the existing helpers.
- **Do**: keep business logic centralized, follow the documented migration workflow, and expand validation schemas alongside new inputs.
- **Do**: respect BigInt handling, Mantine theming, and localization practices.

## Working Checklist
1. Read `.cursorrules` and relevant docs for the area you are touching.
2. Plan the change: identify the service, validation, API route, UI component, and docs affected.
3. Implement using the established helpers (services, contexts, utilities).
4. Update tests/scripts or add coverage where the risk profile changes.
5. Run type-check, lint, and targeted TSX scripts; address failures.
6. Update documentation and `.env.example` if needed.
7. Prepare commits following the guide; include rationale in messages.

Following these guardrails keeps the Bidinsouk repo aligned with its v2.0 systematic refactor and preserves the 98/100 quality baseline.
