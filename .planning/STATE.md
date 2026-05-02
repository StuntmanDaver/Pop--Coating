---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-05-02T01:17:03.805Z"
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 6
  completed_plans: 4
  percent: 67
---

# Project State: Pops Industrial Coatings — Operations Platform (Wave 1)

## Project Reference

**Core Value:** Replace paper-based job tracking with a QR scan loop that gives shop owners live production visibility and eliminates "where is my job?" calls — both for office staff and customers.

**Current Focus:** Phase 01 — foundation

**Milestone:** Wave 1

---

## Current Position

Phase: 01 (foundation) — EXECUTING
Plan: 5 of 6
**Active Phase:** 1 — Foundation
**Active Plan:** None (plan 04 complete)
**Status:** Ready to execute

**Progress:**

[███████░░░] 67%
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

### Phase Notes

*(populated as phases complete)*

### Blockers

*(none)*

### Todos Carried Forward

*(none — clean start)*

---

## Session Continuity

**Last updated:** 2026-05-02
**Last action:** Completed 01-04-PLAN.md — Supabase clients, auth helpers, src/proxy.ts multi-domain routing + Upstash rate limiting + Sentry init
**Next action:** Execute 01-05-PLAN.md (auth Server Actions: signIn, signOut, magic-link, inviteStaff, createWorkstation)

**Context for next session:**

- Phase 1 covers INFRA-01 through INFRA-07 + AUTH-01 through AUTH-05
- Phase 1 is a pure infrastructure/auth phase — no UI components, no business logic
- Plans 01, 02, 03, 04 complete: Next.js scaffold + config.toml, 10 SQL migrations (0001-0010), auth hook + SECURITY DEFINER functions, Supabase clients + auth helpers + proxy.ts + rate limiting + Sentry
- Plan 05 targets: auth Server Actions (signInStaff, signOutStaff, requestCustomerMagicLink, inviteStaff, createWorkstation) in src/modules/auth/ and src/modules/settings/
- Plan 06: checkpoint — Supabase Cloud + Vercel setup, seed-tenant.ts run, pgTAP RLS tests, hook Dashboard registration
- Hook registration for production goes in Plan 06 (manual checkpoint); local dev already registered via config.toml [auth.hook.custom_access_token]
- The workstation ceremony UI is Phase 3; Phase 1 delivers the createWorkstation server action only
