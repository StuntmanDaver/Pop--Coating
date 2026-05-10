# Phase 1: Foundation - Pattern Map

**Mapped:** 2026-05-01
**Files analyzed:** 32 new files (greenfield — no existing application code)
**Analogs found:** 0 / 32 from codebase (greenfield); all patterns sourced from canonical specification documents

---

## Greenfield Note

No application code exists. Every pattern below is sourced from the canonical specification
documents (`docs/DESIGN.md`, `CLAUDE.md`, `01-RESEARCH.md`) rather than from existing codebase
files. The "Analog / Specification Source" column identifies the **exact document section and line
range** that executors must read before implementing each file.

---

## File Classification

| New File | Role | Data Flow | Closest Analog / Spec Source | Match Quality |
|----------|------|-----------|------------------------------|---------------|
| `src/proxy.ts` | middleware | request-response | `docs/DESIGN.md` §102 + RESEARCH.md Pattern 2 (lines 299–354) | spec-exact |
| `src/i18n.ts` | config | transform | RESEARCH.md Pattern: next-intl config (lines 914–926) | spec-exact |
| `src/app/layout.tsx` | layout | request-response | `docs/DESIGN.md` §2.3 folder structure | spec-prescribed |
| `src/app/globals.css` | config | transform | RESEARCH.md Pattern: Tailwind v4 + shadcn CSS setup (lines 885–912) | spec-exact |
| `src/app/(office)/layout.tsx` | layout | request-response | `docs/DESIGN.md` §2.3; audience = `staff_office` | spec-prescribed |
| `src/app/(office)/page.tsx` | component | request-response | `docs/DESIGN.md` §2.3 (redirect stub to `/sign-in`) | spec-prescribed |
| `src/app/(office)/sign-in/page.tsx` | component | request-response | `docs/DESIGN.md` §4.3 Module 1 `auth` — `<SignInForm>` component | spec-prescribed |
| `src/app/scan/page.tsx` | component | request-response | `docs/DESIGN.md` §2.3 (stub; NOT a route group) | spec-prescribed |
| `src/app/(portal)/layout.tsx` | layout | request-response | `docs/DESIGN.md` §2.3; audience = `customer` | spec-prescribed |
| `src/app/(portal)/page.tsx` | component | request-response | `docs/DESIGN.md` §2.3 (stub) | spec-prescribed |
| `src/app/(portal)/auth/callback/route.ts` | route | request-response | `docs/DESIGN.md` §5.5 customer magic-link callback | spec-prescribed |
| `src/app/api/webhooks/route.ts` | route | event-driven | `docs/DESIGN.md` §2.3 (stub for Resend webhook) | spec-prescribed |
| `src/modules/auth/index.ts` | module | request-response | `docs/DESIGN.md` §4.2 module structure + §4.3 Module 1 public API | spec-exact |
| `src/modules/auth/actions/sign-in.ts` | service | request-response | `docs/DESIGN.md` §4.3 Module 1; RESEARCH.md Pattern 3 (lines 356–407) | spec-exact |
| `src/modules/auth/actions/sign-out.ts` | service | request-response | `docs/DESIGN.md` §4.3 Module 1 `signOutStaff()` | spec-prescribed |
| `src/modules/auth/actions/magic-link.ts` | service | request-response | `docs/DESIGN.md` §5.5 customer flows; §4.3 Module 1 `requestCustomerMagicLink` | spec-exact |
| `src/modules/auth/types.ts` | model | transform | `docs/DESIGN.md` §5.1 JWT claims shape | spec-prescribed |
| `src/modules/settings/index.ts` | module | request-response | `docs/DESIGN.md` §4.2 module structure + §4.3 Module 8 public API | spec-exact |
| `src/modules/settings/actions/workstation.ts` | service | CRUD | `docs/DESIGN.md` §4.3 Module 8 `createWorkstation` flow (lines 1652–1690); RESEARCH.md lines 812–882 | spec-exact |
| `src/shared/db/server.ts` | utility | request-response | RESEARCH.md Pattern 1 (lines 262–297); `docs/DESIGN.md` §4.4 | spec-exact |
| `src/shared/db/client.ts` | utility | request-response | `docs/DESIGN.md` §4.4 `createBrowserClient()` | spec-prescribed |
| `src/shared/db/admin.ts` | utility | request-response | `docs/DESIGN.md` §4.4 `createServiceClient()` — restricted import | spec-prescribed |
| `src/shared/db/types.ts` | model | transform | `supabase gen types typescript --local > src/shared/db/types.ts` (generated) | generated |
| `src/shared/auth-helpers/require.ts` | middleware | request-response | RESEARCH.md Pattern 3 (lines 359–391); `docs/DESIGN.md` §4.4 | spec-exact |
| `src/shared/auth-helpers/claims.ts` | utility | transform | RESEARCH.md Pattern 3 (lines 393–407); `docs/DESIGN.md` §4.4 | spec-exact |
| `src/shared/rate-limit/index.ts` | utility | request-response | `docs/DESIGN.md` §4.4 `signInLimiter, magicLinkLimiter`; RESEARCH.md lines 113–115 | spec-prescribed |
| `src/shared/rate-limit/adapter.ts` | utility | request-response | `docs/DESIGN.md` §4.4; `@upstash/ratelimit` sliding-window | spec-prescribed |
| `src/messages/en/common.json` | config | transform | `docs/DESIGN.md` §4.5; next-intl namespace pattern | spec-prescribed |
| `src/messages/en/auth.json` | config | transform | `docs/DESIGN.md` §4.5; next-intl namespace per module | spec-prescribed |
| `supabase/migrations/0001_app_schema_helpers.sql` | migration | CRUD | RESEARCH.md Code Examples (lines 649–708); `docs/DESIGN.md` §3.2 | spec-exact |
| `supabase/migrations/0002_tenants_and_domains.sql` | migration | CRUD | `docs/DESIGN.md` §3.3 Core/tenant tables (lines 304–383) | spec-exact |
| `supabase/migrations/0003_auth_tables.sql` | migration | CRUD | `docs/DESIGN.md` §3.3 Auth-related tables (lines 385–463) + migration ordering warning | spec-exact |
| `supabase/migrations/0004_crm_tables.sql` | migration | CRUD | `docs/DESIGN.md` §3.3 CRM tables (lines 465–536) | spec-exact |
| `supabase/migrations/0005_jobs_tables.sql` | migration | CRUD | `docs/DESIGN.md` §3.3 Jobs and history (lines 537–700) | spec-exact |
| `supabase/migrations/0006_rls_policies.sql` | migration | CRUD | RESEARCH.md Pattern 4 (lines 409–436); `docs/DESIGN.md` §5.7 | spec-exact |
| `supabase/migrations/0007_auth_hook.sql` | migration | event-driven | RESEARCH.md Code Examples (lines 712–798); `docs/DESIGN.md` §5.2 | spec-exact |
| `supabase/migrations/0008_production_status_revoke.sql` | migration | CRUD | RESEARCH.md Code Examples (lines 803–807); `docs/DESIGN.md` §4.3 Module 3 | spec-exact |
| `supabase/seed.sql` | config | CRUD | `docs/DESIGN.md` §9.6 (lines 3097–3099); CONTEXT.md D-12 | spec-prescribed |
| `supabase/tests/rls/test_cross_tenant_isolation.sql` | test | CRUD | `docs/DESIGN.md` §9.2 (lines 2848–2904) — full pgTAP template provided | spec-exact |
| `supabase/tests/rls/test_audience_isolation.sql` | test | CRUD | `docs/DESIGN.md` §9.2 (lines 2906–2915) | spec-exact |
| `supabase/tests/rls/test_function_authorization.sql` | test | CRUD | `docs/DESIGN.md` §9.2 (lines 2917–2927) | spec-exact |
| `scripts/seed-tenant.ts` | utility | CRUD | `docs/DESIGN.md` §9.6 (lines 3087–3095); CONTEXT.md D-10, D-11 | spec-exact |
| `eslint.config.js` | config | transform | RESEARCH.md Pattern 5 (lines 438–477); `docs/DESIGN.md` §2.4 | spec-exact |
| `.github/workflows/ci.yml` | config | event-driven | RESEARCH.md Pattern 6 (lines 481–524); CONTEXT.md D-07, D-08 | spec-exact |
| `package.json` (scripts) | config | transform | RESEARCH.md lines 121–131 (pnpm install commands) | spec-prescribed |
| `tsconfig.json` | config | transform | CLAUDE.md: `"strict": true` required | spec-prescribed |

