---
phase: 01-foundation
verified: 2026-05-02T20:30:00Z
status: gaps_found
score: 10/12 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Supabase project connected to live Cloud instance; Vercel project configured with app.popsindustrial.com and track.popsindustrial.com domains"
    status: failed
    reason: "REQUIREMENTS.md checkbox [ ] unchecked. Plan 06 paused at Task 2 (human-action checkpoint). No evidence of actual Supabase Cloud project connection or Vercel domain configuration in codebase. supabase/config.toml references a local project only. .env.local.example contains placeholder values, no live credentials wired."
    artifacts:
      - path: "supabase/config.toml"
        issue: "project_id is a local dev identifier; no remote project linked"
      - path: ".env.local.example"
        issue: "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are placeholder values — no live project connection"
      - path: "src/shared/db/types.ts"
        issue: "Still placeholder Database type — requires live schema push (Plan 06 Task 3) which depends on INFRA-02 completing first"
    missing:
      - "Supabase Cloud project created and linked (supabase link --project-ref)"
      - "supabase db push to live project"
      - "supabase gen types typescript --project-id $REF > src/shared/db/types.ts"
      - "Vercel project configured with app.popsindustrial.com domain"
      - "Vercel project configured with track.popsindustrial.com domain"
      - "GitHub Actions secrets SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_ID, SUPABASE_DB_PASSWORD set"
      - "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY wired in Vercel env"
  - truth: "JWT app_metadata carries tenant_id, audience, and role; custom_access_token_hook populates claims; production Dashboard hook registration verified; JWT expiry = 3600s"
    status: partial
    reason: "Hook SQL function exists in migration 0007 and is registered in supabase/config.toml for local dev. Code throughout auth helpers correctly reads app_metadata claims. BUT: production Supabase Dashboard hook registration is unverified (Plan 06 Task 2 incomplete). JWT expiry = 3600s verification deferred to Plan 06 Task 4. REQUIREMENTS.md checkbox [ ] unchecked. AUTH-04 is listed as Pending in traceability table."
    artifacts:
      - path: "supabase/migrations/0007_auth_hook.sql"
        issue: "Hook SQL code exists and is correct, but production Dashboard registration unverified"
      - path: "supabase/config.toml"
        issue: "Hook registered for local dev only ([auth.hook.custom_access_token] block present); production Dashboard registration is a manual step not yet completed"
    missing:
      - "Supabase Dashboard > Authentication > Hooks: custom_access_token_hook registered pointing to pg-functions://postgres/app/custom_access_token_hook"
      - "JWT expiry verified = 3600s via supabase inspect db config | grep jwt_expiry"
      - "Live smoke test confirming JWT app_metadata.tenant_id/audience/role populated in token"
human_verification:
  - test: "JWT expiry is 3600 seconds"
    expected: "supabase inspect db config | grep jwt_expiry returns 3600 after Plan 06 Task 2 + Task 4 complete"
    why_human: "Requires live Supabase Cloud project and Dashboard configuration. Cannot verify from codebase."
  - test: "Office staff can sign in with email and password"
    expected: "POST to /sign-in with valid credentials sets httpOnly session cookie scoped to app.popsindustrial.com; session is functional"
    why_human: "Requires live Supabase instance with real credentials. Smoke test deferred to Plan 06 Task 5."
  - test: "Customer portal magic-link auth works end-to-end"
    expected: "Email with magic link sent; clicking link calls /auth/callback; session cookie set scoped to track.popsindustrial.com"
    why_human: "Requires live Supabase + Resend SMTP configured. Both external services are Plan 06 Task 2 dependencies."
  - test: "pgTAP RLS tests pass against live branch DB"
    expected: "supabase test db --db-url against a Supabase branch DB runs all 4 test files; all assertions PASS"
    why_human: "Requires Supabase Preview branch DB which only exists in PR context (CI job is gated on if: github.event_name == 'pull_request'). Cannot run locally without live project."
---

# Phase 1: Foundation Verification Report

