---
phase: 01-foundation
plan: 05
subsystem: auth
tags: [auth, server-actions, rate-limiting, anti-enumeration, vitest, sign-in, magic-link, workstation, module-stubs]
dependency_graph:
  requires: [01-03, 01-04]
  provides: [signInStaff, signOutStaff, requestCustomerMagicLink, createWorkstation, office-sign-in-page, portal-sign-in-page, auth-callback-route, wave-1-module-stubs]
  affects: [01-06, phase-02, phase-03, phase-04]
tech_stack:
  added: [vitest, jsdom, zod-server-actions, vitest-jsdom]
  patterns: [server-action-zod-validation, anti-enumeration, dual-rate-limiting, tdd-unit-tests, module-stub-pattern]
key_files:
  created:
    - vitest.config.ts
    - src/modules/auth/types.ts
    - src/modules/auth/actions/sign-in.ts
    - src/modules/auth/actions/sign-out.ts
    - src/modules/auth/actions/magic-link.ts
    - src/modules/auth/actions/sign-in.test.ts
    - src/modules/auth/actions/magic-link.test.ts
    - src/modules/auth/index.ts
    - src/modules/settings/actions/workstation.ts
    - src/modules/settings/actions/workstation.test.ts
    - src/modules/settings/index.ts
    - src/app/(office)/sign-in/page.tsx
    - src/app/(portal)/sign-in/page.tsx
    - src/app/(portal)/auth/callback/route.ts
    - src/app/api/webhooks/route.ts
    - src/modules/crm/index.ts
    - src/modules/jobs/index.ts
    - src/modules/packets/index.ts
    - src/modules/scanning/index.ts
    - src/modules/timeline/index.ts
    - src/modules/dashboard/index.ts
    - src/modules/portal/index.ts
    - src/modules/tags/index.ts
  modified:
    - src/shared/db/types.ts
    - package.json
    - pnpm-lock.yaml
decisions:
  - "Placeholder types in src/shared/db/types.ts extended with typed WorkstationRow interface to enable workstation.ts to type-check; real types generated via supabase gen types in Plan 06"
  - "Supabase client cast to any in workstation.ts is justified by placeholder types and documented with eslint-disable comment; removed when Plan 06 generates real types"
  - "Server Action in sign-in page uses searchParams redirect pattern (not useFormState) because page is a Server Component and Phase 1 avoids client component overhead for auth"
  - "Magic-link rate limit errors swallowed via .catch(() => undefined) — both email and IP limiters — to maintain anti-enumeration guarantee per DESIGN.md §5.5"
  - "jsdom added as devDependency to satisfy vitest jsdom environment requirement"
metrics:
  duration_minutes: 20
  completed_date: "2026-05-02"
  tasks_completed: 2
  files_created: 23
  files_modified: 3
---

# Phase 01 Plan 05: Auth Server Actions + Sign-in UI Summary

**One-liner:** signInStaff + signOutStaff + requestCustomerMagicLink (Zod + dual rate-limit + anti-enumeration) + createWorkstation (3-step: insert row, create synthetic user, link auth_user_id) + office/portal sign-in pages + portal auth callback route + 8 Wave-1 module stubs with vitest.config.ts as Step 0.

---

## What Was Built

### Auth Module (`src/modules/auth/`)

- **`sign-in.ts`** — `signInStaff` Server Action: Zod validates email+password, reads IP from `x-forwarded-for` headers, applies `signInLimiter` compound key `${ip}:${email}`, calls `supabase.auth.signInWithPassword`, returns anti-enumeration error string on any auth failure
- **`sign-out.ts`** — `signOutStaff` Server Action: calls `supabase.auth.signOut()`, redirects to `/sign-in`
- **`magic-link.ts`** — `requestCustomerMagicLink` Server Action: Zod validates email, fires both `magicLinkPerEmailLimiter` and `magicLinkPerIpLimiter` with `.catch(() => undefined)` (errors swallowed for anti-enumeration), calls `signInWithOtp` with `shouldCreateUser: false` and `emailRedirectTo` pointing to portal `/auth/callback`, always returns `{ success: true }` regardless of email existence or rate-limit state
- **`types.ts`** — `SignInResult`, `MagicLinkResult` discriminated unions
- **`index.ts`** — public API: `signInStaff`, `signOutStaff`, `requestCustomerMagicLink` + re-exported types

### Settings Module (`src/modules/settings/`)