---

## Pattern Assignments

### `src/proxy.ts` (middleware, request-response)

**Spec source:** `docs/DESIGN.md` §102 + RESEARCH.md lines 299–354

**Critical invariants:**
- File is named `proxy.ts` not `middleware.ts` (Next.js 16 rename)
- Must call `supabase.auth.getUser()` — never `getSession()`
- Rate limiting via `@upstash/ratelimit` runs before routing
- Cookie scoping: never set `domain: '.popsindustrial.com'`; let `@supabase/ssr` use host-scoped defaults

**Core pattern** (RESEARCH.md lines 302–354):
```typescript
// src/proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const isOffice = host.startsWith('app.')
  const isPortal = host.startsWith('track.')

  let response = NextResponse.next({ request })

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

  // Audience-domain enforcement
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

**Rate-limit integration:** Add `@upstash/ratelimit` check inside `proxy()` before the `getUser()` call for sign-in and magic-link paths. See `docs/DESIGN.md` §4.4 `signInLimiter`/`magicLinkLimiter`.

---

### `src/shared/db/server.ts` (utility, request-response)

**Spec source:** RESEARCH.md lines 262–297; `docs/DESIGN.md` §4.4

**Critical invariants:**
- `cookies()` from `next/headers` is **async** — must `await cookies()`
- Returns a typed `SupabaseClient<Database>` using generated types from `src/shared/db/types.ts`
- Fresh client created per-request (no module-level singleton)

**Core pattern** (RESEARCH.md lines 262–297):
```typescript
// src/shared/db/server.ts
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

