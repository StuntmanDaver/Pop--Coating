-- 0012_app_schema_usage_grant.sql
-- The app schema was created in 0001 without GRANT USAGE to authenticated/anon.
-- Without USAGE, authenticated role cannot explicitly call app.* functions
-- (e.g., app.claim_workstation(), app.next_job_number()) even when EXECUTE is granted.
-- RLS policy expressions work fine (evaluated under table owner privileges), but
-- direct client-side calls to SECURITY DEFINER functions require schema USAGE.
-- Ref: Postgres docs — schema USAGE is required to resolve any object in that schema.

GRANT USAGE ON SCHEMA app TO authenticated, anon;
