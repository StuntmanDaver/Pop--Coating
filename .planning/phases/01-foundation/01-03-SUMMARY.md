---
phase: 01-foundation
plan: "03"
subsystem: database-auth
tags: [auth-hook, jwt-claims, rls, security-definer, workstation, multi-tenant]
dependency_graph:
  requires: [01-02]
  provides: [app.custom_access_token_hook, app.claim_workstation, app.record_workstation_heartbeat, app.release_workstation, app.link_auth_user_to_actor, production_status_revoke]
  affects: [01-04, 01-05, 01-06]
tech_stack:
  added: []
  patterns: [STABLE-hook-no-write, SECURITY-DEFINER-SET-search_path, column-level-REVOKE, AFTER-INSERT-trigger, optimistic-concurrency]
key_files:
  created:
    - supabase/migrations/0007_auth_hook.sql
    - supabase/migrations/0008_production_status_revoke.sql
    - supabase/migrations/0009_workstation_lifecycle_functions.sql
    - supabase/migrations/0010_link_auth_user_trigger.sql
  modified:
    - supabase/config.toml
decisions:
  - "Hook is STABLE (no writes) — all user-row linking goes to the separate AFTER INSERT trigger (0010), not inside the hook; avoids Supabase Issue #29073 deadlock"
  - "supabase_auth_admin BYPASSRLS preserved — only GRANT SELECT added; zero ALTER ROLE statements across all 10 migrations"
  - "production_status REVOKE enforced at column level for authenticated role — only app.record_scan_event() (Phase 3) can transition status"
  - "link_auth_user_to_actor filters by tenant_id from raw_app_meta_data — prevents multi-tenant email collision (Pitfall 5)"
  - "Workstation synthetic users (audience=staff_shop) skip the link trigger — createWorkstation server action links auth_user_id directly"
metrics:
  duration: "3 minutes"
  completed: "2026-05-02"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 1
---

# Phase 01 Plan 03: Auth Hook + Security Functions Summary

**One-liner:** JWT claim stamping via STABLE no-write hook + column-level production_status REVOKE + SECURITY DEFINER workstation lifecycle functions + multi-tenant-safe auth user link trigger.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Auth hook (0007) + production_status REVOKE (0008) + config.toml hook registration | 8404e17 | supabase/migrations/0007_auth_hook.sql, 0008_production_status_revoke.sql, supabase/config.toml |
| 2 | Workstation lifecycle functions (0009) + auth user link trigger (0010) | 2a4dbea | supabase/migrations/0009_workstation_lifecycle_functions.sql, 0010_link_auth_user_trigger.sql |

## Invariant Verification

### STABLE Hook (Authoritative: pg_proc.provolatile = 's')

Source-level verification (plan notes this is defense-in-depth; provolatile is authoritative):
- `grep -c "STABLE" supabase/migrations/0007_auth_hook.sql` → 1 (hook declared `STABLE`)
- `grep -v '^[[:space:]]*--' ... | grep -ciE '(INSERT INTO|UPDATE [a-z_]|DELETE FROM)'` → 0 (no writes in non-comment lines)

Runtime verification (authoritative per plan W1 revision) requires `supabase db reset` and a running local Postgres instance. Per `<important_context>` directive, `supabase db reset` is deferred to Plan 06. The pgTAP test suite in Plan 06 will verify `provolatile = 's'` definitively.

### supabase_auth_admin BYPASSRLS Preserved

- `grep -c "ALTER ROLE supabase_auth_admin" supabase/migrations/000*.sql` → 0 across all 10 migration files
- Migration 0007 adds only `GRANT SELECT ON staff, customer_users, workstations TO supabase_auth_admin` — no role attribute changes

### Hook Registered in config.toml

```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/app/custom_access_token_hook"
```

Production hook registration: Supabase Dashboard → Authentication → Hooks (Plan 06 checkpoint).

### production_status Column-Level REVOKE (Authoritative: has_column_privilege = false)

Source-level: `grep -q "REVOKE UPDATE (production_status) ON jobs FROM authenticated"` → FOUND in 0008.

Runtime verification (`has_column_privilege('authenticated','jobs','production_status','UPDATE') = 'f'`) deferred to Plan 06 (same reason as above — requires running Supabase instance).

### Workstation Lifecycle Caller Boundary

- `claim_workstation` checks `app.audience() != 'staff_shop'` → EXCEPTION 'access_denied'
- `claim_workstation` checks `v_caller_workstation != p_workstation_id` → EXCEPTION 'access_denied: can only claim own workstation'
- `claim_workstation` validates `v_ws_tenant = v_caller_tenant AND v_emp_tenant = v_caller_tenant` → cross-tenant access denied
- All three functions: `SECURITY DEFINER SET search_path = public` — prevents search_path injection

### Multi-Tenant Link Trigger Safety

- Filters by `tenant_id = v_tenant_id` on both `staff` and `customer_users` UPDATEs
- Raises `auth_user_created_without_tenant_id` if `tenant_id` absent and audience is not `staff_shop`
- Workstation bypass path: `IF NEW.raw_app_meta_data ->> 'audience' = 'staff_shop' THEN RETURN NEW`

## Decisions Made

1. **Hook is STABLE, zero writes** — user-row linking separated into 0010 trigger (avoids Supabase Issue #29073 deadlock)
2. **supabase_auth_admin BYPASSRLS preserved** — only additive GRANTs; no ALTER ROLE in any migration
3. **production_status REVOKE** — column-level enforcement; authenticated role cannot direct-UPDATE
4. **link_auth_user_to_actor tenant-scoped** — filters by tenant_id from raw_app_meta_data; fails loudly if missing
5. **Workstation users skip trigger** — createWorkstation server action (Plan 05) sets workstations.auth_user_id directly

## Deviations from Plan

None — plan executed exactly as written. The comment line in 0007 was adjusted to avoid a false-positive grep match on `ALTER ROLE supabase_auth_admin` (the comment previously contained that string; reworded to preserve intent without triggering the acceptance criteria check).

## Known Stubs

None. All four migrations deliver complete, production-ready SQL. The hook, REVOKE, lifecycle functions, and link trigger are fully implemented per DESIGN.md §5.2 and Module 5.

## Downstream Dependencies

- **Plan 04** (src/proxy.ts multi-domain routing): assumes hook will stamp JWT claims; `getCurrentClaims()` reads `app_metadata.tenant_id`
- **Plan 05** (auth server actions): `createWorkstation` server action will set `raw_app_meta_data.audience = 'staff_shop'` to trigger the bypass path in the link trigger
- **Plan 06** (Supabase Cloud + seed): manual checkpoint to register hook in Dashboard; pgTAP suite verifies `provolatile = 's'` and `has_column_privilege = 'f'` definitively

## Self-Check: PASSED

All files present and commits verified:
- `supabase/migrations/0007_auth_hook.sql` — FOUND
- `supabase/migrations/0008_production_status_revoke.sql` — FOUND
- `supabase/migrations/0009_workstation_lifecycle_functions.sql` — FOUND
- `supabase/migrations/0010_link_auth_user_trigger.sql` — FOUND
- `supabase/config.toml` (modified) — FOUND
- Commit `8404e17` (Task 1) — FOUND in git log
- Commit `2a4dbea` (Task 2) — FOUND in git log