---

### `src/shared/db/admin.ts` (utility, request-response)

**Spec source:** `docs/DESIGN.md` §2.4 + §4.4

**Critical invariants:**
- Import is ESLint-blocked except in: `src/modules/settings/**`, `src/modules/portal/**`, `src/modules/auth/**`, `src/shared/audit/**`, `supabase/functions/**`
- Uses service-role key (`SUPABASE_SERVICE_ROLE_KEY`) — never `NEXT_PUBLIC_*`
- Creates a standard `@supabase/supabase-js` client (not SSR), typed with `Database`

**Core pattern:**
```typescript
// src/shared/db/admin.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

---

### `src/shared/auth-helpers/require.ts` (middleware, request-response)

**Spec source:** RESEARCH.md lines 359–391; `docs/DESIGN.md` §4.4

**Critical invariants:**
- Calls `supabase.auth.getUser()` — never `getSession()`
- Uses `redirect()` from `next/navigation` for unauthenticated redirects
- Throws for wrong audience (not redirect) — caller decides how to surface
- `createClient()` must be awaited (async function)

**Core pattern** (RESEARCH.md lines 359–391):
```typescript
// src/shared/auth-helpers/require.ts
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
```

---

### `src/shared/auth-helpers/claims.ts` (utility, transform)

**Spec source:** RESEARCH.md lines 393–407; `docs/DESIGN.md` §4.4 + §5.1

**Core pattern** (RESEARCH.md lines 393–407):
```typescript
// src/shared/auth-helpers/claims.ts
import { createClient } from '@/shared/db/server'

