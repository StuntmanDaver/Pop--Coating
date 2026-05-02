---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-05-02T01:01:50.277Z"
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 6
  completed_plans: 2
  percent: 33
---

# Project State: Pops Industrial Coatings — Operations Platform (Wave 1)

## Project Reference

**Core Value:** Replace paper-based job tracking with a QR scan loop that gives shop owners live production visibility and eliminates "where is my job?" calls — both for office staff and customers.

**Current Focus:** Phase 01 — foundation

**Milestone:** Wave 1

---

## Current Position

Phase: 01 (foundation) — EXECUTING
Plan: 3 of 6
**Active Phase:** 1 — Foundation
**Active Plan:** None (not yet started)
**Status:** Ready to execute

**Progress:**

[███░░░░░░░] 33%
Phase 1 [----------] 0%  Foundation
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

### Phase Notes

*(populated as phases complete)*

### Blockers

*(none)*

### Todos Carried Forward

*(none — clean start)*

---

## Session Continuity

**Last updated:** 2026-05-01
**Last action:** Completed 01-02-PLAN.md — Supabase config.toml + 6 SQL migrations (0001-0006) committed
**Next action:** Execute 01-03-PLAN.md (auth hook + production_status REVOKE + SECURITY DEFINER scan functions)

**Context for next session:**

- Phase 1 covers INFRA-01 through INFRA-07 + AUTH-01 through AUTH-05
- Phase 1 is a pure infrastructure/auth phase — no UI components, no business logic
- Plan 02 (INFRA-03, INFRA-06) complete: schema + RLS migrations applied; test tenant UUID 00000000-0000-0000-0000-000000000001 seeded
- Plan 03 targets: app.custom_access_token_hook (MUST NOT write to tables — Supabase deadlock), production_status REVOKE, SECURITY DEFINER scan functions
- The hook must NOT write to any tables (Supabase Issue #29073 deadlock — see CLAUDE.md hidden invariants)
- Workstation synthetic user enrollment is in Phase 1 (AUTH-02) but the full ceremony UI is in Phase 3 (SCAN-03)