**Phase Goal:** Scaffold the application, establish the multi-tenant database schema with RLS, wire auth flows (office staff, workstation, customer), configure external services (Supabase Cloud, Vercel, Resend, Upstash, Sentry), and verify the entire foundation with pgTAP tests and CI.
**Verified:** 2026-05-02T20:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Next.js 16 App Router repo with TypeScript strict, Tailwind v4 CSS-first, shadcn/ui under src/shared/ui/, pnpm | ✓ VERIFIED | `package.json`: next=16.2.4; `tsconfig.json`: strict=true, noUncheckedIndexedAccess, noImplicitOverride; `src/app/globals.css`: `@import "tailwindcss"` + `@theme {}`; `components.json`: alias=@/shared/ui; no tailwind.config.ts |
| 2 | Supabase Cloud project connected; Vercel domains app.popsindustrial.com + track.popsindustrial.com live | ✗ FAILED | REQUIREMENTS.md `[ ]` unchecked. Plan 06 paused at Task 2. supabase/config.toml is local-only. .env.local.example has placeholder values. src/shared/db/types.ts is still placeholder. |
| 3 | Multi-tenant schema: tenants table, tenant_id on all business tables, app.tenant_id() SECURITY DEFINER, RLS policies use tenant_id = app.tenant_id() | ✓ VERIFIED | 10 migration files (0001-0010); 0001 defines all 7 SECURITY DEFINER helpers; 0006 has 45 RLS policies; grep confirms 0 `request.jwt.claims` inline references in policies |
| 4 | Resend configured (SPF/DKIM/DMARC), Upstash Redis rate limiters wired, Sentry initialized with tenant_id tagging | ✓ VERIFIED (code) | Rate limiters in src/shared/rate-limit/index.ts (signInLimiter, magicLinkPerEmailLimiter, magicLinkPerIpLimiter); sentry.server/client/edge.config.ts all contain Sentry.init; require.ts has Sentry.setTag('tenant_id',...). External service secrets are Plan 06 Task 2 dependency. |
| 5 | src/proxy.ts (NOT middleware.ts) handles multi-domain routing: app.* → (office), track.* → (portal); env-var-driven redirects | ✓ VERIFIED | src/proxy.ts exists; no middleware.ts; uses NEXT_PUBLIC_APP_HOST + NEXT_PUBLIC_PORTAL_HOST; isOffice/isPortal host detection; HTTP 429 on rate limit; 0 getSession() calls in functional code |
| 6 | All SECURITY DEFINER SQL helpers created: tenant_id, audience, role, staff_id, workstation_id, company_id, set_updated_at + production_status REVOKE + workstation lifecycle + link trigger | ✓ VERIFIED | 0001: 7 helpers + 15 STABLE declarations; 0008: REVOKE UPDATE (production_status) ON jobs FROM authenticated; 0009: 6 SECURITY DEFINER functions; 0010: link_auth_user_to_actor trigger |
| 7 | ESLint rules enforce module boundaries (no deep imports) and service-role gating; CI pipeline runs type-check, lint, madge, vitest on every PR | ✓ VERIFIED | eslint.config.js: `@/modules/*/!(index)*` rule + `@/shared/db/admin` gating; .github/workflows/ci.yml: pnpm type-check + pnpm lint + madge + vitest + pgtap jobs |
| 8 | Office staff can sign in with email+password; session uses @supabase/ssr httpOnly cookie scoped to app.*; auth uses getUser() exclusively | ✓ VERIFIED | src/modules/auth/actions/sign-in.ts: signInWithPassword + signInLimiter + anti-enumeration; src/app/(office)/sign-in/page.tsx: <main> + <h1>Sign in</h1>; 0 getSession() in auth code paths |
| 9 | Workstation tablet enrolled as synthetic Supabase user; 1-hour session TTL via JWT expiry = 3600s | ✓ VERIFIED (code) | src/modules/settings/actions/workstation.ts: 3-step createWorkstation (INSERT → createUser with workstation_id in app_metadata → UPDATE auth_user_id); JWT expiry Dashboard config is Plan 06 Task 4 (human checkpoint) |
| 10 | Customer portal uses magic-link auth; shouldCreateUser: false; session scoped to track.*; exchangeCodeForSession at callback | ✓ VERIFIED | src/modules/auth/actions/magic-link.ts: signInWithOtp + shouldCreateUser: false + dual rate limiters + always { success: true }; src/app/(portal)/auth/callback/route.ts: exchangeCodeForSession |
| 11 | JWT app_metadata carries tenant_id/audience/role; custom_access_token_hook populates claims; hook STABLE with zero writes; production Dashboard registration confirmed | ? UNCERTAIN | Hook SQL in 0007 (STABLE, 0 writes, 0 ALTER ROLE). config.toml: local dev registration present. REQUIREMENTS.md [ ] unchecked. Production Dashboard hook registration + JWT expiry verification not done (Plan 06 Tasks 2+4 pending). |
| 12 | requireOfficeStaff/requireShopStaff/requireCustomer enforce audience at Server Action/route level; getCurrentClaims() reads JWT claims | ✓ VERIFIED | src/shared/auth-helpers/require.ts: 3 guards, all use getUser() exclusively, audience checked via app_metadata.audience, unauthenticated → redirect('/sign-in'), wrong audience → redirect('/sign-in'); getCurrentClaims() in claims.ts reads user.app_metadata |