export async function getCurrentClaims() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return {
    tenant_id:    user.app_metadata.tenant_id as string,
    audience:     user.app_metadata.audience as string,
    role:         user.app_metadata.role as string,
    staff_id:     user.app_metadata.staff_id as string | undefined,
    workstation_id: user.app_metadata.workstation_id as string | undefined,
    company_id:   user.app_metadata.company_id as string | undefined,
  }
}
```

**JWT claims shape** (`docs/DESIGN.md` §5.1):
- `tenant_id`: UUID string
- `audience`: `'staff_office' | 'staff_shop' | 'customer'`
- `role`: `'admin' | 'manager' | 'office' | 'shop'` (staff only)
- `staff_id`: UUID (staff only)
- `workstation_id`: UUID (workstation synthetic user only)
- `company_id`: UUID (customer only)

---

### `src/modules/auth/actions/sign-in.ts` (service, request-response)

**Spec source:** `docs/DESIGN.md` §4.3 Module 1; RESEARCH.md Pattern 3

**Critical invariants:**
- Rate-limited: 5 attempts/hr per IP+email via `signInLimiter` from `@/shared/rate-limit`
- Input validated with Zod schema before any Supabase call
- Uses `supabase.auth.signInWithPassword()` (not admin API)
- Returns typed result; never exposes raw Supabase error messages to client

**Structure pattern:**
```typescript
// src/modules/auth/actions/sign-in.ts
'use server'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { signInLimiter } from '@/shared/rate-limit'

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function signInStaff(input: unknown) {
  const parsed = SignInSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input' }

  // Rate limit check (IP-based; caller passes IP from headers)
  // ...

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) return { error: 'Invalid credentials' }
  return { success: true }
}
```

---

### `src/modules/auth/actions/magic-link.ts` (service, request-response)

**Spec source:** `docs/DESIGN.md` §5.5 customer flows; §4.3 Module 1

**Critical invariants:**
- Rate-limited via `magicLinkLimiter`
- Anti-enumeration: always returns success-like response even if email not found
- Uses `supabase.auth.signInWithOtp()` with `redirectTo` pointing to `/(portal)/auth/callback`
- Zod input validation required

---

### `src/modules/settings/actions/workstation.ts` (service, CRUD)

**Spec source:** `docs/DESIGN.md` §4.3 Module 8 lines 1652–1690; RESEARCH.md lines 812–882

**Critical invariants:**
- Import of `createServiceClient` is allowed here (settings module)
- `requireOfficeStaff()` called before any operation
- Workstation row inserted first to get the UUID, then synthetic auth user created with `workstation_id` in `app_metadata` from creation time
- `device_token`: 48-char URL-safe random (`crypto.randomBytes(48).toString('base64url')`)
- Synthetic email format: `workstation-{uuid}@workstations.{tenant.slug}.local`
- Returns `{ workstation, enrollment_url }` with enrollment URL for Phase 3 QR UI

**Core pattern** (RESEARCH.md lines 812–882; DESIGN.md §4.3 Module 8):
```typescript
// src/modules/settings/actions/workstation.ts
'use server'
import { createClient } from '@/shared/db/server'
import { createServiceClient } from '@/shared/db/admin'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'
import crypto from 'node:crypto'

