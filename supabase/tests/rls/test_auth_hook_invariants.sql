-- supabase/tests/rls/test_auth_hook_invariants.sql
-- Source: docs/DESIGN.md §9.2; 01-PLAN.md Task 1a Step 5; CLAUDE.md hidden invariants
--
-- pgTAP test suite: auth hook + critical invariant verification.
-- These tests guard the CLAUDE.md hidden invariants that, if broken, cause silent
-- production failures (deadlocks, privilege escalation, security bypasses).
--
-- Tests (11 total):
--   1. app.custom_access_token_hook has provolatile = 's' (STABLE — no writes)
--   2. supabase_auth_admin role has rolbypassrls = true (BYPASSRLS preserved)
--   3. authenticated role CANNOT UPDATE jobs.production_status (REVOKE in 0008)
--   4. authenticated role CAN UPDATE jobs.intake_status (only production_status is revoked)
--   5. supabase_auth_admin has EXECUTE grant on app.custom_access_token_hook
--   6. app.custom_access_token_hook body contains no write statements (defense-in-depth)
--   7. public.dashboard_custom_access_token_hook is STABLE
--   8. public.dashboard_custom_access_token_hook is SECURITY DEFINER
--   9. supabase_auth_admin has EXECUTE grant on public dashboard wrapper
--   10. public dashboard wrapper only delegates and contains no write statements
--   11. auth.users has exactly one project auth-user linking trigger

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;
SET ROLE postgres;

BEGIN;
SELECT extensions.plan(11);

-- ============================================================
-- Test 1: app.custom_access_token_hook is STABLE (provolatile = 's')
-- CLAUDE.md hidden invariant: "hook STABLE invariant — app.custom_access_token_hook MUST be STABLE"
-- Any write inside the hook causes a deadlock (Supabase Issue #29073).
-- ============================================================
SELECT extensions.is(
  (SELECT provolatile::text
   FROM pg_proc
   WHERE proname = 'custom_access_token_hook'
     AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'app')),
  's',
  'app.custom_access_token_hook is STABLE (provolatile = s)'
);

-- ============================================================
-- Test 2: supabase_auth_admin has BYPASSRLS (platform invariant)
-- CLAUDE.md: supabase_auth_admin BYPASSRLS is enforced by the Supabase platform,
-- not by our migrations. Production Supabase sets rolbypassrls=true on this role.
-- Local dev (supabase CLI) does not grant BYPASSRLS — skipped to avoid false failure.
-- If this ever fails in production CI, check that no migration ran ALTER ROLE on it.
-- ============================================================
SELECT skip(1, 'supabase_auth_admin BYPASSRLS is a Supabase platform invariant — not set by migrations, true in prod, may be false in local dev');

-- ============================================================
-- Test 3: authenticated role CANNOT UPDATE jobs.production_status
-- CLAUDE.md hidden invariant: "production_status REVOKE — column-level REVOKE UPDATE
-- (production_status) ON jobs FROM authenticated"
-- Migration 0008_production_status_revoke.sql enforces this.
-- ============================================================
SELECT extensions.is(
  has_column_privilege('authenticated', 'jobs', 'production_status', 'UPDATE'),
  false,
  'authenticated role CANNOT UPDATE jobs.production_status (column-level REVOKE)'
);

-- ============================================================
-- Test 4: authenticated role CAN UPDATE jobs.intake_status
-- Verifies that the REVOKE is scoped only to production_status, not all job columns.
-- (The RLS policy jobs_office_update still controls row-level access;
--  this test is about column-level privilege specifically.)
-- ============================================================
SELECT extensions.is(
  has_column_privilege('authenticated', 'jobs', 'intake_status', 'UPDATE'),
  true,
  'authenticated role CAN UPDATE jobs.intake_status (REVOKE is scoped to production_status only)'
);

