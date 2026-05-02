---
phase: 01-foundation
plan: 06
subsystem: testing-ci-bootstrap
tags: [pgtap, rls, ci, seed, github-actions, supabase, auth-hook]
dependency_graph:
  requires: [01-01, 01-02, 01-03, 01-04, 01-05]
  provides: [pgTAP-rls-suite, jwt-helpers, seed-sql, seed-tenant-script, ci-pipeline]
  affects: [Phase 2+ development workflows, all PRs gated on pgTAP]
tech_stack:
  added: [tsx, pgTAP, supabase-branches, fountainhead/action-wait-for-check, pnpm/action-setup]
  patterns: [pgTAP BEGIN/ROLLBACK isolation, set_config JWT simulation, parseArgs CLI flags, updateUserById app_metadata guard]
key_files:
  created:
    - supabase/tests/helpers/jwt_helpers.sql
    - supabase/tests/rls/test_cross_tenant_isolation.sql
    - supabase/tests/rls/test_audience_isolation.sql
    - supabase/tests/rls/test_function_authorization.sql
    - supabase/tests/rls/test_auth_hook_invariants.sql
    - supabase/seed.sql
    - scripts/seed-tenant.ts
    - .github/workflows/ci.yml
  modified:
    - package.json
    - pnpm-lock.yaml
decisions:
  - "pgTAP helpers use set_config(..., true) (transaction-local) so ROLLBACK fully resets JWT state"
  - "seed-tenant.ts uses parseArgs with explicit string|undefined cast to satisfy TypeScript strict"
  - "ci.yml pgtap job has if: github.event_name == 'pull_request' (branch DBs only exist in PR context)"
  - "seed.sql inserts directly into auth.users (postgres superuser context in supabase db reset)"
metrics:
  duration: 8 minutes (automated tasks only; plan paused at Task 2 human-action checkpoint)
  completed: 2026-05-02
  tasks_completed: 2
  tasks_total: 5
  files_created: 8
  files_modified: 2
---

# Phase 1 Plan 06: pgTAP RLS Tests + Seed + CI Pipeline Summary

**One-liner:** pgTAP 4-file RLS test suite with JWT helpers, supabase/seed.sql with fixed-UUID test tenant, scripts/seed-tenant.ts for live Tenant 1 bootstrap, and GitHub Actions CI with 4 merge gates including pgTAP against branch DB.

## Status: PAUSED AT TASK 2 (Human-Action Checkpoint)

Automated Tasks 1a and 1b are complete and committed. The plan is paused awaiting manual configuration of Supabase Cloud, Resend SMTP, Vercel custom domains, Sentry, and GitHub Actions secrets (Task 2).

Tasks 3–5 (schema push, JWT expiry verification, Phase 1 success criteria walkthrough) depend on Task 2 completing first.

## Completed Tasks

### Task 1a: pgTAP RLS test suite + jwt_helpers + supabase/seed.sql

**Commit:** `2af25be` (ralph agent parallel commit)

Files created:
- `supabase/tests/helpers/jwt_helpers.sql` — 4 helper functions to simulate JWT claims via `set_config('request.jwt.claims', ..., true)`: `set_jwt_for_staff`, `set_jwt_for_customer`, `set_jwt_for_workstation`, `set_jwt_anon`
- `supabase/tests/rls/test_cross_tenant_isolation.sql` — 8 assertions: tenant A/B isolation on companies, contacts, staff, jobs; anonymous JWT returns 0 rows; cross-tenant INSERT raises
- `supabase/tests/rls/test_audience_isolation.sql` — 9 assertions: customer cannot SELECT staff/customer_users/other-company data; shop cannot INSERT companies/staff
- `supabase/tests/rls/test_function_authorization.sql` — 6 assertions: `claim_workstation` workstation_id match + stale-version result, `next_job_number` rejects customer + anon JWTs, `record_workstation_heartbeat` + `release_workstation` reject non-shop audiences
- `supabase/tests/rls/test_auth_hook_invariants.sql` — 6 assertions: STABLE provolatile, supabase_auth_admin BYPASSRLS, production_status REVOKE, intake_status still writable, EXECUTE grant, no-write body scan
- `supabase/seed.sql` — expanded with fixed UUID test tenant `00000000-0000-0000-0000-000000000001`, office staff auth user, synthetic workstation auth user, 3 sample companies + contacts, test customer user, tenant_domains for `app.localhost:3000` + `track.localhost:3000`

### Task 1b: scripts/seed-tenant.ts + GitHub Actions CI pipeline

**Commit:** `8aa7f15`