export async function createWorkstation({name, default_stage, location}: {
  name: string; default_stage?: string; location?: string
}) {
  await requireOfficeStaff()
  const claims = await getCurrentClaims()
  const supabase = await createClient()
  const supabaseAdmin = createServiceClient()

  const device_token = crypto.randomBytes(48).toString('base64url').slice(0, 48)

  // 1. Insert workstation row first (to get UUID for app_metadata)
  const { data: ws, error: wsError } = await supabase
    .from('workstations')
    .insert({ tenant_id: claims.tenant_id, name, default_stage: default_stage ?? null,
              physical_location: location ?? null, device_token })
    .select().single()

  if (wsError || !ws) throw new Error(`Workstation insert failed: ${wsError?.message}`)

  // 2. Create synthetic user with workstation_id in app_metadata from the start
  const synthetic_email = `workstation-${crypto.randomUUID()}@workstations.pops.local`
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: synthetic_email, password: device_token, email_confirm: true,
    app_metadata: { tenant_id: claims.tenant_id, audience: 'staff_shop',
                    workstation_id: ws.id, role: 'shop' },
  })

  if (authError) throw new Error(`Auth user creation failed: ${authError.message}`)

  // 3. Link auth user back to workstation
  await supabase.from('workstations')
    .update({ auth_user_id: authData.user.id }).eq('id', ws.id)

  return { workstation: ws,
           enrollment_url: `https://app.popsindustrial.com/scan/enroll?token=${device_token}` }
}
```

---

### `src/app/globals.css` (config, transform)

**Spec source:** RESEARCH.md lines 885–912; `docs/DESIGN.md` §4.5 (Tailwind v4 CSS-first)

**Critical invariants:**
- No `tailwind.config.ts` file — Tailwind v4 is CSS-first; all tokens in `@theme {}`
- shadcn/ui CSS variables go in `@layer base {}` under `:root` and `.dark`
- Per-tenant branding tokens (`--color-brand-primary`) defined here; override per tenant via CSS variables (not hardcoded colors)
- Run `pnpm dlx shadcn@latest init` and check flags for Tailwind v4 compatibility

**Core pattern** (RESEARCH.md lines 885–912):
```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --color-brand-primary: oklch(0.6 0.2 250);
  --color-brand-secondary: oklch(0.8 0.1 250);
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }
}
```

---

### `src/i18n.ts` (config, transform)

**Spec source:** RESEARCH.md lines 914–926; `docs/DESIGN.md` §4.5

**Core pattern** (RESEARCH.md lines 914–926):
```typescript
// src/i18n.ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en'],
  defaultLocale: 'en',
  localePrefix: 'never',  // No /en/ prefix; English-only Wave 1
})
```

---

### `supabase/migrations/0001_app_schema_helpers.sql` (migration, CRUD)

**Spec source:** `docs/DESIGN.md` §3.2; RESEARCH.md lines 649–708

**Delivers:** `pgcrypto` extension, `app` schema, all SECURITY DEFINER helper functions:
`app.tenant_id()`, `app.audience()`, `app.role()`, `app.staff_id()`, `app.workstation_id()`,
`app.company_id()`, `app.set_updated_at()`

**Core pattern** (RESEARCH.md lines 649–708):
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.tenant_id() RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'tenant_id', ''
  )::uuid;
$$;

-- ... (app.audience, app.role, app.staff_id, app.workstation_id,
--       app.company_id, app.set_updated_at follow same pattern)
```

**Critical invariants:**
- All functions declared `STABLE` (no writes)
- Never parse JWT inline in RLS policies — always call `app.tenant_id()`
- `app.set_updated_at()` trigger applied per-table at creation time

---

### `supabase/migrations/0007_auth_hook.sql` (migration, event-driven)

**Spec source:** `docs/DESIGN.md` §5.2; RESEARCH.md lines 712–798

