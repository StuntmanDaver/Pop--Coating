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
  patterns: [pgTAP BEGIN/ROLLBACK isolation, set_config JWT simulation, parseArgs CLI flags, createUser-with-app_metadata auth guard, idempotent seed verification]
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
  - "seed-tenant.ts uses parseArgs with string guards before client creation to satisfy TypeScript strict"
  - "ci.yml pgtap job has if: github.event_name == 'pull_request' (branch DBs only exist in PR context)"
  - "seed.sql inserts directly into auth.users (postgres superuser context in supabase db reset)"
metrics:
  duration: ongoing (automated gates complete; external dashboard and owner-seed inputs remain)
  completed: pending Phase 1 sign-off
  tasks_completed: 3
  tasks_total: 5
  files_created: 8
  files_modified: 2+
---

# Phase 1 Plan 06: pgTAP RLS Tests + Seed + CI Pipeline Summary

**One-liner:** pgTAP RLS/function coverage with JWT helpers, supabase/seed.sql with fixed-UUID test tenant, an idempotent scripts/seed-tenant.ts for live Tenant 1 bootstrap, and GitHub Actions CI gates for type-check, lint/madge, Vitest, E2E smoke, and pgTAP branch DBs where available.

## Status: BLOCKED ON HUMAN-ONLY PRODUCTION CHECKPOINTS

Automated code and database verification is current as of 2026-05-08. Migrations are applied to the linked Supabase project through `0020_security_definer_fail_closed.sql`; generated database types are in place; linked pgTAP passes 9 files / 87 tests; root CI on `main` is green.

Phase 1 sign-off remains blocked by human/dashboard work: Supabase JWT expiry, Custom Access Token Hook registration, custom SMTP/Resend DNS, Vercel alias reassignment/env gaps, and the live Tenant 1 seed run with the real owner email/name. JWT expiry is not inspectable with the locally installed Supabase CLI v2.90.0, so it remains a Dashboard verification unless a newer CLI/API path is available.

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
- `scripts/seed-tenant.ts` — programmatic Tenant 1 bootstrap; creates or verifies tenants, shop_settings, tenant_domains, staff, owner Auth user, smoke company/contact/customer/customer Auth user/shop employee/workstation/job data. It creates Auth users with required `app_metadata`, repairs metadata for existing smoke users, generates but does not print recovery links, fails closed if canonical domains belong to another tenant, and prints the scanner QR target as `https://app.popsindustrial.com/scan?packet=<packet_token>`.
- `.github/workflows/ci.yml` — two-job pipeline: `type-check-lint-test` (type-check + lint+madge + vitest), `pgtap` (waits for Supabase Preview branch DB, then runs `supabase test db --db-url`); pgtap job runs only on PRs per D-07

Files modified:
- `package.json` — added `seed:tenant` script, `tsx` devDependency
- `pnpm-lock.yaml` — lockfile updated for tsx

**Verification:** current gates pass: `pnpm type-check`, `pnpm lint`, `pnpm test` (34 files / 242 tests), `pnpm build`, no-secret Playwright host-form smoke, `supabase migration list --linked` through `0020`, and `supabase test db --linked` (9 files / 87 tests).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript strict mode error in seed-tenant.ts**
- **Found during:** Task 1b verification (`pnpm type-check`)
- **Issue:** `parseArgs` with `strict: false` widens the inferred return type to `string | true | undefined`; passing the owner values into the Auth admin call failed TS2345 because `string | true` is not assignable to `string`
- **Fix:** Added explicit string guards for all four required CLI values before creating clients or calling Supabase APIs.
- **Files modified:** `scripts/seed-tenant.ts`
- **Commit:** included in `8aa7f15`

**2. [Rule 3 - Blocking] Task 1a files already committed by ralph agent**
- **Found during:** Post-write git commit attempt
- **Issue:** The ralph parallel agent committed `supabase/tests/**` and `supabase/seed.sql` in commit `2af25be` before this executor's commit attempt; `git status` showed "nothing to commit"
- **Fix:** Verified git diff showed no differences (ralph's content matched what this agent produced); accepted the existing commit; recorded `2af25be` as the Task 1a commit hash; continued with Task 1b
- **No code changes needed.**

## Pending Tasks (Awaiting Human-Action Checkpoint)

- **Task 2 [BLOCKING]:** Manual Supabase Dashboard + Vercel + Resend + Sentry + GitHub Actions configuration (see checkpoint details below)
- **Task 3:** live schema push and type generation are complete through migration `0020`; `scripts/seed-tenant.ts` execution still needs the real owner email/name and completed dashboard/DNS prerequisites.
- **Task 4:** JWT expiry verification remains manual/dashboard-only with Supabase CLI v2.90.0 because `supabase inspect db config` is not available locally.
- **Task 5:** Phase 1 success criteria walkthrough (5 criteria PASS/FAIL)

## AUTH-02 / [A1] RESOLVED

JWT expiry verification is pending Task 2 (manual Dashboard configuration) and Task 4 (manual or future CLI/API verification). Per RESEARCH.md A1 RESOLVED, Supabase JWT expiry is project-global; setting it to 3600s satisfies AUTH-02's stolen-tablet mitigation for workstations while office/customer 30-day sessions work via refresh-token rotation. Task 2 step A.7 sets the value; Task 4 records the verified value once available.

## Known Stubs

- No placeholder DB type remains for the current linked schema. `src/shared/db/types.ts` was regenerated after applying migrations through `0020`.

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
- FOUND: scripts/seed-tenant.ts (creates/verifies owner, customer, and workstation Auth users with required app_metadata)
- FOUND: .github/workflows/ci.yml (contains all 4 gates)
- VERIFIED: pnpm type-check exits 0
- VERIFIED: pnpm lint exits 0
- VERIFIED: pnpm test passes (34 files / 242 tests)
- VERIFIED: pnpm build exits 0
- VERIFIED: no-secret Playwright host-form smoke passes
- VERIFIED: pgTAP tests against linked DB pass (9 files / 87 tests)
- VERIFIED: src/shared/db/types.ts generated from linked schema through migration 0020
- NOT VERIFIED: JWT expiry = 3600s Dashboard setting
- NOT VERIFIED: production Custom Access Token Hook and SMTP/DNS Dashboard setup
- NOT VERIFIED: live Tenant 1 seed run with real owner email/name