- **`actions/workstation.ts`** — `createWorkstation` Server Action implementing the canonical 3-step flow:
  1. `requireOfficeStaff()` + `getCurrentClaims()` (tenant_id from JWT only — never from caller parameter)
  2. `generateDeviceToken()`: `crypto.randomBytes(48).toString('base64url').slice(0, 48)` — 48-char URL-safe token
  3. INSERT `workstations` row with `tenant_id, name, default_stage, physical_location, device_token`
  4. `supabaseAdmin.auth.admin.createUser({ email: workstation-{uuid}@workstations.pops.local, app_metadata: { workstation_id: ws.id, audience: 'staff_shop', ... } })` — `workstation_id` baked in at creation time (anti-race)
  5. UPDATE `workstations.auth_user_id = authData.user.id`
  6. Returns `{ workstation: ws, enrollment_url: ${APP_HOST}/scan/enroll?token=${device_token} }`
- **`index.ts`** — public API: `createWorkstation`

### Sign-in UI Surfaces

- **`src/app/(office)/sign-in/page.tsx`** — Exact UI-SPEC.md Surface 1 layout: `<main>` landmark → `max-w-[400px]` Card → wordmark `<p>` → `<h1>Sign in</h1>` → subtext → destructive Alert (if error) → form with email+password inputs + primary Sign In button + forgot-password link. Server Action `handleSignIn` calls `signInStaff`, redirects to `/` on success, encodes error in searchParams (anti-enumeration-safe)
- **`src/app/(portal)/sign-in/page.tsx`** — Customer magic-link page: email field + "Send magic link" button. On success (always), redirects to `?sent=true` state showing "Check your email" screen. Anti-enumeration guaranteed by always showing same success message
- **`src/app/(portal)/auth/callback/route.ts`** — GET handler: extracts `code` param, calls `supabase.auth.exchangeCodeForSession(code)`, redirects to `/` on success or `/sign-in?error=invalid_link` on failure
- **`src/app/api/webhooks/route.ts`** — Phase 1 stub POST handler returning `{ ok: true }`

### Wave-1 Module Stubs (8 modules)

All 8 remaining Wave-1 modules have `index.ts` stubs with `export {}` and DESIGN.md §4.3 references: `crm`, `jobs`, `packets`, `scanning`, `timeline`, `dashboard`, `portal`, `tags`. Cross-module imports compile cleanly from this plan forward.

### Vitest Config

- **`vitest.config.ts`** — Created as Step 0 (before any test file) per revision iteration W2: `defineConfig` with `@vitejs/plugin-react`, `jsdom` environment, `@` path alias. `jsdom` added as devDependency.

---

## Anti-Enumeration Confirmation

All three server actions implement anti-enumeration response patterns:

| Action | Method | Anti-Enumeration Guarantee |
|--------|--------|---------------------------|
| `signInStaff` | Returns same error string regardless of whether email exists or password is wrong | Verbatim copy: "The email or password you entered is not correct. Please try again." — tested in `sign-in.test.ts` |
| `requestCustomerMagicLink` | Always returns `{ success: true }` | Rate-limit failures swallowed via `.catch()`, signInWithOtp errors swallowed, inactive email returns success — tested in `magic-link.test.ts` |
| Office sign-in page | Encodes only the action's anti-enumeration-safe error message in searchParams | Raw Supabase errors never exposed to client |

---

## createWorkstation 3-Step Ordering Confirmation

The canonical 3-step ordering per DESIGN.md §4.3 Module 8 and PATTERNS.md is strictly followed:

1. **INSERT workstations row first** → get UUID (`ws.id`)
2. **CREATE synthetic auth user** with `workstation_id: ws.id` in `app_metadata` from creation time (no race window where workstation_id is absent from JWT)
3. **UPDATE workstations.auth_user_id** ← `authData.user.id`

Each step throws with a descriptive message on failure. Steps are sequential — step 3 only runs if step 2 succeeds.

---

## Public API Surfaces

### `src/modules/auth/index.ts`

```typescript
export { signInStaff } from './actions/sign-in'       // SignInResult
export { signOutStaff } from './actions/sign-out'      // void (redirects)
export { requestCustomerMagicLink } from './actions/magic-link'  // MagicLinkResult
export type { SignInResult, MagicLinkResult } from './types'
```

### `src/modules/settings/index.ts`

```typescript
export { createWorkstation } from './actions/workstation'
// Returns: { workstation: WorkstationRow, enrollment_url: string }
```

---

## vitest.config.ts — Step 0 Confirmation

`vitest.config.ts` was created **before any test file** per revision iteration W2. Creation order in this plan:
1. `vitest.config.ts` (Step 0) — committed first, verified runner loads with "No test files found" (config parses correctly)
2. Test files (`sign-in.test.ts`, `magic-link.test.ts`, `workstation.test.ts`) — created in Step 1

