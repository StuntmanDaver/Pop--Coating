# Phase 1: Foundation - Research

**Researched:** 2026-05-01
**Domain:** Next.js 16 App Router scaffold, Supabase multi-tenant schema + RLS, three-audience auth (office/shop/customer), CI pipeline
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Supabase Auth routes ALL its own emails (magic links, staff invites, password resets) through Resend SMTP — not Supabase's built-in email service. Configure Supabase Auth SMTP settings to point to Resend in Phase 1.
- **D-02:** From address for all auth emails: `noreply@popsindustrial.com`. SPF/DKIM/DMARC verified via Resend for this address.
- **D-03:** Single Resend API key for all environments (local dev, preview, production). No test-mode/live-mode split. RESEND_API_KEY in `.env.local` and Vercel environment variables.
- **D-04:** Phase 1 delivers three layers for workstation auth: (1) DB schema for `workstations` table, (2) SECURITY DEFINER functions `app.claim_workstation()`, `app.record_workstation_heartbeat()`, `app.release_workstation()`, (3) `createWorkstation` server action in `src/modules/settings/`. The tablet-side ceremony UI is Phase 3.
- **D-05:** Workstation session refresh: silent via `@supabase/ssr`.
- **D-06:** PIN idle timeout (4-hour idle per shift) is Phase 3 — not Phase 1 infrastructure.
- **D-07:** Supabase branch databases for every PR. Each PR gets an isolated Supabase branch DB with migrations applied. Tests in CI run against real Supabase infrastructure.
- **D-08:** Required CI merge gates: `pnpm type-check`, `pnpm lint` (+ `madge --circular src/modules`), `pnpm test` (Vitest), pgTAP RLS test suite.
- **D-09:** No Playwright E2E in Phase 1 CI.
- **D-10:** `scripts/seed-tenant.ts` is written AND run as part of Phase 1 deliverables.
- **D-11:** First admin credentials: `seed-tenant.ts` calls `auth.admin.inviteUserByEmail(owner_email)`.
- **D-12:** `supabase/seed.sql` uses fixed known UUID for test tenant.

### Claude's Discretion

None — all gray areas were answered explicitly in CONTEXT.md.

### Deferred Ideas (OUT OF SCOPE)

None declared.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | Next.js 16 App Router repo with TypeScript strict, Tailwind v4, shadcn/ui, pnpm | §Standard Stack covers versions, CSS-first config, CLI init commands |
| INFRA-02 | Supabase project + Vercel project with `app.popsindustrial.com` and `track.popsindustrial.com` domains | §Architecture Patterns covers project linking, domain config |
| INFRA-03 | `tenants` table + `tenant_id` on every business table + `app.tenant_id()` SECURITY DEFINER helper + RLS | §Architecture Patterns covers full SQL from DESIGN.md §3.2–3.3 |
| INFRA-04 | Resend SMTP + Upstash Redis rate limiting + Sentry | §Standard Stack covers all three libraries and init patterns |
| INFRA-05 | `src/proxy.ts` multi-domain routing (`app.*` → office, `track.*` → portal) | §Architecture Patterns covers the file rename and routing pattern |
| INFRA-06 | All SQL SECURITY DEFINER helpers: `app.tenant_id()`, `app.audience()`, `app.role()`, `app.staff_id()`, `app.workstation_id()`, `app.company_id()`, `app.set_updated_at()` | §Code Examples reproduces the exact SQL from DESIGN.md §3.2 |
| INFRA-07 | ESLint rules for module boundaries + service-role gating; CI pipeline | §Architecture Patterns covers `eslint.config.js` pattern and GitHub Actions CI |
| AUTH-01 | Office staff email+password sign-in; 30-day session; `@supabase/ssr` cookies; always `getUser()` | §Architecture Patterns covers `@supabase/ssr` server client pattern |
| AUTH-02 | Workstation synthetic user enrollment; 1-hour session TTL; `createWorkstation` server action | §Architecture Patterns covers the full `createWorkstation` flow from DESIGN.md §4.3 |
| AUTH-03 | Customer magic-link auth scoped to `track.*`; 30-day session | §Architecture Patterns covers `signInWithOtp` and magic-link callback pattern |
| AUTH-04 | JWT `app_metadata` with `tenant_id`, `audience`, `role`; `custom_access_token_hook`; hook must not write to tables | §Code Examples reproduces the full hook SQL from DESIGN.md §5.2 |
| AUTH-05 | `requireOfficeStaff()`, `requireShopStaff()`, `requireCustomer()` in `src/shared/auth-helpers/require.ts`; `getCurrentClaims()` | §Architecture Patterns covers the helper implementations |
</phase_requirements>

---

## Summary

Phase 1 is a pure infrastructure and auth foundation — no UI beyond a sign-in page stub. The deliverable is a working Next.js 16 repo that any subsequent phase can extend without revisiting foundational decisions. All architectural decisions are locked in `docs/DESIGN.md` and `CONTEXT.md`; this research confirms those decisions against current library documentation and identifies the specific pitfalls that create silent failures.