**Critical invariants:**
- Function declared `STABLE` — no `INSERT`/`UPDATE`/`DELETE` inside the function body (Supabase Issue #29073 deadlock)
- Order of lookup: staff → workstation → customer_users
- Returns `{error: {http_code: 403, message: '...'}}` for inactive users and unprovisioned accounts
- Required grants: `GRANT EXECUTE ON FUNCTION app.custom_access_token_hook TO supabase_auth_admin` + `GRANT SELECT ON staff, customer_users, workstations TO supabase_auth_admin`
- Never `ALTER ROLE supabase_auth_admin` — the role's `BYPASSRLS` must not be modified
- Hook registered in Supabase Dashboard after migration runs

---

### `supabase/migrations/0008_production_status_revoke.sql` (migration, CRUD)

**Spec source:** `docs/DESIGN.md` §4.3 Module 3; RESEARCH.md lines 803–807

**Core pattern** (RESEARCH.md lines 803–807):
```sql
-- Must run AFTER supabase/migrations/0005_jobs_tables.sql
REVOKE UPDATE (production_status) ON jobs FROM authenticated;
-- All production_status transitions go only through app.record_scan_event()
```

---

### `supabase/migrations/0006_rls_policies.sql` (migration, CRUD)

**Spec source:** `docs/DESIGN.md` §5.7; RESEARCH.md lines 409–436

**RLS policy template** (RESEARCH.md lines 409–436):
```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY <table>_staff_select ON <table> FOR SELECT
  USING (tenant_id = app.tenant_id()
         AND app.audience() IN ('staff_office', 'staff_shop'));

CREATE POLICY <table>_office_insert ON <table> FOR INSERT
  WITH CHECK (tenant_id = app.tenant_id()
              AND app.audience() = 'staff_office');

CREATE POLICY <table>_office_update ON <table> FOR UPDATE
  USING (tenant_id = app.tenant_id() AND app.audience() = 'staff_office')
  WITH CHECK (tenant_id = app.tenant_id());

-- No DELETE policies for authenticated users (hard deletes forbidden)
```

**Critical invariants:**
- Every business table gets `tenant_id = app.tenant_id()` in every policy
- Never inline JWT parsing — always use `app.tenant_id()`, `app.audience()` helpers
- Customer SELECT policies add table-specific row filter (e.g., `company_id = app.company_id()`)

---

### `supabase/migrations/0003_auth_tables.sql` (migration, CRUD)

**Spec source:** `docs/DESIGN.md` §3.3 Auth-related tables lines 385–463

**Critical ordering constraint** (`docs/DESIGN.md` §3.3 lines 458–463):
1. `CREATE TABLE staff`
2. `CREATE TABLE customer_users`
3. `CREATE OR REPLACE FUNCTION app.assert_email_unique_across_actor_tables()`
4. `CREATE TRIGGER ensure_email_unique ON staff`
5. `CREATE TRIGGER ensure_email_unique ON customer_users`

This ordering prevents the "relation customer_users does not exist" runtime error when the trigger fires during seed.

---

### `scripts/seed-tenant.ts` (utility, CRUD)

**Spec source:** `docs/DESIGN.md` §9.6 lines 3087–3095; CONTEXT.md D-10, D-11

**Critical invariants:**
- Uses `createServiceClient()` (service-role) — this is an allowed context (CLI script)
- Calls `auth.admin.inviteUserByEmail(owner_email)` for first admin (D-11)
- Must call `auth.admin.updateUserById(userId, { app_metadata: { tenant_id, intended_actor: 'staff' } })` after invite to avoid `link_auth_user_to_actor` trigger failure
- Creates: 1 `tenants` row, 1 `shop_settings` row, 1 `staff` row (`role='admin'`, `is_active=true`, `auth_user_id=NULL` until invite accepted)
- This script is run against Supabase Cloud as part of Phase 1 deliverables

---

### `supabase/seed.sql` (config, CRUD)

**Spec source:** CONTEXT.md D-12; `docs/DESIGN.md` §9.6

**Critical invariants:**
- Test tenant uses a **fixed known UUID** (not `gen_random_uuid()`) so tests can import it as a constant
- Includes: 1 test tenant, 1 office staff user (`audience=office`, `role='admin'`), 1 synthetic workstation user, sample companies/contacts/jobs for Phase 2+ visual testing

---

### `eslint.config.js` (config, transform)

**Spec source:** `docs/DESIGN.md` §2.4 lines 180–214; RESEARCH.md Pattern 5 lines 438–477

**Two mandatory rule blocks** (RESEARCH.md lines 438–477):

1. Module boundary rule (all files):
```javascript
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{ group: ['@/modules/*/!(index)*'], message: 'Import from module index.ts only' }]
    }]
  }
}
```

2. Service-role gating (restricted to allowed modules):
```javascript
{
  files: ['src/modules/!(settings|portal|auth)/**', 'src/shared/!(audit)/**'],
  rules: {
    'no-restricted-imports': ['error', {
      paths: [{ name: '@/shared/db/admin', message: 'service-role import not allowed in this module' }]
    }]
  }
}
```

---

### `.github/workflows/ci.yml` (config, event-driven)

**Spec source:** RESEARCH.md Pattern 6 lines 481–524; CONTEXT.md D-07, D-08

**Four required merge gates** (CONTEXT.md D-08):
1. `pnpm type-check` — TypeScript strict compilation
2. `pnpm lint` — ESLint + `pnpx madge --circular src/modules`
3. `pnpm test` — Vitest unit tests
4. pgTAP RLS suite — runs against Supabase branch DB (requires Supabase GitHub App installed)

**Branch DB wait pattern** (RESEARCH.md lines 510–523):
```yaml
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

---

### `supabase/tests/rls/test_cross_tenant_isolation.sql` (test, CRUD)

**Spec source:** `docs/DESIGN.md` §9.2 lines 2848–2904

Full pgTAP test template is reproduced verbatim in DESIGN.md §9.2. Executor must read lines 2848–2904 and implement all 6 tests. Pattern:
- Tests run inside `BEGIN; ... ROLLBACK;` (no DB pollution)
- Uses `set_jwt_for_staff()` / `set_jwt_for_customer()` / `set_jwt_anon()` helper functions that `set_config('request.jwt.claims', ...)` to simulate different JWT audiences
- `SELECT plan(N)` declares test count upfront

---

### Module stub files (`src/modules/*/index.ts`) (module, request-response)

**Spec source:** `docs/DESIGN.md` §4.2 module structure lines 1309–1325

Every Wave-1 module that is NOT fully implemented in Phase 1 (crm, jobs, packets, scanning, timeline, dashboard, portal, tags) gets a stub `index.ts` that:
- Exports the module's public API surface as type stubs or empty functions
- Has a `README.md` describing the module's purpose
- Follows the structure: `index.ts`, `types.ts`, `actions.ts`, `queries.ts`, `schemas.ts`, `components/`, `hooks/`, `lib/`

---

### Shared stub directories

The following `src/shared/` subdirectories are created as stubs in Phase 1 (full implementation deferred):

| Directory | Phase 1 Deliverable | Full Implementation |
|-----------|---------------------|---------------------|
| `src/shared/audit/` | Directory + `index.ts` stub | Phase 4 (`withAudit()` HOF) |
| `src/shared/realtime/` | Directory stub | Phase 3 |
| `src/shared/storage/` | Directory stub | Phase 3 |
| `src/shared/ui/` | shadcn component installs via CLI | Ongoing |

---

## Shared Patterns

### Authentication Guard Pattern
**Source:** RESEARCH.md lines 359–407; `docs/DESIGN.md` §4.4
**Apply to:** All Server Actions and RSC pages in `src/app/(office)/`, `src/app/(portal)/`, `src/app/scan/`

Every protected Server Action begins with:
```typescript
await requireOfficeStaff()  // or requireShopStaff() or requireCustomer()
const claims = await getCurrentClaims()
```

### Supabase Client Creation Pattern
**Source:** RESEARCH.md lines 262–297
**Apply to:** All files that query Supabase server-side

```typescript
const supabase = await createClient()  // async — must be awaited
```

Never create a module-level singleton. Create fresh per-request.

### Zod Validation Pattern
**Source:** `docs/DESIGN.md` §4.5; CLAUDE.md constraint 15
**Apply to:** All Server Actions (input AND output schemas)

```typescript
'use server'
const InputSchema = z.object({ /* ... */ })

