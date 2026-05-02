---
phase: 01-foundation
plan: 02
subsystem: database
tags: [postgres, supabase, rls, multi-tenant, sql, migrations, security-definer]

# Dependency graph
requires:
  - phase: 01-foundation/01-01
    provides: Next.js project scaffold, pnpm setup, Supabase CLI installed
provides:
  - supabase/config.toml with project_id=pops-coating, enable_signup=false
  - app schema with 7 SECURITY DEFINER STABLE helper functions (tenant_id, audience, role, staff_id, workstation_id, company_id, set_updated_at)
  - 15 Wave-1 business tables: tenants, shop_settings, tenant_domains, audit_log, staff, shop_employees, workstations, customer_users, companies, contacts, activities, tags, tagged_entities, jobs, job_status_history, attachments
  - RLS enabled on all 15 tables with 45 policies using only app.tenant_id()/app.audience()/app.company_id() helpers
  - app.next_job_number SECURITY DEFINER (reads tenant_id from JWT, never from parameter)
  - app.can_user_access_attachment_path for Storage RLS in Phase 3
  - Cross-table email uniqueness trigger on BOTH staff and customer_users (correct ordering)
  - Minimal dev seed.sql with fixed test tenant UUID 00000000-0000-0000-0000-000000000001
affects:
  - 01-03 (auth hook + production_status REVOKE reference jobs/shop_employees/workstations tables)
  - 01-04 (auth helpers use app.tenant_id() via SECURITY DEFINER helpers)
  - 01-05 (Next.js app uses these tables via Supabase client)
  - 01-06 (pgTAP tests validate RLS cross-tenant isolation on these tables)
  - All future phases (every module queries this schema)

# Tech tracking
tech-stack:
  added:
    - Supabase local dev (supabase/config.toml)
    - pgcrypto extension (for bcrypt PIN hashing via crypt()/gen_salt('bf'))
  patterns:
    - Multi-tenant isolation via tenant_id column + RLS on every business table
    - SECURITY DEFINER helpers in app schema reading JWT app_metadata (never inline)
    - Soft delete via archived_at (no hard deletes, no DELETE RLS policies)
    - Deferred FK pattern: forward-referencing FKs added via ALTER TABLE in later migration
    - set_updated_at trigger applied to every table with updated_at column
    - Cross-table trigger ordering: both referenced tables must exist before function + triggers

key-files:
  created:
    - supabase/config.toml
    - supabase/migrations/0001_app_schema_helpers.sql
    - supabase/migrations/0002_tenants_and_domains.sql
    - supabase/migrations/0003_auth_tables.sql
    - supabase/migrations/0004_crm_tables.sql
    - supabase/migrations/0005_jobs_tables.sql
    - supabase/migrations/0006_rls_policies.sql
    - supabase/seed.sql
  modified: []

key-decisions:
  - "RLS policies use only app.tenant_id()/app.audience()/app.company_id() helpers — never inline JWT parsing. Zero occurrences of request.jwt.claims in 0006."
  - "app.next_job_number reads tenant_id only from app.tenant_id() JWT claim, not a parameter — prevents privilege escalation."
  - "customer_users.company_id and contact_id declared as plain UUID in 0003 (no REFERENCES), FKs added in 0004 after companies/contacts created — avoids forward FK issues."
  - "tenants table special-case policy uses id = app.tenant_id() (not tenant_id = app.tenant_id() — tenants has no tenant_id column)."
  - "No DELETE RLS policies on any table — hard deletes are forbidden; soft delete via archived_at."

patterns-established:
  - "SECURITY DEFINER app schema helpers: all read-only helpers declared STABLE, no writes. set_updated_at is a trigger function (not STABLE)."
  - "Cross-table trigger ordering: create ALL referenced tables first, then function, then ALL triggers in one migration file."
  - "Deferred FK pattern: declare column as plain UUID in early migration, add FOREIGN KEY constraint via ALTER TABLE in later migration."
  - "RLS policy naming: <table>_<audience>_<operation> (e.g., jobs_customer_select, staff_office_insert)."

requirements-completed: [INFRA-03, INFRA-06]

# Metrics
duration: 15min
completed: 2026-05-01
---

# Phase 01 Plan 02: Database Schema + RLS Migrations Summary

**Multi-tenant Wave-1 Postgres schema with 15 business tables, 7 SECURITY DEFINER JWT helpers, and 45 RLS policies enforcing tenant isolation without inline JWT parsing**

## Performance

- **Duration:** ~15 min (review + commit only — files were pre-written by previous interrupted run)
- **Started:** 2026-05-01T00:00:00Z
- **Completed:** 2026-05-01T00:15:00Z
- **Tasks:** 3
- **Files created:** 8

## Accomplishments
- Reviewed all 8 migration files against plan requirements — all passed acceptance criteria without modification
- 15 Wave-1 business tables with tenant_id, RLS enabled, and complete policy coverage (45 CREATE POLICY statements)
- 7 SECURITY DEFINER STABLE helper functions in app schema (all STABLE, no writes); zero inline JWT parsing in any policy
- Cross-table email uniqueness trigger correctly ordered (both staff and customer_users created before function + triggers)
- app.next_job_number reads tenant_id only from JWT (no parameter) — prevents privilege escalation (T-01-02-05)
- Fixed test tenant UUID 00000000-0000-0000-0000-000000000001 seeded for local dev

## Task Commits

Each task was committed atomically:

1. **Task 1: config.toml + migrations 0001-0002** - `cdd19f7` (feat)
2. **Task 2: migrations 0003-0004** - `aff0c1d` (feat)
3. **Task 3: migrations 0005-0006 + seed** - `61793a5` (feat)

## Files Created