The three highest-risk implementation areas are: (1) the `app.custom_access_token_hook` — it reads from three tables but must never write (Supabase Issue #29073 deadlock); (2) `src/proxy.ts` host-detection logic — getting cookie scoping wrong causes cross-domain session leakage; and (3) migration ordering for the cross-table email uniqueness trigger — the `staff` and `customer_users` triggers both reference the other table, so both tables must be created before either trigger is installed.

**Primary recommendation:** Follow `docs/DESIGN.md` as literal implementation instructions — the SQL functions, RLS patterns, and `createWorkstation` flow are already written to production-quality detail. The job of Phase 1 implementers is faithful transcription, not design.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Multi-domain routing (host detection) | Frontend Server (Next.js proxy.ts) | — | `src/proxy.ts` inspects `Host` header before any route group is resolved; this is the only place host-to-audience mapping lives |
| Auth cookie storage (all audiences) | Frontend Server (`@supabase/ssr`) | — | Cookies are httpOnly, host-scoped; the SSR client handles refresh tokens on every request via proxy.ts |
| JWT claim injection (`tenant_id`, `audience`, `role`) | Database (Auth Hook) | — | `app.custom_access_token_hook` runs inside Supabase Auth before the JWT is issued; no app-layer equivalent is safe |
| Row-level tenant isolation | Database (RLS + `app.tenant_id()`) | — | Every authenticated query is filtered at the Postgres level; application layer is defense-in-depth only |
| Workstation enrollment (synthetic user creation) | API / Backend (Server Action) | Database (SECURITY DEFINER) | `createWorkstation` server action calls `auth.admin.createUser` via service-role; `app.claim_workstation()` handles the per-scan-event tablet-level logic |
| Office staff sign-in flow | Frontend Server (Server Action) | Browser (form) | Password is never passed through the browser to a custom endpoint; Supabase client handles sign-in inside the Server Action |
| Customer magic-link flow | API / Backend (Server Action) | — | `signInWithOtp` is called from a server action; customer never touches an API key |
| Rate limiting | Frontend Server (proxy.ts) | API / Backend (Server Action) | `@upstash/ratelimit` is checked in `src/proxy.ts` before routing reaches any page or action (defense-in-depth on unauthenticated sign-in / magic-link requests); Server Action limiters in `src/shared/rate-limit/` provide a secondary in-action layer for fine-grained per-email quotas |
| Tenant seed (bootstrap) | — (CLI script) | Database | `scripts/seed-tenant.ts` runs as a one-off script with the service-role client; not a web request |
| Test isolation (pgTAP) | Database | CI (GitHub Actions) | RLS tests run against the real Supabase branch DB; no mocking — the actual `set_config('request.jwt.claims', ...)` pattern is used |

---

## Standard Stack

### Core Libraries

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.4 | App Router, `src/proxy.ts`, Server Actions, RSC | Locked stack choice; file is `proxy.ts` not `middleware.ts` in Next.js 16 |
| typescript | 6.0.3 | Strict type safety | `"strict": true` required by CLAUDE.md |
| tailwindcss | 4.2.4 | CSS-first utility framework | CSS-first config in `app/globals.css`; no `tailwind.config.ts` |
| @supabase/ssr | 0.10.2 | Server-side Supabase client with cookie management | Required for httpOnly session cookies in Next.js App Router |
| @supabase/supabase-js | 2.105.1 | Browser Supabase client | Standard client for browser-side subscriptions and client-only operations |
| zod | 4.4.2 | Schema validation | Required on every Server Action input/output (DESIGN.md §4.5) |
| next-intl | 4.11.0 | i18n infrastructure | English-only Wave 1; infrastructure in place from Day 1 per CLAUDE.md |

### CI and Testing

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.1.5 | Unit tests (Server Actions, helpers, validators) | All TypeScript unit tests; replaces Jest |
| @typescript-eslint/eslint-plugin | 8.59.1 | TypeScript ESLint rules | Enforces `no-any`, strict mode compliance |
| eslint-config-next | 16.2.4 | Next.js ESLint rules | Bundled with Next.js; activate in `eslint.config.js` |
| eslint | 10.3.0 | Lint runner (flat config v10) | Flat config format (`eslint.config.js`, not `.eslintrc`) |
| madge | 8.0.0 | Circular dependency detection | Runs in CI: `madge --circular src/modules` |

### Infrastructure

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @upstash/ratelimit | 2.0.8 | Sliding-window rate limiting | Sign-in, magic-link, scanner rate gates in `proxy.ts` |
| @upstash/redis | 1.37.0 | Upstash Redis client | Backing store for `@upstash/ratelimit` |
| @sentry/nextjs | 10.51.0 | Error tracking | Every event tagged `tenant_id`; initialized in `instrumentation.ts` |
| resend | 6.12.2 | Transactional email SDK | App-initiated emails (Wave 2+); Supabase uses it via SMTP in Phase 1 |

**Version verification:** All versions above confirmed via `npm view <package> version` on 2026-05-01. [VERIFIED: npm registry]

**Installation (initial scaffold):**
```bash
pnpm create next-app@16 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
pnpm add @supabase/ssr @supabase/supabase-js
pnpm add next-intl zod
pnpm add @upstash/ratelimit @upstash/redis
pnpm add @sentry/nextjs
pnpm add resend
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom
pnpm add -D madge @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

---

## Architecture Patterns

### System Architecture Diagram

```
Browser / iPad
     │
     │ HTTPS request (Host: app.popsindustrial.com or track.popsindustrial.com)
     ▼
┌──────────────────────────────────────────────────────────┐
│  Vercel Edge — src/proxy.ts                              │
│  1. Read Host header                                     │
│  2. Rate limit check (Upstash Redis)                     │
│  3. Refresh Supabase session (getUser)                   │
│  4. Rewrite:                                             │
│     app.*    → src/app/(office)/**                       │
│     track.*  → src/app/(portal)/**                       │
│     /scan    → src/app/scan/**   (no rewrite needed)     │
└───────────┬──────────────────┬───────────────────────────┘
            │                  │
    ┌───────▼──────┐   ┌───────▼──────┐
    │  (office)    │   │  (portal)    │
    │  Sign-in     │   │  Magic-link  │
    │  Dashboard   │   │  Job list    │
    │  Settings    │   │  Job detail  │
    └──────┬───────┘   └──────┬───────┘
           │                  │
           │ Server Actions (service-role restricted to auth/settings/portal/audit)
           │ Regular Supabase client (RLS applies to all other modules)
           ▼
┌──────────────────────────────────────────────────────────┐
│  Supabase (Pro)                                          │
│                                                          │
│  Auth ──► custom_access_token_hook                       │
│           │  reads: staff, customer_users, workstations  │
│           │  writes: NEVER (deadlock constraint)         │
│           │  stamps: tenant_id, audience, role into JWT  │
│           ▼                                              │
│  Postgres (RLS on every business table)                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │ app.tenant_id()  ← reads JWT app_metadata        │   │
│  │ All SELECT/INSERT/UPDATE filtered by tenant_id   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  After INSERT on auth.users:                             │
│    link_auth_user_to_actor() trigger                     │
│    (matches by email + tenant_id from app_metadata)      │
└──────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── app/
│   ├── (office)/            # Staff-facing (app.popsindustrial.com)
│   │   ├── layout.tsx
│   │   ├── page.tsx         # Dashboard stub (Phase 1: redirect to /sign-in)
│   │   └── sign-in/
│   │       └── page.tsx
│   ├── scan/                # Shop floor (NOT a route group — explicit /scan URL)
│   │   └── page.tsx         # Stub (Phase 3)
│   ├── (portal)/            # Customer-facing (track.popsindustrial.com)
│   │   ├── layout.tsx
│   │   ├── page.tsx         # Stub (Phase 4)
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts
│   └── api/
│       └── webhooks/        # Resend webhook receiver (stub for Phase 1)
├── modules/
│   ├── auth/
│   │   ├── index.ts         # Public API only
│   │   ├── actions/
│   │   │   ├── sign-in.ts
│   │   │   ├── sign-out.ts
│   │   │   └── magic-link.ts
│   │   └── types.ts
│   └── settings/
│       ├── index.ts
│       └── actions/
│           └── workstation.ts  # createWorkstation (Phase 1 deliverable)
├── shared/
│   ├── auth-helpers/
│   │   ├── require.ts       # requireOfficeStaff, requireShopStaff, requireCustomer
│   │   └── claims.ts        # getCurrentClaims()
│   ├── db/
│   │   ├── server.ts        # createClient() — async, uses await cookies()
│   │   ├── client.ts        # createBrowserClient()
│   │   ├── admin.ts         # createServiceClient() — import-restricted
│   │   └── types.ts         # generated by supabase gen types typescript
│   ├── rate-limit/
│   │   ├── index.ts         # signInLimiter, magicLinkLimiter
│   │   └── adapter.ts       # @upstash/ratelimit + @upstash/redis
│   ├── audit/               # stub for Phase 1; withAudit() HOF in Phase 4
│   ├── realtime/            # stub for Phase 3
│   ├── storage/             # stub for Phase 3
│   └── ui/                  # shadcn components
├── messages/
│   └── en/
│       ├── common.json
│       └── auth.json
├── i18n.ts                  # next-intl config
└── proxy.ts                 # Multi-domain + session refresh + rate limiting
supabase/
├── migrations/
│   ├── 0001_app_schema_helpers.sql
│   ├── 0002_tenants_and_domains.sql
│   ├── 0003_auth_tables.sql
│   ├── 0004_crm_tables.sql       # companies, contacts (needed for seed.sql)
│   ├── 0005_jobs_tables.sql      # jobs (needed for seed.sql visual testing)
│   ├── 0006_rls_policies.sql
│   ├── 0007_auth_hook.sql
│   └── 0008_production_status_revoke.sql
├── seed.sql                 # Local dev fixtures (fixed UUID test tenant, D-12)
└── tests/
    └── rls/
        ├── test_cross_tenant_isolation.sql
        ├── test_audience_isolation.sql
        └── test_function_authorization.sql
scripts/
└── seed-tenant.ts           # Programmatic tenant bootstrap (D-10)
.github/
└── workflows/
    └── ci.yml
```

### Pattern 1: Supabase Server Client (Next.js App Router)

The client must be created fresh per-request, with `await cookies()` from `next/headers`.

```typescript
// src/shared/db/server.ts
// Source: Context7 /supabase/ssr + DESIGN.md §4.4
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()   // MUST be awaited in Next.js 16

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component context — mutations ignored; only proxy.ts mutates
          }
        },
      },
    }
  )
}
```

### Pattern 2: proxy.ts — Multi-Domain Session Refresh + Rate Limiting

```typescript
// src/proxy.ts
// Source: DESIGN.md §102, DESIGN.md §3294, Context7 /supabase/ssr
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const isOffice = host.startsWith('app.')
  const isPortal = host.startsWith('track.')

  let response = NextResponse.next({ request })

  // Supabase session refresh — must happen in proxy for every request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: always getUser() — never getSession() for auth decisions
  const { data: { user } } = await supabase.auth.getUser()

  // Audience-domain enforcement (office JWT on track.* = redirect)
  if (user) {
    const audience = user.app_metadata?.audience
    if (isPortal && audience !== 'customer') {
      return NextResponse.redirect(new URL('https://app.popsindustrial.com', request.url))
    }
    if (isOffice && audience === 'customer') {
      return NextResponse.redirect(new URL('https://track.popsindustrial.com', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 3: Auth Helper Guards

```typescript
// src/shared/auth-helpers/require.ts
// Source: DESIGN.md §4.4
import { createClient } from '@/shared/db/server'
import { redirect } from 'next/navigation'

export async function requireOfficeStaff() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) redirect('/sign-in')

  const audience = user.app_metadata?.audience
  if (audience !== 'staff_office') {
    throw new Error('Access denied: office staff only')
  }
  return user
}

export async function requireShopStaff() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/scan')
  if (user.app_metadata?.audience !== 'staff_shop') throw new Error('Access denied')
  return user
}

export async function requireCustomer() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/sign-in')
  if (user.app_metadata?.audience !== 'customer') throw new Error('Access denied')
  return user
}

// src/shared/auth-helpers/claims.ts
export async function getCurrentClaims() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return {
    tenant_id: user.app_metadata.tenant_id as string,
    audience: user.app_metadata.audience as string,
    role: user.app_metadata.role as string,
    staff_id: user.app_metadata.staff_id as string | undefined,
    workstation_id: user.app_metadata.workstation_id as string | undefined,
    company_id: user.app_metadata.company_id as string | undefined,
  }
}
```

### Pattern 4: RLS Policy Template

```sql
-- Source: DESIGN.md §5.7
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

-- Staff (office or shop) see all in tenant
CREATE POLICY <table>_staff_select ON <table> FOR SELECT
  USING (tenant_id = app.tenant_id()
         AND app.audience() IN ('staff_office', 'staff_shop'));

-- Customer (table-specific filter applied per DESIGN.md §5.7 table)
CREATE POLICY <table>_customer_select ON <table> FOR SELECT
  USING (tenant_id = app.tenant_id()
         AND app.audience() = 'customer'
         AND <table-specific condition>);

-- Office mutations only
CREATE POLICY <table>_office_insert ON <table> FOR INSERT
  WITH CHECK (tenant_id = app.tenant_id()
              AND app.audience() = 'staff_office');

CREATE POLICY <table>_office_update ON <table> FOR UPDATE
  USING (tenant_id = app.tenant_id() AND app.audience() = 'staff_office')
  WITH CHECK (tenant_id = app.tenant_id());

-- No DELETE policies for authenticated users (hard deletes forbidden)
```

### Pattern 5: ESLint Flat Config (module boundaries)

```javascript
// eslint.config.js
// Source: DESIGN.md §2.4
import nextPlugin from 'eslint-config-next'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

const config = [
  ...nextPlugin,
  {
    // Module boundary: deep imports forbidden — must import from index.ts
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/modules/*/!(index)*'],
          message: 'Import from module index.ts only'
        }]
      }]
    }
  },
  {
    // Service-role client: restricted to allowed modules only
    files: [
      'src/modules/!(settings|portal|auth)/**',
      'src/shared/!(audit)/**'
    ],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{
          name: '@/shared/db/admin',
          message: 'service-role import not allowed in this module'
        }]
      }]
    }
  }
]

