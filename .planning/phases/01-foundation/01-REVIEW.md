---
phase: 01-foundation
reviewed: 2026-05-02T00:00:00Z
depth: standard
files_reviewed: 73
files_reviewed_list:
  - .env.local.example
  - .github/workflows/ci.yml
  - .gitignore
  - components.json
  - eslint.config.js
  - instrumentation.ts
  - next.config.ts
  - package.json
  - scripts/seed-tenant.ts
  - sentry.client.config.ts
  - sentry.edge.config.ts
  - sentry.server.config.ts
  - src/app/(office)/layout.tsx
  - src/app/(office)/page.tsx
  - src/app/(office)/sign-in/page.tsx
  - src/app/(portal)/auth/callback/route.ts
  - src/app/(portal)/layout.tsx
  - src/app/(portal)/page.tsx
  - src/app/(portal)/sign-in/page.tsx
  - src/app/api/webhooks/route.ts
  - src/app/globals.css
  - src/app/layout.tsx
  - src/app/scan/page.tsx
  - src/i18n.ts
  - src/lib/utils.ts
  - src/messages/en/auth.json
  - src/messages/en/common.json
  - src/modules/auth/actions/magic-link.test.ts
  - src/modules/auth/actions/magic-link.ts
  - src/modules/auth/actions/sign-in.test.ts
  - src/modules/auth/actions/sign-in.ts
  - src/modules/auth/actions/sign-out.ts
  - src/modules/auth/index.ts
  - src/modules/auth/types.ts
  - src/modules/crm/index.ts
  - src/modules/dashboard/index.ts
  - src/modules/jobs/index.ts
  - src/modules/packets/index.ts
  - src/modules/portal/index.ts
  - src/modules/scanning/index.ts
  - src/modules/settings/actions/workstation.test.ts
  - src/modules/settings/actions/workstation.ts
  - src/modules/settings/index.ts
  - src/modules/tags/index.ts
  - src/modules/timeline/index.ts
  - src/proxy.ts
  - src/shared/audit/index.ts
  - src/shared/auth-helpers/claims.ts
  - src/shared/auth-helpers/require.ts
  - src/shared/db/admin.ts
  - src/shared/db/client.ts
  - src/shared/db/server.ts
  - src/shared/db/types.ts
  - src/shared/rate-limit/adapter.ts
  - src/shared/rate-limit/index.ts
  - src/shared/realtime/index.ts
  - src/shared/storage/index.ts
  - src/shared/ui/alert.tsx
  - src/shared/ui/button.tsx
  - src/shared/ui/card.tsx
  - src/shared/ui/form.tsx
  - src/shared/ui/input.tsx
  - src/shared/ui/label.tsx
  - supabase/config.toml
  - supabase/migrations/0007_auth_hook.sql
  - supabase/migrations/0008_production_status_revoke.sql
  - supabase/migrations/0009_workstation_lifecycle_functions.sql
  - supabase/migrations/0010_link_auth_user_trigger.sql
  - supabase/seed.sql
  - supabase/tests/helpers/jwt_helpers.sql
  - supabase/tests/rls/test_audience_isolation.sql
  - supabase/tests/rls/test_auth_hook_invariants.sql
  - supabase/tests/rls/test_cross_tenant_isolation.sql
  - supabase/tests/rls/test_function_authorization.sql
  - tsconfig.json
  - vitest.config.ts
findings:
  critical: 6
  warning: 9
  info: 4
  total: 19
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-02T00:00:00Z
**Depth:** standard
**Files Reviewed:** 73
**Status:** issues_found

## Summary

This is the Wave 1 / Phase 1 foundation layer: project tooling, authentication infrastructure, database migrations, RLS test scaffolding, and proxy routing. The architecture is well-reasoned overall — `getUser()` is used consistently instead of `getSession()`, `cookies()` is properly awaited, and the multi-tenant `tenant_id` convention is correctly propagated. However, six blockers require remediation before this code ships:

