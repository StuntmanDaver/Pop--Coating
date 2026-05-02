---
phase: 01-foundation
plan: "04"
subsystem: auth-infra
tags: [supabase-clients, auth-helpers, proxy, rate-limiting, sentry, multi-tenant]

dependency_graph:
  requires: [01-01, 01-02, 01-03]
  provides: [supabase-server-client, supabase-browser-client, supabase-admin-client, auth-helpers, proxy-routing, rate-limiters, sentry-init]
  affects: [01-05, 01-06]

tech_stack:
  added:
    - "@supabase/ssr — createServerClient (server/proxy), createBrowserClient (browser)"
    - "@upstash/ratelimit — sliding-window rate limiters (proxy + server action layers)"
    - "@upstash/redis — Upstash REST client backing rate limiters"
    - "@sentry/nextjs — error tracking init for client/server/edge runtimes"
  patterns:
    - "await cookies() from next/headers — Next.js 16 async cookies invariant"
    - "supabase.auth.getUser() exclusively — never getSession() for auth decisions"
    - "src/proxy.ts (NOT middleware.ts) — Next.js 16 multi-domain routing file"
    - "Host-scoped cookies — no domain attribute, @supabase/ssr default (RESEARCH.md Pitfall 2)"
    - "Env-var-driven redirect targets — NEXT_PUBLIC_APP_HOST / NEXT_PUBLIC_PORTAL_HOST"
    - "Defense-in-depth rate limiting — edge (proxy.ts) + server action (Plan 05) layers"
    - "ESLint suppression comments on every ! non-null assertion (Plan 01 error rule)"

key_files:
  created:
    - src/shared/db/server.ts
    - src/shared/db/client.ts
    - src/shared/db/admin.ts
    - src/shared/db/types.ts
    - src/shared/auth-helpers/require.ts
    - src/shared/auth-helpers/claims.ts
    - src/shared/audit/index.ts
    - src/shared/realtime/index.ts
    - src/shared/storage/index.ts
    - src/shared/rate-limit/index.ts
    - src/shared/rate-limit/adapter.ts
    - src/proxy.ts
    - instrumentation.ts
    - sentry.server.config.ts
    - sentry.client.config.ts
    - sentry.edge.config.ts
  modified:
    - .env.local.example

decisions:
  - "src/proxy.ts (NOT middleware.ts) confirmed — Next.js 16 rename per CLAUDE.md and DESIGN.md §102"
  - "getUser() exclusively for auth decisions — never getSession() (CLAUDE.md hidden invariant)"
  - "No cookie domain attribute — host-scoped defaults prevent cross-domain session leakage (RESEARCH.md Pitfall 2)"
  - "Env-var-driven redirect targets (NEXT_PUBLIC_APP_HOST/PORTAL_HOST) — no hardcoded prod literals in proxy logic"
  - "Two-layer rate limiting: edge (proxy.ts per-IP) + Server Action (Plan 05 per-email/compound)"
  - "src/shared/db/types.ts is a placeholder — replaced by supabase gen types in Plan 06"
  - "Sentry DSN env vars expected in Plan 06: SENTRY_DSN (server/edge), NEXT_PUBLIC_SENTRY_DSN (client)"

metrics:
  duration: "~20 minutes"
  completed: "2026-05-02"
  tasks_completed: 2
  tasks_total: 2
  files_created: 17
  files_modified: 1
---

# Phase 01 Plan 04: Application Infrastructure (Supabase Clients + Auth Helpers + Proxy + Rate Limiting + Sentry) Summary

Wired application-layer auth, database, rate-limiting, and observability infrastructure: Supabase clients (server/client/admin), auth helper guards (requireOfficeStaff/requireShopStaff/requireCustomer + getCurrentClaims), the Next.js 16 `src/proxy.ts` with multi-domain routing + session refresh + env-var-driven audience-domain enforcement + Upstash edge-layer rate limiting, and Sentry error tracking initialization for all three runtimes.

## One-liner

Application auth infrastructure: Supabase SSR clients with async cookies, three JWT audience guards using getUser()-only auth, src/proxy.ts multi-domain routing with Upstash sliding-window rate limiting at the edge, and Sentry init for client/server/edge runtimes.

## What Was Built

### Task 1: Supabase Clients, Auth Helpers, and Shared Stubs (commit 5fdff19)