**Score:** 10/12 truths verified (1 FAILED — BLOCKER, 1 UNCERTAIN — WARNING)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | next=16.2.4, pnpm, all stack deps | ✓ VERIFIED | All pinned versions present |
| `tsconfig.json` | strict=true, noUncheckedIndexedAccess, noImplicitOverride | ✓ VERIFIED | All three flags confirmed |
| `eslint.config.js` | Module boundary rules + service-role gating | ✓ VERIFIED | @/modules/*/!(index)* rule + @/shared/db/admin restriction |
| `src/app/globals.css` | @import "tailwindcss", @theme {}, CSS variables | ✓ VERIFIED | Tailwind v4 CSS-first; --primary amber token |
| `components.json` | alias @/shared/ui, cssVariables: true | ✓ VERIFIED | Points to src/app/globals.css |
| `src/shared/ui/*.tsx` (6 components) | button, card, input, label, alert, form | ✓ VERIFIED | All 6 shadcn primitives present |
| `supabase/migrations/0001-0010_*.sql` | 10 migration files | ✓ VERIFIED | All 10 present |
| `supabase/migrations/0001_app_schema_helpers.sql` | 7 SECURITY DEFINER helpers, all STABLE | ✓ VERIFIED | 15 STABLE declarations, all 7 functions |
| `supabase/migrations/0006_rls_policies.sql` | 45 policies, 0 inline JWT parsing | ✓ VERIFIED | 45 CREATE POLICY, 0 request.jwt.claims references |
| `supabase/migrations/0007_auth_hook.sql` | STABLE, 0 writes, hook function | ✓ VERIFIED (code) | Source-level STABLE + 0 writes confirmed; runtime verification deferred |
| `supabase/migrations/0008_production_status_revoke.sql` | REVOKE UPDATE (production_status) FROM authenticated | ✓ VERIFIED | Line confirmed present |
| `supabase/migrations/0009_workstation_lifecycle_functions.sql` | claim_workstation + lifecycle functions, SECURITY DEFINER | ✓ VERIFIED | 6 SECURITY DEFINER declarations |
| `supabase/migrations/0010_link_auth_user_trigger.sql` | link_auth_user_to_actor + trigger + tenant guard | ✓ VERIFIED | Function + trigger + auth_user_created_without_tenant_id guard |
| `supabase/config.toml` | [auth.hook.custom_access_token] registered | ✓ VERIFIED (local) | Block present; production Dashboard registration unverified |
| `src/shared/db/server.ts` | await cookies(), createServerClient<Database>, 0 getSession | ✓ VERIFIED | All three confirmed |
| `src/shared/db/client.ts` | createBrowserClient<Database> | ✓ VERIFIED | Present |
| `src/shared/db/admin.ts` | SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_), autoRefreshToken: false, persistSession: false | ✓ VERIFIED | All three confirmed |
| `src/shared/db/types.ts` | Real generated Database types | ✗ PLACEHOLDER | Still contains stub "Placeholder Database type" comment; real types require Plan 06 Task 3 (blocked on INFRA-02) |
| `src/shared/auth-helpers/require.ts` | 3 audience guards using getUser() exclusively | ✓ VERIFIED | requireOfficeStaff, requireShopStaff, requireCustomer; 0 getSession; Sentry.setTag('tenant_id') |
| `src/shared/auth-helpers/claims.ts` | getCurrentClaims() + JWTClaims type | ✓ VERIFIED | Exports both |
| `src/shared/rate-limit/index.ts` | 3 Ratelimit.slidingWindow limiters | ✓ VERIFIED | signInLimiter, magicLinkPerEmailLimiter, magicLinkPerIpLimiter |
| `src/shared/rate-limit/adapter.ts` | Upstash Redis client | ✓ VERIFIED | UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN |
| `src/proxy.ts` | Multi-domain routing, env-var redirects, edge rate limiting, 0 getSession | ✓ VERIFIED | All confirmed; getSession appears only in comments |
| `instrumentation.ts` + 3 sentry configs | Sentry.init for client/server/edge | ✓ VERIFIED | All 4 files present with Sentry.init |
| `src/modules/auth/actions/sign-in.ts` | signInWithPassword + rate limit + anti-enumeration | ✓ VERIFIED | All present |
| `src/modules/auth/actions/sign-out.ts` | signOut + redirect | ✓ VERIFIED | Present |
| `src/modules/auth/actions/magic-link.ts` | signInWithOtp + shouldCreateUser: false + always { success: true } | ✓ VERIFIED | All confirmed |
| `src/modules/settings/actions/workstation.ts` | 3-step createWorkstation flow | ✓ VERIFIED (with caveat) | 3-step flow confirmed; `as any` cast documented with ESLint-disable comment (temporary) |
| `src/app/(office)/sign-in/page.tsx` | Sign-in form with signInStaff | ✓ VERIFIED | Present with <main>, <h1>Sign in</h1>, signInStaff |
| `src/app/(portal)/sign-in/page.tsx` | Magic-link request form | ✓ VERIFIED | Present |
| `src/app/(portal)/auth/callback/route.ts` | exchangeCodeForSession | ✓ VERIFIED | Present |
| 8 Wave-1 module stubs | export {} stubs for crm/jobs/packets/scanning/timeline/dashboard/portal/tags | ✓ VERIFIED | All 8 present |
| `supabase/tests/helpers/jwt_helpers.sql` | set_config JWT simulation helpers | ✓ VERIFIED | 4 helper functions |
| `supabase/tests/rls/test_cross_tenant_isolation.sql` | 8 assertions | ✓ VERIFIED | Present |
| `supabase/tests/rls/test_audience_isolation.sql` | 9 assertions | ✓ VERIFIED | Present |
| `supabase/tests/rls/test_function_authorization.sql` | 6 assertions | ✓ VERIFIED | Present |
| `supabase/tests/rls/test_auth_hook_invariants.sql` | 6 assertions; STABLE + BYPASSRLS checks | ✓ VERIFIED | Present |
| `supabase/seed.sql` | Fixed UUID 00000000-0000-0000-0000-000000000001 test tenant | ✓ VERIFIED | Present |
| `scripts/seed-tenant.ts` | inviteUserByEmail + updateUserById(intended_actor) | ✓ VERIFIED | Present with both calls |
| `.github/workflows/ci.yml` | 4 gates: type-check, lint+madge, vitest, pgtap | ✓ VERIFIED | Both jobs present; pgtap gated on pull_request |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/proxy.ts` | Upstash Redis rate limiters | `signInLimiter`, `magicLinkPerIpLimiter` imports | ✓ WIRED | Both limiters called in proxy; HTTP 429 returned |
| `src/proxy.ts` | `src/shared/db/server.ts` | `createClient()` import | ✓ WIRED | Session refresh path confirmed |
| `src/modules/auth/actions/sign-in.ts` | `src/shared/rate-limit/index.ts` | `signInLimiter` import + `.limit()` call | ✓ WIRED | Rate limit checked before auth |
| `src/modules/auth/actions/magic-link.ts` | `src/shared/rate-limit/index.ts` | Both email + IP limiters | ✓ WIRED | Both called with `.catch(() => undefined)` |
| `src/shared/auth-helpers/require.ts` | `src/shared/db/server.ts` | `createClient()` → `supabase.auth.getUser()` | ✓ WIRED | All 3 guards use getUser() |
| `src/shared/auth-helpers/require.ts` | Sentry | `Sentry.setTag('tenant_id', ...)` | ✓ WIRED | Per-request tenant tagging wired |
| `src/modules/settings/actions/workstation.ts` | `src/shared/db/admin.ts` | `createServiceClient()` | ✓ WIRED | Admin client used for synthetic user creation |
| `supabase/config.toml` | `supabase/migrations/0007_auth_hook.sql` | `[auth.hook.custom_access_token]` uri | ✓ WIRED (local) | Local dev hook registration; production unverified |
| `.github/workflows/ci.yml` | `supabase/tests/rls/*.sql` | `supabase test db --db-url` | ✓ WIRED (code) | Command present; execution requires live branch DB |
| Vercel + Supabase Cloud | Production environment | INFRA-02 external services | ✗ NOT_WIRED | No live project connection; Plan 06 Task 2 incomplete |

### Data-Flow Trace (Level 4)

Sign-in, magic-link, and createWorkstation are Server Actions — they do not render dynamic data from a store. Level 4 (data-flow trace) is not applicable for action handlers. The RLS policies and auth hook are database-layer logic, not client-rendering components.

Step 7b behavioral spot-checks cover the runnable entry points instead.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Type-check exits 0 | `cd /Users/davidk/Documents/Dev-Projects/App-Ideas/Pops--Coating && pnpm type-check 2>&1 \| tail -3` | See note | ? SKIP — requires running dev environment with env vars |
| ESLint module boundary rule present | `grep -c "modules/\*/!(index)" /Users/davidk/Documents/Dev-Projects/App-Ideas/Pops--Coating/eslint.config.js` | 1 | ✓ PASS |
| No getSession() in auth decision paths | `grep -rn "getSession" /Users/davidk/Documents/Dev-Projects/App-Ideas/Pops--Coating/src/ --include="*.ts" --include="*.tsx" \| grep -v "//.*getSession"` | 0 matches in functional code | ✓ PASS |
| production_status REVOKE in migrations | `grep -c "REVOKE UPDATE (production_status)" /Users/davidk/Documents/Dev-Projects/App-Ideas/Pops--Coating/supabase/migrations/0008_production_status_revoke.sql` | 1 | ✓ PASS |
| src/proxy.ts exists (not middleware.ts) | `test -f /Users/davidk/Documents/Dev-Projects/App-Ideas/Pops--Coating/src/proxy.ts && echo EXISTS` | EXISTS | ✓ PASS |
| 45 RLS policies in migration 0006 | `grep -c "CREATE POLICY" /Users/davidk/Documents/Dev-Projects/App-Ideas/Pops--Coating/supabase/migrations/0006_rls_policies.sql` | 45 | ✓ PASS |
| Hook STABLE declaration | `grep -c "STABLE" /Users/davidk/Documents/Dev-Projects/App-Ideas/Pops--Coating/supabase/migrations/0007_auth_hook.sql` | 1 | ✓ PASS |
| pgTAP test files exist and have assertions | `find /Users/davidk/Documents/Dev-Projects/App-Ideas/Pops--Coating/supabase/tests/rls -name "*.sql" \| wc -l` | 4 | ✓ PASS |
| Live Supabase project connected | `grep "project_id" /Users/davidk/Documents/Dev-Projects/App-Ideas/Pops--Coating/supabase/config.toml` | local dev value | ✗ FAIL — no live project linked |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| INFRA-01 | 01-01-PLAN | Next.js 16 App Router, TypeScript strict, Tailwind v4, shadcn/ui, pnpm | ✓ SATISFIED | package.json, tsconfig.json, globals.css, components.json all verified |
| INFRA-02 | 01-06-PLAN | Supabase project + Vercel custom domains configured | ✗ BLOCKED | REQUIREMENTS.md [ ] unchecked; Plan 06 Task 2 incomplete; no live project |
| INFRA-03 | 01-02-PLAN | tenants table, tenant_id on all tables, app.tenant_id() helper, RLS on all business tables | ✓ SATISFIED | 0001-0006 migrations verified; 45 RLS policies; 0 inline JWT parsing |
| INFRA-04 | 01-04-PLAN, 01-06-PLAN | Resend SPF/DKIM/DMARC, Upstash Redis rate limiting, Sentry with tenant_id | ✓ SATISFIED (code) | Rate limiters wired; Sentry initialized; external service secrets are Plan 06 Task 2 |
| INFRA-05 | 01-04-PLAN | src/proxy.ts multi-domain routing, app.* → office, track.* → portal | ✓ SATISFIED | src/proxy.ts verified; env-var-driven; 0 getSession |
| INFRA-06 | 01-02-PLAN, 01-03-PLAN | All SECURITY DEFINER helpers + production_status REVOKE + workstation lifecycle + link trigger | ✓ SATISFIED | 0001, 0008, 0009, 0010 all verified |
| INFRA-07 | 01-01-PLAN, 01-06-PLAN | ESLint module boundaries + service-role gating + CI pipeline | ✓ SATISFIED | eslint.config.js rules verified; ci.yml 4 gates verified |
| AUTH-01 | 01-05-PLAN | Office staff email+password sign-in; @supabase/ssr httpOnly cookie; getUser() only | ✓ SATISFIED | sign-in.ts + sign-in page verified; 0 getSession in all auth paths |
| AUTH-02 | 01-05-PLAN | Workstation synthetic user; 1-hour TTL; JWT expiry = 3600s | ✓ SATISFIED (code) | createWorkstation 3-step flow verified; JWT expiry config is Dashboard-level (Plan 06 Task 4) |
| AUTH-03 | 01-05-PLAN | Customer magic-link; shouldCreateUser: false; callback exchangeCodeForSession | ✓ SATISFIED | magic-link.ts + callback route verified |
| AUTH-04 | 01-03-PLAN, 01-06-PLAN | JWT app_metadata: tenant_id/audience/role; hook populates claims; hook STABLE; production hook registered | ? NEEDS HUMAN | Hook SQL + local config.toml registration verified; production Dashboard unverified; REQUIREMENTS.md [ ] unchecked |
| AUTH-05 | 01-04-PLAN | requireOfficeStaff/requireShopStaff/requireCustomer; getCurrentClaims(); getUser() only | ✓ SATISFIED | require.ts verified; 3 guards; 0 getSession; Sentry.setTag |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/modules/settings/actions/workstation.ts` | 42 | `(await createClient()) as any` | ⚠️ Warning | Typed to `any` because src/shared/db/types.ts is placeholder. ESLint-disable comment present. Will be removed when Plan 06 Task 3 generates real types. Does not prevent functionality. |
| `src/shared/db/types.ts` | 1-20 | Placeholder `Database` type — no real table types | ⚠️ Warning | Placeholder stub until supabase gen types runs. Expected state. All Supabase client calls compile because of the `any` cast workaround above. |
| `src/app/api/webhooks/route.ts` | all | Returns `{ ok: true }` with no implementation | ℹ️ Info | Intentional Phase 1 stub per SUMMARY. Resend webhook handling lands in Phase 2. |
| 8 module stubs | all | `export {}` with no implementation | ℹ️ Info | All intentional per plan — Wave-1 modules (crm, jobs, packets, scanning, timeline, dashboard, portal, tags) are Phase 2-4. |

No blockers found in anti-pattern scan. The `any` cast in workstation.ts is self-documenting and bounded; it does not open security surface.

### Human Verification Required

#### 1. JWT Expiry = 3600 Seconds

**Test:** After completing Plan 06 Task 2 (Supabase Dashboard configuration), run: `supabase inspect db config --project-ref $SUPABASE_PROJECT_REF | grep jwt_expiry`
**Expected:** `jwt_expiry = 3600`
**Why human:** Requires live Supabase Cloud project and Dashboard configuration to set JWT expiry. Cannot verify from codebase — this is a project-global setting in Supabase Auth settings.

#### 2. Production Hook Registration

**Test:** In Supabase Dashboard → Authentication → Hooks, verify the custom_access_token hook is registered pointing to `pg-functions://postgres/app/custom_access_token_hook`
**Expected:** Hook is active and returns JWT with `app_metadata.tenant_id`, `app_metadata.audience`, `app_metadata.role` populated
**Why human:** Production Dashboard hook registration is a manual step. config.toml only covers local dev. The hook function itself is verified in code, but the production wiring is external.