1. A hardcoded Sentry DSN appears in two committed config files.
2. The seed file ships a predictable plaintext device token that would let anyone sign in as the dev workstation.
3. The webhook stub accepts all POST requests without signature verification, creating an open unauthenticated endpoint.
4. The magic-link rate limiter is called with `.catch(() => undefined)` — it silently discards errors including Redis connectivity failures, so the limiter can fail completely open.
5. The ESLint service-role gating rule is overridden by a second `no-restricted-imports` block rather than merged, leaving the protection ineffective for app-layer files.
6. `getCurrentClaims()` trusts `app_metadata` from the JWT cache without re-validating via `getUser()`, creating a potential stale-claims window.

---

## Critical Issues

### CR-01: Hardcoded Sentry DSN committed in source

**File:** `sentry.edge.config.ts:9` and `sentry.server.config.ts:9`
**Issue:** Both server and edge Sentry configs contain a fully hardcoded production DSN (`https://ff6ae4e52d7ef1b2dca4086f10d51451@o4511318114697216.ingest.us.sentry.io/4511318116794368`). The client config (`sentry.client.config.ts`) correctly reads from `process.env.NEXT_PUBLIC_SENTRY_DSN`. The server/edge configs do not. This means the production ingest key is committed to version history and cannot be rotated without a git history rewrite. Any developer with repo access — or any future public fork — can send arbitrary events to this Sentry project, exhausting quotas or injecting false alerts.
**Fix:**
```typescript
// sentry.server.config.ts and sentry.edge.config.ts — replace hardcoded DSN
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,            // lower for production; 1.0 is 100% sampling — expensive
  environment: process.env.VERCEL_ENV ?? 'development',
  sendDefaultPii: false,            // see CR-02
})
```
Add `SENTRY_DSN` to `.env.local.example`. Rotate the exposed DSN immediately.

---

### CR-02: `sendDefaultPii: true` on server and edge Sentry configs

**File:** `sentry.edge.config.ts:19` and `sentry.server.config.ts:19`
**Issue:** Both server-side configs set `sendDefaultPii: true`. This instructs the Sentry SDK to attach IP addresses, cookies, request headers, and user identity information to every captured event. In a multi-tenant SaaS processing industrial job data, this means one tenant's PII could appear in another tenant's Sentry event if tagging is misconfigured. It also creates GDPR/CCPA obligations for the Sentry project itself. The client config (`sentry.client.config.ts`) does not set this flag, so there is already inconsistency. Default PII capture should be opt-in per event, not blanket-on for all server traffic.
**Fix:**
```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,    // do NOT attach IP/cookies/headers automatically
  // Attach tenant_id manually via Sentry.setTag() — already done in proxy.ts and require.ts
})
```

---

### CR-03: Predictable plaintext device token in seed data allows unauthorized workstation sign-in

**File:** `supabase/seed.sql:124`
**Issue:** The seeded workstation row uses `device_token = 'dev-workstation-device-token-seed-001'` and the corresponding `auth.users` row uses `crypt('dev-workstation-device-token-seed-001', gen_salt('bf'))` as the password. The `createWorkstation` server action generates a cryptographically random 48-char base64url token. The seed fixture bypasses this security property by shipping a guessable, static token that is now committed to version history. Any developer running `supabase db reset` produces a workstation that can be signed into with this known credential, and the workstation's JWT would carry `audience: 'staff_shop'` and a valid `tenant_id`. If this seed file is ever applied against a staging environment with real data, it creates a permanent backdoor.
**Fix:**
```sql
-- Use a cryptographically random value — not a human-readable string
-- Generate with: openssl rand -base64 36 | tr -d '=+/' | head -c 48
device_token = gen_random_bytes(36)::text  -- or store as a properly random value
-- Alternatively, document clearly: seed.sql MUST NOT be applied to staging/prod.
-- Add a guard at the top of seed.sql:
DO $$ BEGIN
  IF current_setting('app.env', true) != 'local' THEN
    RAISE EXCEPTION 'seed.sql must only run in local dev environments';
  END IF;
END $$;
```
At minimum, add a prominent warning comment and document in the runbook that `supabase db reset` (which applies seed.sql) must never target production or staging connection strings.

---

### CR-04: Webhook endpoint accepts unauthenticated POST with no signature verification