export async function myAction(input: unknown) {
  const parsed = InputSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input', issues: parsed.error.issues }
  // proceed with parsed.data
}
```

### RLS Policy Pattern
**Source:** RESEARCH.md lines 409–436; `docs/DESIGN.md` §5.7
**Apply to:** Every new SQL migration that creates a business table

Every table gets:
1. `tenant_id UUID NOT NULL REFERENCES public.tenants(id)`
2. `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY`
3. At minimum a staff SELECT policy using `tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop')`
4. `app.set_updated_at()` trigger if the table has `updated_at`

### Module Public API Pattern
**Source:** `docs/DESIGN.md` §4.2 lines 1309–1325; §2.4 lines 180–197
**Apply to:** All `src/modules/*/index.ts` files

```typescript
// src/modules/<name>/index.ts
// ONLY file other modules may import from. All exports go through here.
export { signInStaff, signOutStaff, requestCustomerMagicLink } from './actions/sign-in'
export type { SignInResult } from './types'
```

Deep imports (`@/modules/auth/actions/sign-in`) are forbidden by ESLint.

### TypeScript Strict Pattern
**Source:** CLAUDE.md constraints; `docs/DESIGN.md` §2.2
**Apply to:** All `.ts` and `.tsx` files

- No `any` — use `unknown` + type guard or discriminated union
- No non-null assertion (`!`) without an inline comment explaining why it is safe
- Discriminated unions over loose object types for result/error patterns