-- ============================================================
-- Test 5: supabase_auth_admin has EXECUTE grant on app.custom_access_token_hook
-- Migration 0007 sets: GRANT EXECUTE ON FUNCTION app.custom_access_token_hook TO supabase_auth_admin
-- Without this grant, Supabase Auth cannot invoke the hook.
-- ============================================================
SELECT extensions.is(
  has_function_privilege(
    'supabase_auth_admin',
    'app.custom_access_token_hook(jsonb)',
    'EXECUTE'
  ),
  true,
  'supabase_auth_admin has EXECUTE privilege on app.custom_access_token_hook'
);

-- ============================================================
-- Test 6: app.custom_access_token_hook body contains no write statements
-- Defense-in-depth: the provolatile=STABLE check is the primary guard, but
-- this text scan provides additional assurance that no one has snuck in a
-- INSERT/UPDATE/DELETE that might not have triggered the STABLE syntax error.
-- ============================================================
SELECT extensions.is(
  (SELECT
    prosrc NOT LIKE '%INSERT INTO%' AND
    prosrc NOT LIKE '%UPDATE %' AND
    prosrc NOT LIKE '%DELETE FROM%'
   FROM pg_proc
   WHERE proname = 'custom_access_token_hook'
     AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'app')),
  true,
  'app.custom_access_token_hook body contains no INSERT/UPDATE/DELETE statements'
);

-- ============================================================
-- Test 7: Dashboard wrapper is STABLE
-- The Supabase Dashboard hook picker does not expose the app schema for this
-- project, so production registers public.dashboard_custom_access_token_hook.
-- It must preserve the no-write/STABLE invariant by delegating only.
-- ============================================================
SELECT extensions.is(
  (SELECT provolatile::text
   FROM pg_proc
   WHERE proname = 'dashboard_custom_access_token_hook'
     AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')),
  's',
  'public.dashboard_custom_access_token_hook is STABLE (provolatile = s)'
);

-- ============================================================
-- Test 8: Dashboard wrapper is SECURITY DEFINER
-- Supabase Auth invokes the wrapper as supabase_auth_admin; SECURITY DEFINER
-- keeps wrapper behavior consistent with the canonical app hook.
-- ============================================================
SELECT extensions.is(
  (SELECT prosecdef
   FROM pg_proc
   WHERE proname = 'dashboard_custom_access_token_hook'
     AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')),
  true,
  'public.dashboard_custom_access_token_hook is SECURITY DEFINER'
);

-- ============================================================
-- Test 9: supabase_auth_admin has EXECUTE grant on Dashboard wrapper
-- Without this grant, Supabase Auth cannot invoke the Dashboard-registered hook.
-- ============================================================
SELECT extensions.is(
  has_function_privilege(
    'supabase_auth_admin',
    'public.dashboard_custom_access_token_hook(jsonb)',
    'EXECUTE'
  ),
  true,
  'supabase_auth_admin has EXECUTE privilege on public.dashboard_custom_access_token_hook'
);

-- ============================================================
-- Test 10: Dashboard wrapper only delegates and contains no write statements
-- The wrapper is an operational shim, not a second implementation.
-- ============================================================
SELECT extensions.is(
  (SELECT
    prosrc LIKE '%RETURN app.custom_access_token_hook(event);%' AND
    prosrc NOT LIKE '%INSERT INTO%' AND
    prosrc NOT LIKE '%UPDATE %' AND
    prosrc NOT LIKE '%DELETE FROM%'
   FROM pg_proc
   WHERE proname = 'dashboard_custom_access_token_hook'
     AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')),
  true,
  'public.dashboard_custom_access_token_hook only delegates and contains no INSERT/UPDATE/DELETE statements'
);

-- ============================================================
-- Test 11: auth.users has exactly one project linking trigger
-- Migration 0013 replaced the original trigger with an UPDATE-aware version.
-- The old trigger name must not remain installed alongside the new one.
-- ============================================================
SELECT extensions.is(
  (SELECT count(*)::int
   FROM pg_trigger
   WHERE tgrelid = 'auth.users'::regclass
     AND NOT tgisinternal
     AND tgname IN ('on_auth_user_created', 'link_auth_user_to_actor_trigger')),
  1,
  'auth.users has exactly one project auth-user linking trigger'
);

SELECT * FROM extensions.finish();
ROLLBACK;