---

## Session TTL Note

The 30-day office / 1-hour workstation session TTL (AUTH-02 requirement) is implemented via Supabase project-global JWT expiry = 3600s combined with refresh-token rotation for office/customer audiences — providing a 30-day felt session with 1-hour JWT validity. This configuration step (Supabase Dashboard → Auth → JWT expiry = 3600s) lives in **Plan 06 Task 2** per RESEARCH.md A1 RESOLVED. The `createWorkstation` server action's synthetic user's 1-hour effective TTL is enforced by the same project-global setting.

---

## Manual Smoke Result

Automated smoke (`pnpm dev` visual verification) is deferred to Plan 06 as noted in the plan. The sign-in page architecture was verified via type-check + lint + tests; visual rendering against live Supabase requires the env vars configured in Plan 06 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY).

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Placeholder types extended with WorkstationRow stub**
- **Found during:** Task 1 (type-check after writing workstation.ts)
- **Issue:** `src/shared/db/types.ts` used generic `Record<string, unknown>` for all tables, causing TypeScript to resolve `from('workstations').insert(...)` as `never`. This prevented `pnpm type-check` from passing.
- **Fix:** Extended `src/shared/db/types.ts` with a typed `WorkstationRow` interface and `WorkstationInsert`/`WorkstationUpdate` types using an interface with named key + index signature. Supabase client `from('workstations')` calls in `workstation.ts` were cast to `any` (with justifying ESLint comment) since the interface + index signature approach still results in `never` at the Supabase generic resolution layer. The `any` cast is removed automatically when Plan 06 generates real types via `supabase gen types typescript --local`.
- **Files modified:** `src/shared/db/types.ts`, `src/modules/settings/actions/workstation.ts`
- **Commit:** 04bf3c9

**2. [Rule 3 - Blocking issue] jsdom devDependency missing for Vitest jsdom environment**
- **Found during:** Task 1, Step 0 (vitest.config.ts verification)
- **Issue:** vitest reported `MISSING DEPENDENCY: Cannot find dependency 'jsdom'` when running with `environment: 'jsdom'` in config
- **Fix:** `pnpm add -D jsdom`
- **Files modified:** `package.json`, `pnpm-lock.yaml`
- **Commit:** 04bf3c9

---

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| 8 Wave-1 module stubs | `src/modules/{crm,jobs,packets,scanning,timeline,dashboard,portal,tags}/index.ts` | Intentional — full implementations in Phase 2+ per DESIGN.md module wave map. These stubs allow cross-module imports to compile without implementation |
| Webhooks route | `src/app/api/webhooks/route.ts` | Intentional Phase 1 stub — Resend webhook handling wired in Phase 2 |
| Portal callback redirect target | `/` instead of `/jobs` | Intentional — portal jobs page built in Phase 4; placeholder `/` redirect until then |

These stubs do not prevent the plan's goal from being achieved — the goal is the auth wiring, not the Phase 2+ module implementations.

---

## Threat Flags

No new security-relevant surface not covered by the plan's threat model. All trust boundaries are as documented in the plan's `<threat_model>` section:
- Sign-in Server Action: Zod + rate-limit + anti-enumeration implemented
- Magic-link Server Action: dual rate-limit + anti-enumeration + shouldCreateUser: false implemented
- createWorkstation: requireOfficeStaff gate + tenant_id from JWT only implemented
- Auth callback: exchangeCodeForSession validation with generic error redirect implemented

---

## Self-Check: PASSED

Created files verified:
- `vitest.config.ts` ✓
- `src/modules/auth/index.ts` ✓
- `src/modules/auth/actions/sign-in.ts` ✓
- `src/modules/auth/actions/sign-out.ts` ✓
- `src/modules/auth/actions/magic-link.ts` ✓
- `src/modules/settings/actions/workstation.ts` ✓
- `src/modules/settings/index.ts` ✓
- `src/app/(office)/sign-in/page.tsx` ✓
- `src/app/(portal)/sign-in/page.tsx` ✓
- `src/app/(portal)/auth/callback/route.ts` ✓
- `src/app/api/webhooks/route.ts` ✓
- All 8 module stubs ✓

Commits verified:
- `04bf3c9` (Task 1) ✓
- `b74a9eb` (Task 2) ✓

Quality gates:
- `pnpm type-check` exits 0 ✓
- `pnpm lint` exits 0 ✓
- `pnpm test --run`: 3 test files, 21 tests, all GREEN ✓