---

## Anti-Patterns (Executors Must Avoid)

| Anti-Pattern | Correct Pattern | Spec Source |
|--------------|-----------------|-------------|
| `getSession()` for auth decisions | `getUser()` always | CLAUDE.md; RESEARCH.md §Anti-Patterns |
| `cookies()` (synchronous) | `await cookies()` | CLAUDE.md; RESEARCH.md §Anti-Patterns |
| Writing inside `custom_access_token_hook` | `STABLE` declaration; SELECTs only | DESIGN.md §5.2; RESEARCH.md Pitfall 1 |
| `middleware.ts` filename | `src/proxy.ts` | CLAUDE.md; DESIGN.md §102 |
| `tenant_id` from caller parameter in SECURITY DEFINER | Always read from `app.tenant_id()` | CLAUDE.md; RESEARCH.md §Anti-Patterns |
| Inline JWT parsing in RLS policies | `app.tenant_id()` / `app.audience()` | CLAUDE.md; DESIGN.md §3.2 |
| `tailwind.config.ts` | CSS-first `@theme {}` in `globals.css` | CLAUDE.md; RESEARCH.md §Anti-Patterns |
| `ALTER ROLE supabase_auth_admin` | Never modify this role | CLAUDE.md; RESEARCH.md Pitfall 4 |
| Direct `UPDATE production_status` | Only via `app.record_scan_event()` | CLAUDE.md; DESIGN.md §4.3 Module 3 |
| `domain: '.popsindustrial.com'` in cookie options | Host-scoped default (no domain) | RESEARCH.md Pitfall 2 |
| Creating triggers before both `staff` AND `customer_users` exist | Create both tables first, then function, then both triggers | RESEARCH.md Pitfall 3; DESIGN.md §3.3 |
| `npm install` or `yarn add` | `pnpm install` / `pnpm add` | CLAUDE.md |

---

## No Analog Found (Spec-Only)

All Phase 1 files fall into this category because the project is greenfield. The planner
**must** reference the specification sources in the Pattern Assignments section above rather
than any existing codebase files.

| File Category | Reason | Spec Source |
|---------------|---------|-------------|
| All SQL migrations | No existing Supabase migrations | `docs/DESIGN.md` §3.2, §3.3, §5.2, §5.7 |
| All TypeScript modules | No existing application code | `docs/DESIGN.md` §4.2, §4.3, §4.4 |
| CI/CD config | No existing GitHub Actions | RESEARCH.md Pattern 6; CONTEXT.md D-07, D-08 |
| pgTAP test suite | No existing tests | `docs/DESIGN.md` §9.2 |

---

## Metadata

**Analog search scope:** Entire repository (greenfield — no `src/` directory exists)
**Files scanned:** 4 specification documents (`docs/DESIGN.md`, `CLAUDE.md`, `01-CONTEXT.md`, `01-RESEARCH.md`)
**Pattern extraction date:** 2026-05-01
**Valid until:** 2026-06-01 (library versions verified against npm on 2026-05-01)

**Primary specification reference for all executors:** `docs/DESIGN.md` (3,375 lines) — read the section cited in the Pattern Assignment for each file before implementing. The research summary in `01-RESEARCH.md` provides verified code excerpts that can be used directly.