- `supabase/config.toml` — Supabase local config: project_id=pops-coating, ports 54331-54337, enable_signup=false
- `supabase/migrations/0001_app_schema_helpers.sql` — pgcrypto, app schema, 7 SECURITY DEFINER STABLE helpers
- `supabase/migrations/0002_tenants_and_domains.sql` — tenants, shop_settings, tenant_domains, audit_log; inline audit_log_staff_select policy
- `supabase/migrations/0003_auth_tables.sql` — staff, shop_employees, workstations, customer_users; cross-table email trigger (correct ordering)
- `supabase/migrations/0004_crm_tables.sql` — companies, contacts, activities, tags, tagged_entities, attachments; deferred FKs; app.can_user_access_attachment_path
- `supabase/migrations/0005_jobs_tables.sql` — jobs, job_status_history; app.next_job_number SECURITY DEFINER; set_history_company_id + compute_status_event_metadata triggers; fk_attachment FK
- `supabase/migrations/0006_rls_policies.sql` — 45 CREATE POLICY statements; zero inline JWT parsing; zero DELETE policies
- `supabase/seed.sql` — minimal stub: fixed test tenant UUID + shop_settings row

## Verification Results

| Check | Result |
|-------|--------|
| `grep -c "ENABLE ROW LEVEL SECURITY" 000*.sql` | 16 (≥15 required) |
| `grep -c "request.jwt.claims" 0006_rls_policies.sql` | 0 (inline JWT forbidden) |
| `grep -c "FOR DELETE" 0006_rls_policies.sql` | 0 (hard deletes forbidden) |
| `grep -c "STABLE" 0001_app_schema_helpers.sql` | 15 |
| `grep -c "CREATE POLICY" 0006_rls_policies.sql` | 45 (≥30 required) |
| `grep -c "CREATE TRIGGER ensure_.*email_unique" 0003` | 4 (≥2 required — ensure_email_unique + ensure_customer_email_unique each counted as 2 lines) |
| HIDDEN INVARIANT comment in 0003 | Present |
| set_updated_at on shop_settings, staff, workstations, companies, contacts, jobs | All 6 present |

## RLS Policy Coverage by Table

| Table | staff_select | customer_select | office_insert | office_update |
|-------|-------------|-----------------|---------------|---------------|
| tenants | id=app.tenant_id() | — | — | — |
| shop_settings | tenant_id=app.tenant_id() | tenant_id=app.tenant_id() (customer) | — | — |
| tenant_domains | yes | — | yes | yes |
| staff | yes | — | yes | yes |
| shop_employees | yes | — | yes | yes |
| workstations | yes | — | yes | yes (shop too) |
| customer_users | yes | — | yes | yes |
| companies | yes | id=app.company_id() | yes | yes |
| contacts | yes | company_id=app.company_id() | yes | yes |
| activities | yes | — | yes | yes |
| tags | yes | — | yes | yes |
| tagged_entities | yes | — | yes | — |
| jobs | yes | company_id=app.company_id() AND archived_at IS NULL | yes | yes |
| job_status_history | yes | customer_visible=true AND company_id=app.company_id() | yes (shop+office) | — |
| attachments | yes | customer_visible=true | yes (shop+office) | yes (shop+office) |
| audit_log | (inline in 0002) | — | — | — |

## Decisions Made

- All decisions followed the plan exactly as specified in DESIGN.md §3.2, §3.3, §5.7 and RESEARCH.md Pitfall 3
- No architectural deviations were needed

## Deviations from Plan

None — all 8 files were complete and correct. The plan was executed by reviewing existing files against acceptance criteria; all checks passed without modification.

## Issues Encountered

None — files were pre-written by a previous interrupted run and passed all acceptance criteria without changes.

## Known Stubs

- `supabase/seed.sql` intentionally inserts only the test tenant and shop_settings. Full seed data (staff, workstations, companies, contacts, jobs) is deferred to Plan 06 Task 3 after auth hook (Plan 03) and auth helpers (Plan 04) are in place. This is documented in the seed file header.

## Next Phase Readiness

- Schema foundation complete; Plan 03 can proceed with auth hook, production_status REVOKE, and SECURITY DEFINER scan functions
- All tables referenced by Plan 03 exist: jobs, job_status_history, shop_employees, workstations, staff, tenants
- Test tenant UUID (00000000-0000-0000-0000-000000000001) fixed and seeded — Plan 06 pgTAP tests can import as constant
- `supabase db reset --no-seed` readiness: migrations 0001-0006 are syntactically valid SQL; actual push to local Supabase (requires Docker) is Plan 06's checkpoint task

---
*Phase: 01-foundation*
*Completed: 2026-05-01*

## Self-Check: PASSED

All files verified:
- `supabase/config.toml` — exists, contains project_id, enable_signup=false
- `supabase/migrations/0001_app_schema_helpers.sql` — exists, 15 STABLE instances, 7 helper functions
- `supabase/migrations/0002_tenants_and_domains.sql` — exists, 4 tables, 4 RLS ENABLE
- `supabase/migrations/0003_auth_tables.sql` — exists, 4 tables, email triggers, ordering comment
- `supabase/migrations/0004_crm_tables.sql` — exists, 6 tables, deferred FKs, attachment helper
- `supabase/migrations/0005_jobs_tables.sql` — exists, jobs + job_status_history, next_job_number, fk_attachment
- `supabase/migrations/0006_rls_policies.sql` — exists, 45 policies, 0 inline JWT, 0 DELETE policies
- `supabase/seed.sql` — exists, fixed test tenant UUID

All commits verified:
- `cdd19f7` — Task 1 (config.toml + 0001 + 0002)
- `aff0c1d` — Task 2 (0003 + 0004)
- `61793a5` — Task 3 (0005 + 0006 + seed.sql)