**Supabase clients (`src/shared/db/`):**
- `server.ts` — async `createClient()` using `await cookies()` (Next.js 16 invariant), typed `SupabaseClient<Database>`
- `client.ts` — `createClient()` browser-side using `createBrowserClient<Database>`
- `admin.ts` — `createServiceClient()` with `SUPABASE_SERVICE_ROLE_KEY` (no NEXT_PUBLIC_ prefix), `autoRefreshToken: false`, `persistSession: false`. Import blocked by ESLint outside allowed modules.
- `types.ts` — Placeholder `Database` type; replaced by `supabase gen types typescript --local` in Plan 06

**Auth helpers (`src/shared/auth-helpers/`):**
- `require.ts` — Three guards: `requireOfficeStaff()`, `requireShopStaff()`, `requireCustomer()`. All call `supabase.auth.getUser()` exclusively. Unauthenticated requests redirected; wrong-audience requests throw.
- `claims.ts` — `getCurrentClaims()` returns typed `JWTClaims` from `user.app_metadata` after `getUser()` validates with auth server. Includes `tenant_id`, `audience`, `role`, optional `staff_id`, `workstation_id`, `company_id`, `customer_user_id`.

**Phase 1 stubs (`src/shared/`):**
- `audit/index.ts` — No-op `logAuditEvent()` stub; `withAudit()` HOF lands in Phase 4
- `realtime/index.ts` — Stub; full Realtime helpers in Phase 3
- `storage/index.ts` — Stub; full Storage upload helpers in Phase 3

**Every `!` non-null assertion** preceded by `// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- env vars validated at build` comment so `pnpm lint` exits 0 against the `'@typescript-eslint/no-non-null-assertion': 'error'` rule installed in Plan 01.

**Service-role gating verified:** Temporary test of importing `@/shared/db/admin` from `src/modules/scanning/` correctly errored with `'@/shared/db/admin' import is restricted from being used` — gating is live.

### Task 2: proxy.ts, Rate-Limit Infrastructure, .env.local.example, and Sentry (commit 19502d8)

**`src/proxy.ts`** (correctly named — NOT `middleware.ts`):
- Responsibility 1: Edge-layer Upstash sliding-window rate limiting on unauthenticated `/sign-in` POSTs (primary tier per RESEARCH.md Architectural Responsibility Map). Portal host uses `magicLinkPerIpLimiter`; office host uses `signInLimiter`. Returns HTTP 429 with JSON error when limit exceeded.
- Responsibility 2: Session refresh on every request via `createServerClient` + `setAll` cookie propagation.
- Responsibility 3: `supabase.auth.getUser()` exclusively — no `getSession()` anywhere.
- Responsibility 4: Audience-domain enforcement — office/shop JWT on `track.*` redirects to `APP_HOST`; customer JWT on `app.*` redirects to `PORTAL_HOST`. Both targets read from `process.env.NEXT_PUBLIC_APP_HOST` / `process.env.NEXT_PUBLIC_PORTAL_HOST` (default to `http://app.localhost:3000` / `http://track.localhost:3000` in dev). No hardcoded `app.popscoating.com` / `track.popscoating.com` literals in redirect logic.
- Responsibility 5: No `domain` attribute set on cookies — `@supabase/ssr` host-scoped defaults prevent cross-domain cookie leakage.