**File:** `src/app/api/webhooks/route.ts:3-6`
**Issue:** The stub webhook handler accepts any POST to `/api/webhooks` and returns `{ ok: true }` without any authentication, signature validation, or origin check. Even as a stub, this is a live, unauthenticated POST endpoint in production. Resend (and Stripe in Wave 4) signs webhook payloads with an HMAC secret. An attacker who discovers this endpoint can send arbitrary POST requests that will be processed when the stub is replaced with real logic. More immediately, the stub returns `200 ok: true` to any caller, which could be used to probe that the application is live and accepting requests at this path. The correct pattern is to validate the signature before doing anything, even in a stub.
**Fix:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'

export async function POST(request: NextRequest) {
  // Reject immediately if no signature header (Resend uses 'svix-signature')
  const signature = request.headers.get('svix-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  // Phase 1 stub: log and return 200 to prevent Resend retry floods
  // Full verification + handler lands in Phase 2 (RESEND-01)
  // TODO(Phase 2): validate HMAC against process.env.RESEND_WEBHOOK_SECRET
  return NextResponse.json({ ok: true })
}
```
Add `RESEND_WEBHOOK_SECRET` to `.env.local.example`.

---

### CR-05: Magic-link rate limiter failures are silently discarded — limiter can fail completely open

**File:** `src/modules/auth/actions/magic-link.ts:22-23`
**Issue:** The rate limit calls use `.catch(() => undefined)` which swallows all errors including Redis connectivity failures. The intent is to allow the OTP call to proceed even if the limiter throws, which is documented as anti-enumeration. However, the result is that if Upstash Redis goes offline, every magic-link request bypasses rate limiting entirely with no alerting, logging, or circuit-break. The `signInLimiter` in `sign-in.ts` does NOT have this problem — it correctly awaits `{ success: rlOk }` and returns an error when the limit is exceeded. The magic-link action's design is inconsistent and the security contract is weaker than documented.

Additionally, the rate-limit results are discarded: even when the limiter returns `{ success: false }`, the function proceeds to call `signInWithOtp`. The test at line 75-82 confirms this is intentional (anti-enumeration), but the current code calls the limiter purely for side effects (Upstash analytics) while the actual throttle decision is never acted on.
**Fix:**
```typescript
// Option A (recommended): Still limit, but do it silently on Redis errors only
const [emailResult, ipResult] = await Promise.allSettled([
  magicLinkPerEmailLimiter.limit(parsed.data.email),
  magicLinkPerIpLimiter.limit(ip),
])

const emailOk = emailResult.status === 'fulfilled' ? emailResult.value.success : true // fail open only on error
const ipOk    = ipResult.status  === 'fulfilled' ? ipResult.value.success : true

// Anti-enumeration: still always return { success: true } to the caller.
// But internally: if both limiters are healthy and both say no, skip the OTP call.
// This prevents account enumeration while still throttling legitimate abusers.
if (!emailOk || !ipOk) {
  return { success: true } // silently drop; don't call signInWithOtp (saves Supabase quota)
}
```
Log Redis errors to Sentry so failures are visible.

---

### CR-06: ESLint service-role gating rule is silently overridden — `@/shared/db/admin` import allowed in `src/app/**`

**File:** `eslint.config.js:27-43`
**Issue:** ESLint config flat config processes rules in order, and when two blocks target overlapping file sets, **the later block's `no-restricted-imports` completely replaces the earlier one** — it does not merge. Block 1 (lines 12-23) sets a global `no-restricted-imports` rule restricting deep module imports. Block 2 (lines 27-42) targets `src/app/**` (among others) and sets a *new* `no-restricted-imports` rule restricting only `@/shared/db/admin`. Because flat config replaces rather than merges same-key rules, the `src/app/**` overlay actually removes the deep-module-import restriction and replaces it with only the admin-client restriction for those files.

More critically: the `files` pattern on Block 2 includes `src/app/**`, `src/shared/!(audit|auth-helpers|db)/**`, and `src/modules/!(settings|portal|auth)/**`. The scanning module is covered by Block 2 since it matches `src/modules/!(settings|portal|auth)/**`. That appears correct. However, the pattern `src/shared/!(audit|auth-helpers|db)/**` using negated glob brace expansion is not standard ESLint glob syntax — ESLint uses `minimatch` which may or may not handle `!(...)` negation depending on version and config. If the negation fails to parse, the entire Block 2 `files` filter could match nothing or everything, silently disabling the protection.

Verify the negation glob behavior in the ESLint version in use (ESLint 9.x + `minimatch`). Test with `eslint --print-config` for a file in `src/shared/realtime/index.ts`.
**Fix:**
```javascript
// Replace glob negation with explicit allow-list per ESLint docs for flat config
// Split into separate targeted blocks to make intent explicit and merge-safe:
{
  // Block 2a: scanning module — strictly forbid service-role
  files: ['src/modules/scanning/**'],
  rules: {
    'no-restricted-imports': ['error', {
      paths: [{ name: '@/shared/db/admin', message: 'service-role FORBIDDEN in scanning module' }],
      patterns: [{ group: ['@/modules/*/!(index)*'], message: 'Import from module index.ts only' }],
    }],
  },
},
{
  // Block 2b: all modules except the allowed set
  files: ['src/modules/crm/**', 'src/modules/dashboard/**', 'src/modules/jobs/**',
          'src/modules/packets/**', 'src/modules/tags/**', 'src/modules/timeline/**'],
  rules: {
    'no-restricted-imports': ['error', {
      paths: [{ name: '@/shared/db/admin', message: 'service-role not allowed in this module' }],
      patterns: [{ group: ['@/modules/*/!(index)*'], message: 'Import from module index.ts only' }],
    }],
  },
},
```

---

## Warnings

### WR-01: `getCurrentClaims()` reads `app_metadata` from a potentially cached JWT without calling `getUser()`

**File:** `src/shared/auth-helpers/claims.ts:15-27`
**Issue:** `getCurrentClaims()` calls `supabase.auth.getUser()` which validates the session against the Supabase auth server — good. However, it then extracts claims from `user.app_metadata` and casts them all with bare `as string` and `as string | undefined` without validating that the fields are actually present. If `app_metadata.tenant_id` is `undefined` (e.g., a freshly invited user who hasn't gone through the auth hook yet, or a workstation user whose hook lookup failed), `claims.tenant_id` will silently be `undefined as string`. Any downstream code using `claims.tenant_id` in an RLS query will pass `undefined` which Supabase will serialize as `null`, causing the RLS policy `tenant_id = app.tenant_id()` to fail to match and return 0 rows — a silent data access failure rather than an explicit auth error.
**Fix:**
```typescript
export async function getCurrentClaims(): Promise<JWTClaims> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')

  const meta = user.app_metadata
  const tenant_id = meta?.tenant_id
  const audience  = meta?.audience

  if (typeof tenant_id !== 'string' || !tenant_id) {
    throw new Error('JWT missing tenant_id — auth hook may not have run yet')
  }
  if (audience !== 'staff_office' && audience !== 'staff_shop' && audience !== 'customer') {
    throw new Error(`JWT has invalid audience: ${String(audience)}`)
  }

  return {
    tenant_id,
    audience,
    role: typeof meta.role === 'string' ? meta.role : 'unknown',
    staff_id:        typeof meta.staff_id === 'string' ? meta.staff_id : undefined,
    workstation_id:  typeof meta.workstation_id === 'string' ? meta.workstation_id : undefined,
    company_id:      typeof meta.company_id === 'string' ? meta.company_id : undefined,
    customer_user_id: typeof meta.customer_user_id === 'string' ? meta.customer_user_id : undefined,
  }
}
```

---

### WR-02: `proxy.ts` is not exported as the Next.js 16 middleware entrypoint

**File:** `src/proxy.ts:92-97`
**Issue:** The file exports `proxy` as a named function and exports `config` for the matcher, but the Next.js middleware convention requires a default export named `middleware` (or a named export `middleware`). Next.js 16 resolves middleware from `src/middleware.ts` or `middleware.ts`; it will not pick up `src/proxy.ts` unless there is a `src/middleware.ts` that re-exports from `src/proxy.ts`. This file appears to be correctly named per CLAUDE.md ("src/proxy.ts renamed from middleware.ts in Next.js 16"), but the `proxy` export is a non-standard name. If Next.js 16 still uses the `middleware` convention internally and only the filename changed, the exported function must still be named `middleware`. Verify by checking whether a `src/middleware.ts` re-export exists (it was not in the file list provided for review). If the file is the complete middleware, the export name is wrong.
**Fix:**
```typescript
// src/proxy.ts — rename the exported function if Next.js 16 still requires `middleware`:
export async function middleware(request: NextRequest) { ... }
// OR if CLAUDE.md's "renamed from middleware.ts" means only the filename changed and
// Next.js reads the default export, add:
export default proxy
```
Confirm the actual Next.js 16 middleware resolution behavior and ensure CI fails if the proxy is silently not running.

---

### WR-03: `createWorkstation` uses `as any` cast to bypass type checking on the Supabase client

**File:** `src/modules/settings/actions/workstation.ts:42`
**Issue:** `const supabase = (await createClient()) as any` disables all type-checking on every subsequent `supabase.from(...)` call in this function. This is flagged by CLAUDE.md ("No `any`"). The comment justifies it as a placeholder until `supabase gen types` runs, but the cast is too broad — it silences the compiler on all three `supabase.from()` calls in the function, including the auth_user_id link step. If the `workstations` table shape changes in a future migration, TypeScript will not catch the mismatch here.
**Fix:** Use the placeholder `Database` type that already exists in `src/shared/db/types.ts`. The `workstations` table is already fully specified there with `WorkstationRow`, `WorkstationInsert`, and `WorkstationUpdate`. Remove the `as any` and rely on the typed client:
```typescript
const supabase = await createClient() // already typed as SupabaseClient<Database>
```
The `WorkstationRow` local type in `workstation.ts` (lines 17-28) duplicates the definition in `src/shared/db/types.ts` — remove the local duplicate.

---

### WR-04: `generateDeviceToken()` produces 36 effective random bytes, not 48 bytes of entropy

**File:** `src/modules/settings/actions/workstation.ts:31-33`
**Issue:** `crypto.randomBytes(48).toString('base64url').slice(0, 48)` generates 48 bytes of randomness, encodes them as base64url (which produces ~64 chars), then slices to 48 chars. The slice discards the last ~16 chars of the base64 output. The remaining 48 base64url chars encode only `48 * 6 / 8 = 36` bytes of entropy, not 48. This is still very strong (288 bits), but the comment ("48-char URL-safe random per DESIGN.md §3.3") implies 48 bytes of entropy. If DESIGN.md specifies 48 bytes, the implementation falls short. The test at `workstation.test.ts:161-171` confirms the token is 48 chars and URL-safe but does not verify entropy level.
**Fix:**
```typescript
function generateDeviceToken(): string {
  // 48 chars of base64url = 36 bytes of entropy (288 bits) — sufficient for device tokens.
  // To get exactly 48 bytes entropy, use randomBytes(36) + no-slice:
  return crypto.randomBytes(36).toString('base64url') // produces exactly 48 chars, 36 bytes entropy
  // OR to match the "48 bytes of entropy" spec:
  // return crypto.randomBytes(48).toString('base64url') // ~64 chars — update DESIGN.md §3.3
}
```
Align the implementation with DESIGN.md §3.3 or update the spec. The current code produces correct output (48 URL-safe chars) but wastes 12 bytes of generated randomness.

---

### WR-05: Proxy rate limiter uses `signInLimiter` for portal sign-in posts (wrong limiter)

**File:** `src/proxy.ts:36`
**Issue:** The proxy edge rate limiter selects `limiter = isPortal ? magicLinkPerIpLimiter : signInLimiter`. This means portal (`track.*`) requests get the IP-only magic-link limiter, and non-portal requests get the sign-in limiter. However, for the non-portal case (`app.*`), the proxy uses the same `signInLimiter` that the Server Action also uses (with key `proxy:${ip}`). The Server Action uses key `${ip}:${email}` (compound), while the proxy uses `proxy:${ip}` (IP only). These are different keys in the same limiter namespace (`rl:signin`). The proxy will count against the per-IP slot while the Server Action counts against the per-(IP+email) slot. A targeted attacker who uses many emails from one IP will exhaust the Server Action limiter but not the proxy limiter. This is not a critical flaw (defense-in-depth still works) but the limiter key inconsistency makes capacity planning and incident response harder.
**Fix:** Document the intentional key separation in a comment, or use a dedicated edge-proxy limiter instance with its own prefix (`rl:proxy:signin`) to avoid cross-contaminating the Server Action's counters.

---

### WR-06: Auth callback route redirects to `/jobs` — a route that does not exist in Phase 1

**File:** `src/app/(portal)/auth/callback/route.ts:20`
**Issue:** After a successful magic-link exchange, the callback unconditionally redirects to `/jobs`. This is a hard-coded path that will produce a 404 in production until the CRM module ships (Phase 2). Users who click their magic-link in Phase 1 will be authenticated and then land on a 404 page, which may appear as a broken flow. The portal home (`src/app/(portal)/page.tsx`) also redirects to `/jobs` (line 8), compounding the problem.
**Fix:**
```typescript
// Redirect to portal home which can show a "coming soon" or loading state
return NextResponse.redirect(new URL('/', request.url))
```
The portal root (`/`) already checks auth and redirects to `/jobs`, so the behavior is unchanged once Phase 2 ships — but the stub root page can be updated to show a loading state instead of silently redirecting to a 404.

---

### WR-07: `supabase/config.toml` minimum password length is 6, below the 8-char Schema requirement

**File:** `supabase/config.toml:180`
**Issue:** `minimum_password_length = 6` while the `SignInSchema` in `src/modules/auth/actions/sign-in.ts:10` enforces `z.string().min(8)`. This creates an inconsistency: Supabase Auth will accept passwords of 6-7 characters during invite acceptance (the user sets their password via the invite link, bypassing the application sign-in form), but the application sign-in form will then reject those passwords with "Invalid input". A user who sets a 7-character password at invite time will be permanently locked out of the application sign-in flow with a confusing non-enumeration-safe error.
**Fix:**
```toml
# supabase/config.toml
minimum_password_length = 8   # must match SignInSchema z.string().min(8)
```

---

### WR-08: Auth hook text-scan test (Test 6) uses `prosrc NOT LIKE '%UPDATE %'` — false negative risk

**File:** `supabase/tests/rls/test_auth_hook_invariants.sql:88-95`
**Issue:** Test 6 checks the hook body for `UPDATE ` (with a trailing space). A `SET updated_at` or `UPDATE\n` (with a newline in the SQL string) would pass the check. More importantly, `prosrc` in `pg_proc` strips leading/trailing whitespace inconsistently across Postgres versions. If someone adds `UPDATE  workstations` (double space) or `update workstations` (lowercase), the check passes. The test provides a false sense of security for exactly the scenario it is guarding against (Supabase Issue #29073 deadlock). The primary guard — provolatile = 's' (Test 1) — is correct and sufficient. Test 6 should be either strengthened or removed.
**Fix:**
```sql
-- Stronger pattern: case-insensitive, whitespace-agnostic
SELECT is(
  (SELECT
    lower(prosrc) NOT SIMILAR TO '%(insert into|update |delete from)%'
   FROM pg_proc
   WHERE proname = 'custom_access_token_hook'
     AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'app')),
  true,
  'app.custom_access_token_hook body contains no INSERT/UPDATE/DELETE (case-insensitive)'
);
```

---

### WR-09: `workstation.ts` creates `synthetic_email` using a second `crypto.randomUUID()` — unlinked UUID

**File:** `src/modules/settings/actions/workstation.ts:64`
**Issue:** `const synthetic_email = \`workstation-${crypto.randomUUID()}@workstations.pops.local\``