Files created:
- `scripts/seed-tenant.ts` — programmatic Tenant 1 bootstrap; creates tenants + shop_settings + tenant_domains + staff rows, calls `inviteUserByEmail`, then CRITICALLY calls `updateUserById(app_metadata: { tenant_id, intended_actor: 'staff' })` per RESEARCH.md Pitfall 5 so the `link_auth_user_to_actor` trigger (migration 0010) can link the auth.users row when the owner accepts the invite
- `.github/workflows/ci.yml` — two-job pipeline: `type-check-lint-test` (type-check + lint+madge + vitest), `pgtap` (waits for Supabase Preview branch DB, then runs `supabase test db --db-url`); pgtap job runs only on PRs per D-07

Files modified:
- `package.json` — added `seed:tenant` script, `tsx` devDependency
- `pnpm-lock.yaml` — lockfile updated for tsx

**Verification:** `pnpm type-check && pnpm lint && pnpm test` all exit 0.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript strict mode error in seed-tenant.ts**
- **Found during:** Task 1b verification (`pnpm type-check`)
- **Issue:** `parseArgs` with `strict: false` widens the inferred return type to `string | true | undefined`; `ownerName` passed to `inviteUserByEmail(ownerEmail, { data: { name: ownerName } })` failed with TS2345: `string | true` not assignable to `string`
- **Fix:** Added explicit `as string | undefined` casts to all four `values[...]` extractions from `parseArgs`; added clarifying comment explaining the runtime-safe cast
- **Files modified:** `scripts/seed-tenant.ts`
- **Commit:** included in `8aa7f15`

**2. [Rule 3 - Blocking] Task 1a files already committed by ralph agent**
- **Found during:** Post-write git commit attempt
- **Issue:** The ralph parallel agent committed `supabase/tests/**` and `supabase/seed.sql` in commit `2af25be` before this executor's commit attempt; `git status` showed "nothing to commit"
- **Fix:** Verified git diff showed no differences (ralph's content matched what this agent produced); accepted the existing commit; recorded `2af25be` as the Task 1a commit hash; continued with Task 1b
- **No code changes needed.**

## Pending Tasks (Awaiting Human-Action Checkpoint)

- **Task 2 [BLOCKING]:** Manual Supabase Dashboard + Vercel + Resend + Sentry + GitHub Actions configuration (see checkpoint details below)
- **Task 3:** `supabase db push` to live project + `supabase gen types typescript` + `scripts/seed-tenant.ts` execution
- **Task 4:** JWT expiry verification (`supabase inspect db config | grep jwt_expiry` must return 3600)
- **Task 5:** Phase 1 success criteria walkthrough (5 criteria PASS/FAIL)

## AUTH-02 / [A1] RESOLVED

JWT expiry verification is pending Task 2 (manual Dashboard configuration) and Task 4 (automated verification). Per RESEARCH.md A1 RESOLVED, Supabase JWT expiry is project-global; setting it to 3600s satisfies AUTH-02's stolen-tablet mitigation for workstations while office/customer 30-day sessions work via refresh-token rotation. Task 2 step A.7 sets the value; Task 4 verifies it via `supabase inspect db config | grep jwt_expiry`.

## Known Stubs

- `src/shared/db/types.ts` — still the placeholder Database type from Plan 04. Task 3 (post-Task 2 checkpoint) regenerates it via `supabase gen types typescript --project-id $SUPABASE_PROJECT_REF`. This is intentional: cannot run the generator without a live schema push.

## Threat Flags

None — this plan creates no new network endpoints, auth paths, or trust boundaries beyond what the threat model covers.

## Self-Check: PARTIAL

Tasks 1a and 1b verified:
- FOUND: supabase/tests/helpers/jwt_helpers.sql
- FOUND: supabase/tests/rls/test_cross_tenant_isolation.sql (8 assertions)
- FOUND: supabase/tests/rls/test_audience_isolation.sql (9 assertions)
- FOUND: supabase/tests/rls/test_function_authorization.sql (6 assertions)
- FOUND: supabase/tests/rls/test_auth_hook_invariants.sql (6 assertions)
- FOUND: supabase/seed.sql (fixed UUID 00000000-0000-0000-0000-000000000001)
- FOUND: scripts/seed-tenant.ts (contains inviteUserByEmail + intended_actor)
- FOUND: .github/workflows/ci.yml (contains all 4 gates)
- VERIFIED: pnpm type-check exits 0
- VERIFIED: pnpm lint exits 0
- VERIFIED: pnpm test passes (21 tests)
- NOT VERIFIED: pgTAP tests against live DB (requires Task 2 + Task 3)
- NOT VERIFIED: src/shared/db/types.ts real types (requires Task 3)