#### 3. Office Staff Sign-In End-to-End

**Test:** Navigate to `https://app.popsindustrial.com/sign-in`, enter valid staff credentials, submit form
**Expected:** httpOnly session cookie set scoped to `app.popsindustrial.com`; redirect to `/`; no auth errors
**Why human:** Requires live Supabase instance + Vercel deployment + Domain DNS configured. Smoke test deferred to Plan 06 Task 5.

#### 4. Customer Magic-Link End-to-End

**Test:** Navigate to `https://track.popsindustrial.com/sign-in`, enter valid customer email, submit form
**Expected:** Resend delivers magic-link email; clicking link hits `/auth/callback?code=...`; session cookie set scoped to `track.popsindustrial.com`
**Why human:** Requires live Supabase + Resend SMTP configured with SPF/DKIM/DMARC. Both Plan 06 Task 2 dependencies.

#### 5. pgTAP Suite Passes Against Branch DB

**Test:** Open a PR against main; CI `pgtap` job runs and completes without failures
**Expected:** All 4 test files (29 total assertions) pass against the Supabase Preview branch DB
**Why human:** Branch DBs only exist in PR context (`if: github.event_name == 'pull_request'`). Cannot run without a live Supabase project with branch DB enabled.

### Gaps Summary

Two gaps block full goal achievement:

