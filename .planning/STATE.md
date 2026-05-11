---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-05-11T00:00:00.000Z"
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 6
  completed_plans: 5
  percent: 83
---

# Project State: Pops Industrial Coatings — Operations Platform (Wave 1)

## Project Reference

**Core Value:** Replace paper-based job tracking with a QR scan loop that gives shop owners live production visibility and eliminates "where is my job?" calls — both for office staff and customers.

**Current Focus:** Phase 01 — foundation

**Milestone:** Wave 1

---

## Current Position

Phase: 01 (foundation) — EXECUTING
Plan: 6 of 6
**Active Phase:** 1 — Foundation
**Active Plan:** 06 — production checkpoint/sign-off
**Status:** Blocked on manual infrastructure checkpoint before Phase 1 sign-off

**Progress:**

[████████░░] 83%
Phase 1 [████████░░] 83%  Foundation
Phase 2 [----------] 0%  Core Data
Phase 3 [----------] 0%  Shop Floor
Phase 4 [----------] 0%  Portal & Ops

```

**Overall:** 0/4 phases complete

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Requirements mapped | 37/37 |
| Phases defined | 4 |
| Plans created | 6 |
| Plans complete | 5 |
| Phases complete | 0 |

---
| Phase 01-foundation P04 | 20 | 2 tasks | 17 files |
| Phase 01-foundation P05 | 20 | 2 tasks | 23 files |

## Accumulated Context

### Key Decisions (Locked)

- **Multi-tenant via `tenant_id` + RLS** (not separate schemas/DBs) — simpler ops, single Supabase instance, Supabase Auth compatible
- **`production_status` column-level REVOKE** — all transitions auditable via scan events; direct UPDATE forbidden
- **Workstation = synthetic Supabase user** — enables per-workstation JWT; avoids shared credentials; 1-hour TTL
- **Magic-link portal auth** — customers don't create accounts; zero friction for customer onboarding
- **Any-to-any production transitions** — supports rework, multi-color back-passes, corrections without blocking flow
- **`src/proxy.ts` (not `middleware.ts`)** — Next.js 16 renamed multi-domain/tenant routing middleware
- **`cookies()` from `next/headers` is async** — must use `await cookies()` everywhere
- **Auth decisions: always `supabase.auth.getUser()`** — never `getSession()` for auth decisions
- **RLS policies use only app schema helpers** — zero inline JWT parsing in any policy; app.tenant_id()/app.audience()/app.company_id() are the sole claim readers
- **app.next_job_number reads tenant_id from JWT only** — no parameter accepted; prevents privilege escalation
- **Deferred FK pattern for forward references** — declare UUID column in early migration; add FOREIGN KEY constraint via ALTER TABLE in later migration after referenced table exists
- **Cross-table trigger ordering invariant** — create ALL referenced tables before function + triggers in same migration (prevents runtime "relation does not exist" at first INSERT)
- **Hook STABLE invariant** — app.custom_access_token_hook MUST be STABLE; any write inside causes deadlock on auth.users (Supabase Issue #29073); all user-row linking goes in the separate AFTER INSERT trigger
- **supabase_auth_admin BYPASSRLS** — only additive GRANTs; never ALTER ROLE on this role in any migration
- **production_status REVOKE** — column-level REVOKE UPDATE (production_status) ON jobs FROM authenticated; all transitions via app.record_scan_event() (Phase 3)
- **link_auth_user_to_actor tenant scope** — always filter by tenant_id from raw_app_meta_data; raises if absent (except audience=staff_shop workstation bypass)
- **Env-var-driven redirect targets in proxy.ts** — NEXT_PUBLIC_APP_HOST / NEXT_PUBLIC_PORTAL_HOST (defaults to localhost in dev); no hardcoded production domain literals in proxy logic
- **Defense-in-depth rate limiting** — primary tier in proxy.ts (Upstash per-IP at edge); secondary tier in Server Actions (Plan 05, per-email + compound key)
- **src/shared/db/types.ts is generated from Supabase schema** — Plan 06 replaced the placeholder; regenerate after migration changes and verify against the linked schema before sign-off
- **vitest.config.ts Step 0 pattern** — vitest.config.ts must be created before any test file in TDD plans (W2 revision); established in Plan 05
- **Generated DB type limitation** — Supabase generated types emit the public schema; any remaining cross-schema casts must stay narrowly justified in code comments
- **Anti-enumeration for magic-link rate limits** — both email and IP limiter errors are swallowed via .catch(() => undefined); always returns { success: true }
- **Server Action searchParams redirect pattern** — sign-in page uses searchParams redirect (not useFormState) because it is a Server Component; avoids unnecessary client component for Phase 1 auth

### Phase Notes

*(populated as phases complete)*

### Blockers

- **Plan 06 human-only gate:** Supabase JWT expiry, Custom Access Token Hook, Custom SMTP/Resend DNS, Vercel domain reassignment for `app.popsindustrial.com` and `track.popsindustrial.com`, and live Tenant 1 seed remain before Phase 1 sign-off — see `SESSION-MEMORY.md`, `01-06-PLAN.md`, and `docs/briefs/PHASE-1-GATE-NEXT-DISPATCH.md`.

### Todos Carried Forward

- Move or remove existing Vercel aliases for `app.popsindustrial.com` and `track.popsindustrial.com`, then attach them to `stuntmandavers-projects/pops--coating`; remove stale `popscoating.com` hosts if present.
- Verify Supabase JWT expiry/Auth Hook/SMTP, Resend DNS, and Vercel canonical domain attachment without storing secret values in-repo.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260506-hm2 | pgTAP coverage for migrations 0015 validate_employee_pin 0016 record_scan_event 0017 jobs_packet_dirty_trigger | 2026-05-06 | a6e7a2c | [260506-hm2-pgtap-coverage-for-migrations-0015-valid](.planning/quick/260506-hm2-pgtap-coverage-for-migrations-0015-valid/) |

---

## Session Continuity

**Last updated:** 2026-05-11
**Last action:** Re-ran the repo-side Phase 1 gate on 2026-05-11: `pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm build`, no-secret Playwright host smoke, and `supabase test db --linked` pass. Added pgTAP coverage for scan replay idempotency, bringing linked pgTAP to 9 files / 89 tests. Fetched missing remote migration `0021_scan_event_idempotency.sql`, removed the identical duplicate local `0022 ... 2.sql` file, and verified `supabase migration list --linked` aligns local/remote through `0022`.
**Next action:** Complete the human-only blockers in `docs/briefs/PHASE-1-GATE-NEXT-DISPATCH.md` (Supabase JWT/Auth Hook/SMTP, Vercel canonical domain attachment, Resend DNS), collect owner email/name for `pnpm seed:tenant`, then run Phase 1 Task 5 sign-off.

**Context for next session:**

- **Cursor:** Rule `.cursor/rules/plan06-phase1-continuity.mdc` is `alwaysApply` — Plan 06 checklist loads automatically.

- Phase 1 covers INFRA-01 through INFRA-07 + AUTH-01 through AUTH-05
- Plans 01-05 complete: Next.js scaffold, 10 SQL migrations, auth hook + SECURITY DEFINER functions, Supabase clients + auth helpers + proxy.ts + rate limiting + Sentry, auth Server Actions + sign-in UI + module stubs
- Plan 06: checkpoint — Supabase Cloud schema through migration 0020 is applied, DB types are generated, and linked pgTAP passes; remaining gates are seed-tenant.ts run, hook Dashboard registration, JWT expiry, SMTP, Vercel alias reassignment/env gaps, and Phase 1 success walkthrough
- Hook registration for production goes in Plan 06 (manual checkpoint); local dev already registered via config.toml [auth.hook.custom_access_token]
- The workstation ceremony UI is Phase 3; Phase 1 delivers the createWorkstation server action (complete in Plan 05)
- vitest.config.ts is in place; latest local gate reported `pnpm test` passing across 34 files / 242 tests
- **Vercel URL:** not in repo; use dashboard or `vercel link` after selecting the correct team — see `SESSION-MEMORY.md`