**Rate limiters (`src/shared/rate-limit/`):**
- `adapter.ts` — `@upstash/redis` Redis client reading `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- `index.ts` — Three limiters: `signInLimiter` (5/hr sliding window), `magicLinkPerEmailLimiter` (5/hr), `magicLinkPerIpLimiter` (10/hr). All use `Ratelimit.slidingWindow` with `analytics: true`. Consumed by both `src/proxy.ts` (edge) and Plan 05 Server Actions (secondary in-action layer).

**`.env.local.example`** — Added `NEXT_PUBLIC_APP_HOST`, `NEXT_PUBLIC_PORTAL_HOST` (localhost defaults), `NEXT_PUBLIC_SENTRY_DSN`.

**Sentry initialization:**
- `instrumentation.ts` — `register()` function branching on `NEXT_RUNTIME` to import server or edge config
- `sentry.server.config.ts` — `Sentry.init` with `SENTRY_DSN`, 0.1 sample rate, `VERCEL_ENV` environment tag
- `sentry.client.config.ts` — `Sentry.init` with `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_VERCEL_ENV`
- `sentry.edge.config.ts` — `Sentry.init` with `SENTRY_DSN`, `VERCEL_ENV`

Per-request `tenant_id` tagging happens via `Sentry.setTag('tenant_id', claims.tenant_id)` inside Server Actions (Plan 05+).

## Confirmations Required by Plan Output Spec

- **src/proxy.ts (NOT middleware.ts):** Confirmed — file is at `src/proxy.ts`. `test -f src/middleware.ts` returns false. `test -f middleware.ts` returns false.
- **No getSession() anywhere:** Confirmed — `grep -c "getSession" src/proxy.ts` = 0; `grep -c "getSession" src/shared/auth-helpers/require.ts` = 0; `grep -c "getSession" src/shared/db/server.ts` = 0.
- **No domain: '.popscoating.com' cookie option:** Confirmed — `grep -cE "domain:.*popscoating" src/proxy.ts` = 0.
- **Env-var-driven redirect targets:** Confirmed — proxy.ts reads `NEXT_PUBLIC_APP_HOST` and `NEXT_PUBLIC_PORTAL_HOST`; no hardcoded `'app.popscoating.com'` or `'track.popscoating.com'` literals in redirect logic.
- **Edge-layer Upstash rate limiting:** Confirmed — `signInLimiter` and `magicLinkPerIpLimiter` called in proxy.ts before routing; HTTP 429 returned on limit exceeded.
- **Every ! assertion has ESLint suppression comment:** Confirmed — `pnpm lint` exits 0; server.ts (2), client.ts (2), admin.ts (2), proxy.ts (2), adapter.ts (2) suppression comments.
- **Sentry DSN env vars:** `SENTRY_DSN` (server/edge), `NEXT_PUBLIC_SENTRY_DSN` (client) — to be configured in Plan 06 when Supabase Cloud + Vercel are wired.
- **types.ts placeholder:** `src/shared/db/types.ts` is a placeholder `Record<string, ...>` type. Real types generated in Plan 06 via `supabase gen types typescript --local > src/shared/db/types.ts`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `logAuditEvent()` no-op | `src/shared/audit/index.ts` | Intentional Phase 1 stub; `withAudit()` HOF lands in Phase 4 (OPS-01) |
| `realtimePlaceholder = true` | `src/shared/realtime/index.ts` | Intentional Phase 1 stub; Realtime subscription helpers land in Phase 3 (DASH-01) |
| `storagePlaceholder = true` | `src/shared/storage/index.ts` | Intentional Phase 1 stub; Storage upload/RLS helpers land in Phase 3 (SCAN-05) |
| `Database` generic Record type | `src/shared/db/types.ts` | Intentional placeholder; replaced by `supabase gen types typescript --local` in Plan 06 |

These stubs do not block Plan 04's goals — they exist to allow imports without compile errors while full implementations land in later phases.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All surface from this plan was already modeled in the plan's `<threat_model>`:
- T-01-04-01 through T-01-04-11 all mitigated (getUser-only, host-scoped cookies, env-var redirects, rate limiting at edge, service-role gating, no domain attribute).

## Self-Check: PASSED

- `src/shared/db/server.ts` — exists, contains `await cookies()`, 2 ESLint suppression comments
- `src/shared/db/client.ts` — exists, contains `createBrowserClient`, 2 ESLint suppression comments
- `src/shared/db/admin.ts` — exists, contains `SUPABASE_SERVICE_ROLE_KEY`, `autoRefreshToken: false`, `persistSession: false`, 2 ESLint suppression comments
- `src/shared/db/types.ts` — exists, contains `export type Database`
- `src/shared/auth-helpers/require.ts` — exists, 3 `export async function require*` functions, uses `getUser()` exclusively
- `src/shared/auth-helpers/claims.ts` — exists, exports `getCurrentClaims()` and `JWTClaims` type
- `src/shared/audit/index.ts`, `realtime/index.ts`, `storage/index.ts` — all exist as stubs
- `src/shared/rate-limit/index.ts` — exists, exports `signInLimiter`, `magicLinkPerEmailLimiter`, `magicLinkPerIpLimiter` with `Ratelimit.slidingWindow`
- `src/shared/rate-limit/adapter.ts` — exists, 2 ESLint suppression comments
- `src/proxy.ts` — exists, not `middleware.ts`, contains `getUser()`, `isPortal`, `isOffice`, `NEXT_PUBLIC_APP_HOST`, `NEXT_PUBLIC_PORTAL_HOST`, rate limiters, HTTP 429, 2 ESLint suppression comments, `config.matcher`
- `instrumentation.ts`, `sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts` — all exist with `Sentry.init`
- `.env.local.example` — contains `NEXT_PUBLIC_APP_HOST=http://app.localhost:3000` and `NEXT_PUBLIC_PORTAL_HOST=http://track.localhost:3000`
- Commits 5fdff19 (Task 1) and 19502d8 (Task 2) verified in git log
- `pnpm type-check` exits 0
- `pnpm lint` exits 0