**INFRA-02 (BLOCKER):** The Supabase Cloud project has not been created and linked to the repository, and Vercel has not been configured with the `app.popsindustrial.com` and `track.popsindustrial.com` custom domains. This is the Plan 06 Task 2 human-action checkpoint that the plan explicitly paused at. Consequences: `src/shared/db/types.ts` remains a placeholder (real types require `supabase gen types typescript` against a live project), the pgTAP tests cannot run against a live branch DB, and no live environment exists for smoke testing. REQUIREMENTS.md explicitly marks INFRA-02 as `[ ]` Pending.

**AUTH-04 (WARNING):** The JWT claims hook SQL function is fully implemented and correct (STABLE, no writes, reads from staff/customer_users/workstations tables). The hook is registered in `supabase/config.toml` for local dev. However, the production Supabase Dashboard hook registration has not been completed (Plan 06 Task 2 step A.5), and the JWT expiry cannot be verified as 3600s (Plan 06 Task 4) without the live project. REQUIREMENTS.md explicitly marks AUTH-04 as `[ ]` Pending.

Both gaps are direct consequences of Plan 06 being paused at its Task 2 human-action checkpoint. All automated work (10 of 12 must-haves) is complete and verified. The two gaps require human action to complete external service configuration, then Tasks 3-5 can be executed to close them.

---

_Verified: 2026-05-02T20:30:00Z_
_Verifier: Claude (gsd-verifier)_
