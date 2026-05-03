-- 0008_production_status_revoke.sql
-- Source: docs/DESIGN.md §4.3 (Module 3 hidden invariant); CLAUDE.md hidden invariants
--
-- HIDDEN INVARIANT (CLAUDE.md):
-- Direct UPDATE of jobs.production_status is forbidden for the authenticated role.
-- All transitions go ONLY through app.record_scan_event() SECURITY DEFINER (Phase 3).
-- This column-level REVOKE is the database-level enforcement of that invariant.
-- Even if a developer writes UPDATE jobs SET production_status = ... in application code,
-- Postgres rejects it because the authenticated role has no UPDATE privilege on this
-- specific column. This creates an auditable, tamper-proof scan event trail.
--
-- Must run AFTER 0005_jobs_tables.sql (which creates the jobs table).
-- app.record_scan_event() will be added in Phase 3 with a SECURITY DEFINER grant.

REVOKE UPDATE (production_status) ON jobs FROM authenticated;