The UUID embedded in the synthetic email is a freshly generated UUID with no relationship to the workstation row ID (`ws.id`). The workstation row ID (`ws.id`) is already a UUID assigned by Postgres. Using `ws.id` in the email makes the email deterministic and recoverable from the row — useful for debugging and re-enrollment. Using a random UUID creates a second opaque identifier that must be stored or looked up separately. The test at `workstation.test.ts:158` asserts the email matches `/^workstation-[0-9a-f-]{36}@workstations\.pops\.local$/` but does not assert the UUID equals `ws.id`.

The current design means that if `createWorkstation` is called and the auth user creation step fails and needs to be retried, the synthetic email changes each retry, potentially leaving orphaned `auth.users` rows from previous failed attempts.
**Fix:**
```typescript
// Use the workstation row's own UUID for determinism and debuggability
const synthetic_email = `workstation-${ws.id}@workstations.pops.local`
```
Update the test assertion to verify the email contains `ws.id` rather than any UUID.

---

## Info

### IN-01: `sentry.client.config.ts` uses `process.env.NEXT_PUBLIC_VERCEL_ENV` — non-standard variable

**File:** `sentry.client.config.ts:6`
**Issue:** `environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development'` — Vercel's built-in environment variable is `VERCEL_ENV` (server-side) or `NEXT_PUBLIC_VERCEL_ENV` (if manually added to Vercel project settings). It is not injected automatically as a `NEXT_PUBLIC_*` var. In practice this will silently fall back to `'development'` in production unless the variable is manually configured in Vercel's environment variable dashboard. The server/edge configs (once the hardcoded DSN is fixed) should use `VERCEL_ENV` (no `NEXT_PUBLIC_` prefix) since they run server-side.
**Fix:** Add `NEXT_PUBLIC_VERCEL_ENV` to Vercel's project environment variables (set to `$VERCEL_ENV` in build settings), or use `process.env.NODE_ENV` as a fallback.