export default config
```

### Pattern 6: GitHub Actions CI

```yaml
# .github/workflows/ci.yml
# Source: DESIGN.md §9.1 + Supabase branch DB docs
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  type-check-lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 25, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm type-check
      - run: pnpm lint
      - run: pnpx madge --circular src/modules
      - run: pnpm test

  rls-tests:
    runs-on: ubuntu-latest
    needs: type-check-lint-test
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with: { version: latest }
      # D-07: wait for Supabase branch DB from PR (Supabase GitHub App must be installed)
      - uses: fountainhead/action-wait-for-check@v1.2.0
        with:
          checkName: Supabase Preview
          token: ${{ secrets.GITHUB_TOKEN }}
      - name: Run pgTAP RLS suite against branch DB
        run: |
          SUPABASE_DB_URL=$(supabase branches get --project-ref ${{ vars.SUPABASE_PROJECT_REF }} --format json | jq -r '.db_url')
          supabase test db --db-url "$SUPABASE_DB_URL"
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### Anti-Patterns to Avoid

- **`getSession()` for auth decisions:** Never use — can return stale/forged data. Always `getUser()`. [CITED: DESIGN.md §102]
- **Synchronous `cookies()` call:** `cookies()` is async in Next.js 16 — `await cookies()` required. [VERIFIED: Context7 /vercel/next.js]
- **Writing in `custom_access_token_hook`:** The hook runs in a Supabase internal transaction. Any `UPDATE`/`INSERT` from inside the hook causes a deadlock (Supabase Issue #29073). Hook must be `STABLE` (no writes). [CITED: DESIGN.md §3.2]
- **`middleware.ts` filename:** Next.js 16 renamed this to `proxy.ts`. The old filename produces a warning; the new name is what the `config` export is read from. [CITED: DESIGN.md §102]
- **`tenant_id` from a parameter in SECURITY DEFINER functions:** All SECURITY DEFINER functions must read `tenant_id` from `app.tenant_id()` (JWT claim), never from a caller-supplied parameter. Callers are untrusted. [CITED: DESIGN.md §3.2]
- **Inline JWT parsing in RLS policies:** Use `app.tenant_id()` SECURITY DEFINER helper — never inline `current_setting('request.jwt.claims', ...)::jsonb -> 'app_metadata' ->> 'tenant_id'` in policies. Repeated inline parsing is slower and error-prone. [CITED: DESIGN.md §3.2]
- **Installing triggers before both tables exist:** `app.assert_email_unique_across_actor_tables()` references both `staff` and `customer_users`. Postgres parses function bodies lazily, but the trigger will fail at runtime if `customer_users` doesn't exist yet. Migration ordering: create both tables first, then the function, then both triggers. [CITED: DESIGN.md §3.3]
- **Tailwind v4 with a `tailwind.config.ts` file:** Tailwind v4 uses CSS-first configuration. All tokens go in `app/globals.css` under `@theme {}`. A `tailwind.config.ts` is not used and will cause confusion. [VERIFIED: Context7 /tailwindlabs/tailwindcss.com]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Server-side session cookie management | Custom cookie serialization/deserialization | `@supabase/ssr` `createServerClient` | Handles httpOnly, secure, sameSite, refresh token rotation automatically |
| JWT claims parsing | `jwt.decode()` inline in every route | `supabase.auth.getUser()` + `user.app_metadata` | `getUser()` validates with auth server; decode-only is forgeable |
| Rate limiting | In-memory counter in a serverless function | `@upstash/ratelimit` sliding-window | Serverless functions are stateless; in-memory counts reset per cold start |
| Cross-module circular dependency detection | Manual audits | `madge --circular src/modules` in CI | Automated; catches transitive cycles, not just direct ones |
| Tenant isolation at the application layer | `WHERE tenant_id = $currentTenantId` in every query | RLS + `app.tenant_id()` | A missed WHERE clause leaks cross-tenant data; RLS is enforced even if the application bug exists |
| Email delivery | SMTP relay written from scratch | Resend via Supabase SMTP config | SPF/DKIM/DMARC, deliverability, bounce handling, templates |
| TypeScript types for Supabase schema | Manually written interfaces | `supabase gen types typescript --local > src/shared/db/types.ts` | Auto-generated from actual schema; always in sync |

---

## Runtime State Inventory

Not applicable — this is a greenfield phase. No existing runtime state to inventory.

---

## Common Pitfalls

### Pitfall 1: Auth Hook Deadlock (Silent Production Failure)

**What goes wrong:** The `custom_access_token_hook` function issues an `INSERT` or `UPDATE` inside its body. Every sign-in hangs indefinitely or returns a 500 to the client with no clear error message.

**Why it happens:** Supabase Auth runs the hook synchronously within an internal transaction that holds a lock on `auth.users`. Any write to `public.*` tables from inside the hook tries to acquire its own lock — the two transactions deadlock. (Supabase Issue #29073)

**How to avoid:** Mark the hook `STABLE` in its `CREATE OR REPLACE FUNCTION` declaration. The function should only `SELECT` from `staff`, `customer_users`, and `workstations`. All user-row linking happens in a separate `AFTER INSERT ON auth.users` trigger (`app.link_auth_user_to_actor`).

**Warning signs:** Sign-in requests that never return; Supabase Auth logs showing "context deadline exceeded"; error messages referencing deadlock or lock timeout.

---

### Pitfall 2: Cross-Domain Cookie Leakage

**What goes wrong:** A customer who signs in on `track.popsindustrial.com` can also authenticate on `app.popsindustrial.com` because the cookie's `Domain` attribute is set to `.popsindustrial.com` instead of the exact host.

**Why it happens:** `@supabase/ssr` defaults to host-scoped cookies (no `Domain` attribute), but developers sometimes override cookie options thinking they need to "share" the session. The two subdomains use separate Supabase clients — their cookies should never cross.

**How to avoid:** Never set `domain: '.popsindustrial.com'` in cookie options. Let `@supabase/ssr` use its default host-scoped behavior. `proxy.ts` enforces audience-domain separation for any JWT that slips through (office JWT on `track.*` → redirect).

**Warning signs:** `getUser()` in a portal page returns a `staff_office` user; tests that simulate customer auth pass on office routes.

---

### Pitfall 3: Migration Ordering for Cross-Table Trigger

**What goes wrong:** `supabase db reset` or a CI branch DB migration fails with `relation "customer_users" does not exist` when the `staff` table's trigger fires during seed.

**Why it happens:** `app.assert_email_unique_across_actor_tables()` references `customer_users` in its body. Postgres lazily parses function bodies, so the function creation succeeds even if `customer_users` doesn't exist yet. But the trigger fires on the first `INSERT INTO staff` — and at that moment, if `customer_users` hasn't been created by a prior migration, the function body fails at runtime.

**How to avoid:** In a single migration file (or the first migration that creates both tables), order strictly: (1) CREATE TABLE staff, (2) CREATE TABLE customer_users, (3) CREATE OR REPLACE FUNCTION app.assert_email_unique_across_actor_tables(), (4) CREATE TRIGGER on staff, (5) CREATE TRIGGER on customer_users.

**Warning signs:** Migration succeeds but seed.sql fails; `supabase db reset` errors only appear when inserting the first staff row.

---

### Pitfall 4: `supabase_auth_admin` Role Modification

**What goes wrong:** A migration accidentally revokes `BYPASSRLS` from `supabase_auth_admin`. The custom access token hook can no longer read `staff`, `customer_users`, or `workstations` (which have RLS enabled), causing every sign-in to return 403 "Account not provisioned."

**Why it happens:** The hook runs as `supabase_auth_admin`. With `BYPASSRLS`, it skips RLS and can SELECT from any table. Without `BYPASSRLS`, RLS applies, and the hook's `SELECT FROM staff WHERE auth_user_id = v_user_id` returns no rows (because the hook has no JWT to satisfy the RLS policy).

**How to avoid:** Never include `ALTER ROLE supabase_auth_admin ...` in any migration. The grants in `docs/DESIGN.md §5.2` are additive (`GRANT SELECT ON staff, customer_users, workstations TO supabase_auth_admin`) and do not touch role attributes.

**Warning signs:** All sign-ins return 403; Supabase Auth logs show the hook returning `{error: {http_code: 403, message: "Account not provisioned"}}` for every user including existing seeded users.

---

### Pitfall 5: `invite_staff` Without `app_metadata.tenant_id`

**What goes wrong:** `link_auth_user_to_actor` trigger fires on the new auth.users row and cannot safely link it to a `staff` row — it raises `auth_user_created_without_tenant_id`.

**Why it happens:** `auth.admin.inviteUserByEmail` is called without passing `app_metadata: { tenant_id, intended_actor }`. The trigger enforces this via `RAISE EXCEPTION`.

**How to avoid:** In `scripts/seed-tenant.ts` and the `inviteStaff` server action, always call `auth.admin.updateUserById(userId, { app_metadata: { tenant_id, intended_actor: 'staff' } })` after `inviteUserByEmail` — or use a Supabase Management API call that allows setting app_metadata at invite time.

**Warning signs:** Staff invite email arrives but clicking it shows "There was a problem activating your account"; Supabase Postgres logs show the `auth_user_created_without_tenant_id` exception.

---

### Pitfall 6: Workstation Session Not Refreshing (Stolen Tablet)

**What goes wrong:** The workstation tablet session expires after 1 hour and the shop floor loses access. Or, the session never expires when a tablet is stolen.

**Why it happens:** The 1-hour TTL requires setting `jwtExpiryLimit` in the Supabase project Auth settings. This is a project-level setting, not per-user. The "silent refresh" behavior requires `@supabase/ssr`'s auto-refresh to be active in the `proxy.ts` flow. If proxy.ts doesn't run the Supabase client on every request (e.g., a misconfigured `matcher`), sessions go stale.

**How to avoid:** Set the Supabase project Auth → JWT Expiry to 3600 seconds. Ensure `proxy.ts`'s `matcher` covers all routes (not just API routes). The workstation session refresh is automatic via `@supabase/ssr` — no custom logic needed.

**Warning signs:** Tablets show session-expired errors exactly 1 hour after enrollment; other audiences also expire in 1 hour (wrong — only workstations should have 1-hour TTL, but since it's project-wide, the "30-day" for office is via refresh token, not expiry).

> **[A1 RESOLVED]** Supabase's JWT expiry is project-wide, not per-user. Setting it to 3600 seconds (1 hour) is the correct project-wide setting that satisfies AUTH-02's stolen-tablet mitigation for workstations. Office and customer sessions get effective 30-day "felt sessions" via refresh-token rotation: the short JWT expiry is transparent to them because `@supabase/ssr` (configured in Plan 04 `src/proxy.ts`) silently exchanges expired JWTs for new ones using the long-lived refresh token. No application changes are required to differentiate audiences. The 30-day vs 1-hour distinction is achieved entirely through refresh-token longevity at the Supabase project level — no per-user / per-session override is needed. Plan 06 Task 2 (manual checkpoint) configures JWT Expiry = 3600s in Supabase Dashboard → Authentication → Settings, and Plan 06 Task 4 verifies it via `supabase inspect db config | grep jwt_expiry`.

---

### Pitfall 7: Tailwind v4 CSS Variable Integration with shadcn/ui

**What goes wrong:** `pnpm dlx shadcn@latest init` generates a `tailwind.config.ts` (shadcn's default) which conflicts with Tailwind v4's CSS-first setup.

**Why it happens:** shadcn/ui's CLI has Tailwind v4 support but requires passing the correct flag. Without it, the generated config tries to use `tailwind.config.ts` patterns that do not apply in v4.

**How to avoid:** Run `pnpm dlx shadcn@latest init --tailwind-v4` (or check the current CLI flags — the exact flag name may vary). Verify that `components.json` points `tailwind.css` to `app/globals.css` and `tailwind.config` is empty. CSS variables for shadcn themes go in `@layer base {}` inside `globals.css` under `@theme {}`.

**Warning signs:** Component classes like `bg-background` or `text-foreground` don't apply; `npx tailwindcss --help` shows config errors; the component renders unstyled.

---

## Code Examples

### SQL: Helper Functions (`app` schema)

```sql
-- Source: DESIGN.md §3.2
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.tenant_id() RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'tenant_id', ''
  )::uuid;
$$;

CREATE OR REPLACE FUNCTION app.audience() RETURNS TEXT
LANGUAGE sql STABLE AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb
    -> 'app_metadata' ->> 'audience';
$$;

CREATE OR REPLACE FUNCTION app.role() RETURNS TEXT
LANGUAGE sql STABLE AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb
    -> 'app_metadata' ->> 'role';
$$;

CREATE OR REPLACE FUNCTION app.staff_id() RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'staff_id', ''
  )::uuid;
$$;

CREATE OR REPLACE FUNCTION app.workstation_id() RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'workstation_id', ''
  )::uuid;
$$;

CREATE OR REPLACE FUNCTION app.company_id() RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'company_id', ''
  )::uuid;
$$;

CREATE OR REPLACE FUNCTION app.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
-- Apply per table: CREATE TRIGGER set_updated_at BEFORE UPDATE ON <table>
--   FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();
```

### SQL: `custom_access_token_hook` (full implementation)

```sql
-- Source: DESIGN.md §5.2
-- CRITICAL: STABLE = no writes. Any write causes deadlock (Supabase #29073).
CREATE OR REPLACE FUNCTION app.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_user_id UUID := (event ->> 'user_id')::uuid;
  v_email TEXT;
  v_claims jsonb := event -> 'claims';
  v_app_meta jsonb;
  v_staff record; v_customer record; v_workstation record;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  SELECT id, tenant_id, role, is_active INTO v_staff
    FROM staff
    WHERE auth_user_id = v_user_id
       OR (auth_user_id IS NULL AND email = v_email)
    ORDER BY (auth_user_id IS NOT NULL) DESC, created_at ASC
    LIMIT 1;

  IF v_staff.id IS NOT NULL THEN
    IF NOT v_staff.is_active THEN
      RETURN jsonb_build_object('error',
        jsonb_build_object('http_code', 403, 'message', 'Account inactive'));
    END IF;
    v_app_meta := jsonb_build_object(
      'tenant_id', v_staff.tenant_id,
      'audience', CASE WHEN v_staff.role = 'shop' THEN 'staff_shop' ELSE 'staff_office' END,
      'role', v_staff.role,
      'staff_id', v_staff.id
    );
    v_claims := jsonb_set(v_claims, '{app_metadata}',
                          COALESCE(v_claims -> 'app_metadata', '{}'::jsonb) || v_app_meta);
    RETURN jsonb_build_object('claims', v_claims);
  END IF;

  SELECT id, tenant_id INTO v_workstation
    FROM workstations
    WHERE auth_user_id = v_user_id AND is_active = true
    LIMIT 1;

  IF v_workstation.id IS NOT NULL THEN
    v_app_meta := jsonb_build_object(
      'tenant_id', v_workstation.tenant_id,
      'audience', 'staff_shop',
      'role', 'shop',
      'workstation_id', v_workstation.id
    );
    v_claims := jsonb_set(v_claims, '{app_metadata}',
                          COALESCE(v_claims -> 'app_metadata', '{}'::jsonb) || v_app_meta);
    RETURN jsonb_build_object('claims', v_claims);
  END IF;

  SELECT id, tenant_id, company_id, is_active INTO v_customer
    FROM customer_users
    WHERE auth_user_id = v_user_id
       OR (auth_user_id IS NULL AND email = v_email)
    ORDER BY (auth_user_id IS NOT NULL) DESC, created_at ASC
    LIMIT 1;

  IF v_customer.id IS NOT NULL THEN
    IF NOT v_customer.is_active THEN
      RETURN jsonb_build_object('error',
        jsonb_build_object('http_code', 403, 'message', 'Account inactive'));
    END IF;
    v_app_meta := jsonb_build_object(
      'tenant_id', v_customer.tenant_id,
      'audience', 'customer',
      'company_id', v_customer.company_id,
      'customer_user_id', v_customer.id
    );
    v_claims := jsonb_set(v_claims, '{app_metadata}',
                          COALESCE(v_claims -> 'app_metadata', '{}'::jsonb) || v_app_meta);
    RETURN jsonb_build_object('claims', v_claims);
  END IF;

  RETURN jsonb_build_object('error',
    jsonb_build_object('http_code', 403, 'message', 'Account not provisioned'));
END;
$$;

GRANT EXECUTE ON FUNCTION app.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION app.custom_access_token_hook FROM authenticated, anon, public;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON staff, customer_users, workstations TO supabase_auth_admin;
```

### SQL: `production_status` Column-Level REVOKE

```sql
-- Source: DESIGN.md §4.3 (Module 3 hidden invariant)
-- Must run AFTER the jobs table is created
REVOKE UPDATE (production_status) ON jobs FROM authenticated;
-- All production_status transitions go only through app.record_scan_event()
```

### TypeScript: `createWorkstation` Server Action

```typescript
// src/modules/settings/actions/workstation.ts
// Source: DESIGN.md §4.3 (Module 8: settings)
import { createClient } from '@/shared/db/server'
import { createServiceClient } from '@/shared/db/admin'  // service-role allowed here
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'
import crypto from 'node:crypto'

function generateSecureRandom(bytes: number): string {
  return crypto.randomBytes(bytes).toString('base64url').slice(0, bytes)
}

export async function createWorkstation({
  name,
  default_stage,
  location,
}: {
  name: string
  default_stage?: string
  location?: string
}) {
  await requireOfficeStaff()
  const claims = await getCurrentClaims()
  const supabase = await createClient()
  const supabaseAdmin = createServiceClient()

  const device_token = generateSecureRandom(48)

  // Insert workstation row first to get the UUID
  const { data: ws, error: wsError } = await supabase
    .from('workstations')
    .insert({
      tenant_id: claims.tenant_id,
      name,
      default_stage: default_stage ?? null,
      physical_location: location ?? null,
      device_token,
    })
    .select()
    .single()

  if (wsError || !ws) throw new Error(`Workstation insert failed: ${wsError?.message}`)

  // Create synthetic Supabase user with workstation_id in app_metadata from the start
  const synthetic_email = `workstation-${crypto.randomUUID()}@workstations.pops.local`
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: synthetic_email,
    password: device_token,
    email_confirm: true,
    app_metadata: {
      tenant_id: claims.tenant_id,
      audience: 'staff_shop',
      workstation_id: ws.id,
      role: 'shop',
    },
  })

  if (authError) throw new Error(`Auth user creation failed: ${authError.message}`)

  // Link auth user back to workstation row
  await supabase
    .from('workstations')
    .update({ auth_user_id: authData.user.id })
    .eq('id', ws.id)

  return {
    workstation: ws,
    enrollment_url: `https://app.popsindustrial.com/scan/enroll?token=${device_token}`,
  }
}
```

### TypeScript: Tailwind v4 + shadcn CSS Variables Setup

```css
/* src/app/globals.css */
/* Source: Context7 /tailwindlabs/tailwindcss.com + ui.shadcn.com/docs/tailwind-v4 */
@import "tailwindcss";

@theme {
  /* Per-tenant branding via CSS variables — override these for each tenant */
  --color-brand-primary: oklch(0.6 0.2 250);
  --color-brand-secondary: oklch(0.8 0.1 250);
}

@layer base {
  :root {
    /* shadcn/ui semantic tokens */
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    /* ... rest of shadcn palette */
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }
}
```

### TypeScript: next-intl Configuration (English-only Wave 1)

```typescript
// src/i18n.ts
// Source: Context7 /amannn/next-intl
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en'],
  defaultLocale: 'en',
  localePrefix: 'never',  // No /en/ prefix in URLs; locale determined by default
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `src/proxy.ts` | Next.js 16 | File must be renamed; old name still works but logs warnings |
| Synchronous `cookies()` | `await cookies()` | Next.js 15 (continues in 16) | All server-side cookie access must be awaited |
| `getSession()` for auth decisions | `getUser()` always | @supabase/ssr v0.5+ | `getSession()` can return stale/forged data; `getUser()` validates with auth server |
| `tailwind.config.js` | CSS-first `@theme {}` in `globals.css` | Tailwind v4 | No JS config file; all design tokens live in CSS |
| Vercel KV | Upstash Redis (via Vercel Marketplace) | Late 2024 | Vercel KV deprecated and auto-migrated; use `@upstash/redis` + `@upstash/ratelimit` |
| `auth.admin.createUser` with no app_metadata | `createUser` with `app_metadata` set at creation time | Current best practice | Hook reads app_metadata; setting it at creation avoids the race window between create and link |
| ESLint `.eslintrc` | `eslint.config.js` (flat config) | ESLint v9/v10 | Flat config format required; `@typescript-eslint/eslint-plugin` v8+ supports it |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Workstation 1-hour session TTL is achievable via per-user session configuration in Supabase Auth rather than a global JWT expiry | Pitfall 6 | RESOLVED — see Open Questions (RESOLVED) section. Supabase JWT expiry IS global; refresh-token longevity provides 30-day office/customer effective sessions. No risk; configuration plan documented in Plan 06. |

---

## Open Questions (RESOLVED)

1. **Workstation session TTL mechanism — RESOLVED 2026-05-01**
   - **Question:** Whether per-user or per-session session duration can be set to differentiate workstations (1h) from office/customer (30d).
   - **RESOLVED:** Supabase Auth JWT expiry is project-global (not per-user). Setting it to **3600 seconds (1 hour)** is the correct project-wide value that satisfies AUTH-02's stolen-tablet mitigation for workstations. Office and customer sessions achieve their 30-day effective ("felt") sessions via refresh-token rotation: the short 1h JWT expiry is transparent to them because `@supabase/ssr` (configured in Plan 04 `src/proxy.ts`) silently exchanges expired JWTs for new ones using the long-lived refresh token. No per-user override is needed — and none is available in Supabase Auth.
   - **Implementation impact:** Plan 06 Task 2 (the manual checkpoint) sets JWT Expiry = 3600s in Supabase Dashboard → Authentication → Settings as a required configuration step. Plan 06 Task 4 (the human-verify checkpoint) verifies the value via `supabase inspect db config | grep jwt_expiry` returning 3600. Plan 06's must_haves include the truth "JWT expiry is set to 3600s in Supabase Auth settings."
   - **No architectural changes to migrations, application code, or `proxy.ts` are required** — the resolution is purely a Supabase project configuration step.

2. **Resend SMTP credentials for Supabase Auth — RESOLVED 2026-05-01**
   - **Question:** Resend's SMTP host/port and whether the API key (D-03) is reusable for SMTP auth.
   - **RESOLVED:** Resend SMTP host = `smtp.resend.com`, port = `465` (TLS implicit). The SMTP username is the literal string `resend`; the SMTP password is a separate credential generated in Resend Dashboard → Settings → SMTP (NOT the API key). The API key (D-03 / `RESEND_API_KEY`) is used by the Resend SDK only; the SMTP credential is provided to Supabase Auth's Custom SMTP form. Both are linked to the same Resend account but are distinct secrets.
   - **Implementation impact:** Plan 06 Task 2 step A.5 already documents these exact values; Plan 06 Task 2 step B.4 generates the SMTP credentials from the Resend Dashboard before completing Supabase SMTP configuration.

3. **shadcn/ui CLI flag for Tailwind v4 — RESOLVED 2026-05-01**
   - **Question:** The exact CLI invocation needed to initialize shadcn with Tailwind v4 (flag name uncertain).
   - **RESOLVED:** As of shadcn CLI v2.x (current at time of research), `pnpm dlx shadcn@latest init` auto-detects Tailwind v4 from the project's `app/globals.css` `@import "tailwindcss"` declaration. No special flag is required, but the developer MUST verify (per Plan 01 Task 2 acceptance criteria) that `components.json` is generated with `tailwind.css = src/app/globals.css` and `cssVariables = true`, and that NO `tailwind.config.ts` was generated. If any v3-style config file is created, delete it before proceeding.
   - **Implementation impact:** Plan 01 Task 2 already specifies the correct invocation and the assertion that no `tailwind.config.*` file should exist.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| pnpm | Package manager (all) | ✓ | 10.28.0 | — |
| Node.js | Runtime | ✓ | v25.9.0 | — |
| Supabase CLI | Local dev, migrations, pgTAP | ✓ | 2.90.0 (update available: 2.95.4) | — |
| Docker | `supabase start` for local dev | ✓ | 29.1.3 | — |
| Git | Version control | ✓ | (assumed — git repo initialized) | — |
| GitHub repository | CI/CD (GitHub Actions) | ✓ | remote: `origin → github.com/StuntmanDaver/Pop--Coating.git` | — |
| Supabase Cloud project | Branch DB (D-07) | [ASSUMED] ✓ | Pro plan required | Cannot create branch DBs on Free tier |
| Vercel project | Deployment + custom domains | [ASSUMED] ✓ | Pro plan required | Cannot use team features on hobby |
| Resend account | Auth email via SMTP (D-01) | [ASSUMED] configured | — | Supabase built-in email (dev only; unreliable for production) |
| Upstash Redis | Rate limiting (INFRA-04) | [ASSUMED] via Vercel Marketplace | — | Cannot rate limit without persistent store in serverless |

**Missing dependencies with no fallback:** None identified — all required services appear to be available or planned per DESIGN.md §10.1.

**Missing dependencies with fallback:**
- Supabase CLI update (2.90.0 → 2.95.4): Recommend updating before starting — `brew upgrade supabase` — to avoid hitting known CLI bugs fixed in recent releases.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Supabase Auth (email+password for staff, magic-link for customers, synthetic user for workstations) |
| V3 Session Management | Yes | `@supabase/ssr` httpOnly cookies; 1h workstation TTL; 30d office/customer refresh; separate cookie stores per subdomain |
| V4 Access Control | Yes | RLS policies using `app.tenant_id()` + `app.audience()`; SECURITY DEFINER functions for elevated operations |
| V5 Input Validation | Yes | Zod on every Server Action input; `app.tenant_id()` reads JWT (not caller input); SQL parameterization via Supabase client |
| V6 Cryptography | Yes | `pgcrypto` for PIN hashing (`crypt(pin, gen_salt('bf'))`); Supabase handles JWT signing (RS256); device_token is 48-char crypto-random |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tenant data leakage (missing WHERE tenant_id) | Information Disclosure | RLS with `app.tenant_id()` — enforced at DB level even if app bug exists |
| JWT forgery / claim injection | Spoofing | `supabase.auth.getUser()` validates JWT signature with auth server on every call |
| Cross-domain session reuse (office JWT on portal) | Elevation of Privilege | `proxy.ts` audience-domain check; separate cookie stores per subdomain |
| Rate-limit bypass on magic-link endpoint | Denial of Service / Spam | `@upstash/ratelimit` sliding-window in `proxy.ts` before auth action runs |
| Service-role key exposure in client code | Elevation of Privilege | ESLint `no-restricted-imports` blocks `@/shared/db/admin` import outside allowed modules |
| Auth hook deadlock (writes in hook) | Denial of Service | Hook declared `STABLE`; explicit code review gate for any hook modification |
| PIN brute force | Tampering | `app.validate_employee_pin()` SECURITY DEFINER enforces lockout after 5 failures (shop_employees.failed_pin_attempts); PIN never transmitted over plaintext |
| Direct `production_status` UPDATE (bypass scan event audit) | Tampering | Column-level `REVOKE UPDATE (production_status) ON jobs FROM authenticated` |

---

## Sources

### Primary (HIGH confidence)
- `docs/DESIGN.md` — Full architecture, SQL schemas, auth flows, function signatures (the canonical implementation reference)
- `CLAUDE.md` — Stack constraints, hidden invariants, forbidden patterns
- Context7 `/vercel/next.js` — `await cookies()` migration pattern, `proxy.ts` naming, middleware config matcher
- Context7 `/supabase/ssr` — `createServerClient` with Next.js cookies; session refresh pattern in proxy
- Context7 `/websites/supabase` — `custom_access_token_hook` API spec; pgTAP `supabase test db` command; branch DB GitHub Actions integration
- Context7 `/tailwindlabs/tailwindcss.com` — CSS-first `@theme {}` configuration, v3→v4 migration pattern
- Context7 `/websites/ui_shadcn` — `components.json` `cssVariables: true`; Tailwind v4 migration for CSS variables
- Context7 `/amannn/next-intl` — `defineRouting` with `localePrefix: 'never'` for single-locale English-only setup
- Context7 `/vitest-dev/vitest` — `vitest.config.ts` with `jsdom` environment, TypeScript setup
- npm registry — All package versions verified via `npm view <pkg> version` on 2026-05-01

### Secondary (MEDIUM confidence)
- Supabase Issue #29073 (hook deadlock constraint) — referenced in DESIGN.md §3.2; consistent with the `STABLE` declaration pattern verified via Context7

### Tertiary (LOW confidence — see Assumptions Log)
- (Previously listed: workstation 1-hour session TTL mechanism — now RESOLVED, see Open Questions (RESOLVED) section.)

---

## Project Constraints (from CLAUDE.md)

All items below are hard rules that implementers must not deviate from:

1. **Next.js 16 App Router only** — No Pages Router. No client-side data fetching where Server Actions work.
2. **`src/proxy.ts` not `middleware.ts`** — Next.js 16 renamed the middleware file.
3. **`cookies()` is async** — `await cookies()` everywhere in Next.js 16.
4. **Always `supabase.auth.getUser()`** — Never `getSession()` for auth decisions.
5. **TypeScript strict** — `"strict": true` in tsconfig; no `any`; no `!` assertions without comment.
6. **Tailwind v4 CSS-first** — No `tailwind.config.ts`; all config in `app/globals.css` under `@theme {}`.
7. **RLS non-negotiable** — Every business table gets `tenant_id uuid not null references public.tenants(id)` + RLS policy using `app.tenant_id()`.
8. **`app.tenant_id()` in policies** — Never parse JWT inline in policies.
9. **Service-role gating** — `src/shared/db/admin.ts` import allowed only in: `src/modules/settings/**`, `src/modules/portal/**`, `src/modules/auth/**`, `src/shared/audit/**`, `supabase/functions/**`. Forbidden in `src/modules/scanning/**` and all other modules.
10. **Module boundary enforcement** — All cross-module imports go through `index.ts` only. Enforced via ESLint + `madge --circular`.
11. **`production_status` REVOKE** — Direct UPDATE of `jobs.production_status` is forbidden at the DB level (column-level REVOKE on `authenticated`).
12. **`app.custom_access_token_hook` must not write** — `STABLE` declaration required; any write causes Supabase deadlock.
13. **`supabase_auth_admin` BYPASSRLS** — Never modify this role's attributes in any migration.
14. **pnpm only** — Never `npm install` or `yarn add`.
15. **Zod on every Server Action** — Input and output schemas required for all mutations.
16. **`next-intl` from Day 1** — i18n infrastructure in place even in Wave 1 (English-only).

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All versions verified against npm registry on 2026-05-01
- Architecture: HIGH — Directly sourced from `docs/DESIGN.md` which is the canonical source of truth
- Auth patterns: HIGH — Verified against Context7 /supabase/ssr and /websites/supabase official docs
- Pitfalls: HIGH — All grounded in DESIGN.md's own warnings + Context7 verification of async APIs; A1 RESOLVED
- CI patterns: HIGH — Verified against Context7 Supabase branch DB GitHub Actions docs

**Research date:** 2026-05-01
**Open Questions resolved:** 2026-05-01
**Valid until:** 2026-06-01 (30 days; Next.js 16 and Supabase SSR are stable tracks)
