---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-05-03T12:00:00Z"
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
**Active Plan:** None (plan 05 complete)
**Status:** Ready to execute

**Progress:**

[████████░░] 83%
Phase 1 [████------] 50%  Foundation
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
| Plans created | 0 |
| Plans complete | 0 |
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
- **src/shared/db/types.ts is a placeholder** — replaced by `supabase gen types typescript --local` in Plan 06
- **vitest.config.ts Step 0 pattern** — vitest.config.ts must be created before any test file in TDD plans (W2 revision); established in Plan 05
- **Placeholder DB types require any cast in workstation.ts** — removed when Plan 06 generates real types; documented with ESLint comment
- **Anti-enumeration for magic-link rate limits** — both email and IP limiter errors are swallowed via .catch(() => undefined); always returns { success: true }
- **Server Action searchParams redirect pattern** — sign-in page uses searchParams redirect (not useFormState) because it is a Server Component; avoids unnecessary client component for Phase 1 auth

### Phase Notes

*(populated as phases complete)*

### Blockers

- **Plan 06 Task 2:** Human-action checkpoint (Supabase JWT + Auth Hook dashboard, Vercel domains, DNS, env secrets) — see `SESSION-MEMORY.md` and `01-06-PLAN.md`.

### Todos Carried Forward

- Confirm Vercel deployment lives under the correct team; link locally with `vercel link` if URL needed from CLI.

---

## Session Continuity

**Last updated:** 2026-05-03
**Last action:** Documented 2026-05-03 session outcomes in `CHANGELOG.md` and `.planning/intel/SESSION-MEMORY.md` (Vercel URL discovery, Plan 06 automation recap, remaining manual checkpoints). Prior: 01-06-PLAN.md Tasks 1a+1b complete — pgTAP RLS test suite, seed + CI; PAUSED at Task 2 human-action checkpoint.
**Next action:** Complete remaining Plan 06 manual steps (Supabase JWT=3600s + Auth Hook dashboard registration; Vercel domains for `popsindustrial.com` app/track hosts; Resend DNS; Upstash + Sentry env), then Tasks 3–5 sign-off. Push feature branch with explicit `git push origin <branch>` if not on `main`. See `SESSION-MEMORY.md` for the full checklist.

**Context for next session:**

- **Cursor:** Rule `.cursor/rules/plan06-phase1-continuity.mdc` is `alwaysApply` — Plan 06 checklist loads automatically.

- Phase 1 covers INFRA-01 through INFRA-07 + AUTH-01 through AUTH-05
- Plans 01-05 complete: Next.js scaffold, 10 SQL migrations, auth hook + SECURITY DEFINER functions, Supabase clients + auth helpers + proxy.ts + rate limiting + Sentry, auth Server Actions + sign-in UI + module stubs
- Plan 06: checkpoint — Supabase Cloud + Vercel setup, seed-tenant.ts run, pgTAP RLS tests, hook Dashboard registration, supabase gen types (replaces placeholder types.ts)
- Hook registration for production goes in Plan 06 (manual checkpoint); local dev already registered via config.toml [auth.hook.custom_access_token]
- The workstation ceremony UI is Phase 3; Phase 1 delivers the createWorkstation server action (complete in Plan 05)
- vitest.config.ts is in place; 21 unit tests for auth + settings pass
- **Vercel URL:** not in repo; use dashboard or `vercel link` after selecting the correct team — see `SESSION-MEMORY.md`