---

### IN-02: `package.json` `madge:check` skips the check silently when `src/modules` does not exist

**File:** `package.json:11`
**Issue:** `"madge:check": "[ -d src/modules ] && madge --circular src/modules || echo 'src/modules not yet created — skipping circular check'"` — this always exits 0 whether or not circular dependencies exist. Once modules exist and are populated (Phase 2+), a developer who deletes `src/modules` accidentally (or a CI environment with a shallow checkout) will get a green lint pass while the circular dependency guard is silently disabled. The `|| echo` swallows the non-zero exit from the directory check, making the whole command always succeed.
**Fix:**
```json
"madge:check": "madge --circular src/modules"
```
Let CI fail naturally if `src/modules` is missing. Circular dependency detection should be a hard failure, not silently skippable.

---

### IN-03: `vitest.config.ts` sets `globals: true` but `tsconfig.json` does not include Vitest globals types

**File:** `vitest.config.ts:8`
**Issue:** `globals: true` in the Vitest config injects `describe`, `it`, `expect`, etc. as global identifiers. Without adding `"vitest/globals"` to `tsconfig.json`'s `types` array (or a `vitest.d.ts` reference file), TypeScript will not know about these globals and will produce type errors on `pnpm type-check` for any test file that uses them without explicit imports. The test files (`magic-link.test.ts`, `sign-in.test.ts`, `workstation.test.ts`) do import `describe`, `it`, `expect`, `vi`, and `beforeEach` from `'vitest'` explicitly — so this is not currently causing errors. But if a developer writes a test file relying on the globals (trusting `globals: true`), type-check will fail.
**Fix:** Either add to `tsconfig.json`:
```json
"compilerOptions": {
  "types": ["vitest/globals"]
}
```
Or document that Vitest globals are enabled at runtime but explicit imports are required for TypeScript.

---

### IN-04: `src/app/(portal)/auth/callback/route.ts` handles both staff magic-link callbacks and customer sign-in

**File:** `src/app/(portal)/auth/callback/route.ts:1-21`
**Issue:** This route is in the `(portal)` route group but handles `exchangeCodeForSession` generically. Because the proxy enforces audience-domain separation (staff JWTs on `track.*` get redirected to `app.*`), a staff member who uses a magic link sent to `track.*` will exchange the code here, obtain a staff JWT, and then immediately be redirected by the proxy to `app.*`. This is probably the intended flow, but the behavior depends entirely on the proxy running before the redirect resolves. There is no explicit check in the callback route to verify the resulting session is a customer session — any token exchange is accepted. As Phase 2+ adds staff magic-link flows (password reset, re-auth), this ambiguity should be resolved with an explicit audience check post-exchange.

---

_Reviewed: 2026-05-02T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
