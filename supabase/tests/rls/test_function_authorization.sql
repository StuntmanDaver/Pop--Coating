-- supabase/tests/rls/test_function_authorization.sql
-- Source: docs/DESIGN.md §9.2 (lines 2917–2927); 01-PLAN.md Task 1a Step 4
--
-- pgTAP test suite: SECURITY DEFINER function authorization.
-- Phase 1 covers workstation lifecycle functions (claim_workstation,
-- record_workstation_heartbeat, release_workstation) and next_job_number.
-- app.record_scan_event and app.validate_employee_pin are Phase 3 tests.
--
-- Tests (6 total):
--   1. claim_workstation: enforces caller workstation_id match (raises if mismatch)
--   2. claim_workstation: enforces optimistic concurrency (rejects stale version)
--   3. next_job_number: raises 'access_denied' for customer JWT audience
--   4. next_job_number: raises 'tenant_id_missing' if JWT has no tenant_id
--   5. record_workstation_heartbeat: raises 'access_denied' if not staff_shop audience
--   6. release_workstation: raises 'access_denied' if no workstation_id in JWT

BEGIN;
SELECT plan(6);

-- ============================================================
-- Fixture setup (superuser context)
-- ============================================================

INSERT INTO tenants (id, name, slug) VALUES
  ('f0000000-0000-0000-0000-000000000001'::uuid, 'Function Auth Tenant', 'func-auth-tenant')
ON CONFLICT (id) DO NOTHING;

INSERT INTO shop_settings (tenant_id, tablet_inactivity_hours) VALUES
  ('f0000000-0000-0000-0000-000000000001'::uuid, 4)
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO staff (id, tenant_id, email, name, role) VALUES
  ('f0000001-0000-0000-0000-000000000001'::uuid,
   'f0000000-0000-0000-0000-000000000001'::uuid,
   'office@func-auth.example', 'Func Office Staff', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Two workstations: WS-A is the caller's workstation; WS-B is "someone else's"
INSERT INTO workstations (id, tenant_id, name, device_token) VALUES
  ('f0000002-0000-0000-0000-000000000001'::uuid,
   'f0000000-0000-0000-0000-000000000001'::uuid,
   'Workstation A', 'func-auth-ws-a-device-token-001'),
  ('f0000002-0000-0000-0000-000000000002'::uuid,
   'f0000000-0000-0000-0000-000000000001'::uuid,
   'Workstation B', 'func-auth-ws-b-device-token-002')
ON CONFLICT (id) DO NOTHING;

-- A shop employee to use as claimant
INSERT INTO shop_employees (id, tenant_id, display_name, pin_hash) VALUES
  ('f0000003-0000-0000-0000-000000000001'::uuid,
   'f0000000-0000-0000-0000-000000000001'::uuid,
   'Floor Worker', 'placeholder-hash')
ON CONFLICT (id) DO NOTHING;

-- A customer for testing next_job_number rejection
INSERT INTO companies (id, tenant_id, name) VALUES
  ('f0000004-0000-0000-0000-000000000001'::uuid,
   'f0000000-0000-0000-0000-000000000001'::uuid,
   'Func Auth Customer Co')
ON CONFLICT (id) DO NOTHING;

INSERT INTO customer_users (id, tenant_id, company_id, email, name) VALUES
  ('f0000005-0000-0000-0000-000000000001'::uuid,
   'f0000000-0000-0000-0000-000000000001'::uuid,
   'f0000004-0000-0000-0000-000000000001'::uuid,
   'cust@func-auth.example', 'Func Auth Customer')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Switch to authenticated role
-- ============================================================
SET ROLE authenticated;

-- ============================================================
-- Test 1: claim_workstation enforces caller workstation_id match
-- Simulate WS-A's JWT but call claim_workstation with WS-B's ID → should raise
-- ============================================================
SELECT set_jwt_for_workstation('f0000002-0000-0000-0000-000000000001'::uuid);

SELECT throws_ok(
  $$
    SELECT app.claim_workstation(
      'f0000002-0000-0000-0000-000000000002'::uuid,  -- WS-B (not caller's workstation)
      'f0000003-0000-0000-0000-000000000001'::uuid,  -- shop employee
      0  -- expected version
    )
  $$,
  'P0001',  -- SQLSTATE for RAISE EXCEPTION in plpgsql
  'access_denied: can only claim own workstation',
  'claim_workstation: enforces caller workstation_id match (raises on mismatch)'
);

-- ============================================================
-- Test 2: claim_workstation enforces optimistic concurrency (stale version)
-- Call claim_workstation with the CORRECT workstation ID but WRONG version
-- ============================================================
SELECT throws_ok(
  $$
    -- First, actually claim it so version becomes 1
    DO $$
    BEGIN
      -- We can only really test stale version by trying twice; easier to just test that
      -- a non-zero expected_version fails when actual version is 0.
      -- Version starts at 0; passing expected_version=99 simulates stale.
      PERFORM app.claim_workstation(
        'f0000002-0000-0000-0000-000000000001'::uuid,  -- own workstation
        'f0000003-0000-0000-0000-000000000001'::uuid,
        99  -- stale version — actual is 0
      );
    END$$
  $$,
  NULL,  -- no exception raised — claim_workstation returns ok:false on stale (no throw)
  NULL,
  'claim_workstation: returns ok:false on stale version (no exception for version mismatch)'
);

-- Verify the stale-version call returned ok:false (not an exception, just a false result)
-- Re-run without DO block to check the return value
SELECT is(
  (SELECT (app.claim_workstation(
    'f0000002-0000-0000-0000-000000000001'::uuid,
    'f0000003-0000-0000-0000-000000000001'::uuid,
    99  -- stale version
  ) ->> 'ok')::boolean),
  false,
  'claim_workstation: stale version returns ok=false (workstation_in_use_or_stale_version)'
);

-- ============================================================
-- Test 3: next_job_number raises 'access_denied' for customer JWT
-- ============================================================
SELECT set_jwt_for_customer('f0000005-0000-0000-0000-000000000001'::uuid);

SELECT throws_ok(
  $$SELECT app.next_job_number()$$,
  'P0001',
  'access_denied: only staff can generate job numbers',
  'next_job_number: raises access_denied for customer audience'
);

-- ============================================================
-- Test 4: next_job_number raises 'tenant_id_missing' when JWT has no tenant_id
-- ============================================================
SELECT set_jwt_anon();

SELECT throws_ok(
  $$SELECT app.next_job_number()$$,
  'P0001',
  'tenant_id_missing: caller must have valid JWT',
  'next_job_number: raises tenant_id_missing when JWT has no tenant_id'
);

-- ============================================================
-- Test 5: record_workstation_heartbeat raises 'access_denied' if not staff_shop audience
-- (Use office staff JWT — audience = 'staff_office', not 'staff_shop')
-- ============================================================
SELECT set_jwt_for_staff('f0000001-0000-0000-0000-000000000001'::uuid);

SELECT throws_ok(
  $$SELECT app.record_workstation_heartbeat()$$,
  'P0001',
  'access_denied: heartbeat requires shop session',
  'record_workstation_heartbeat: raises access_denied for non-shop audience'
);

-- ============================================================
-- Test 6: release_workstation raises 'access_denied' if no workstation_id in JWT
-- (Use office staff JWT — no workstation_id in app_metadata)
-- ============================================================
SELECT throws_ok(
  $$SELECT app.release_workstation()$$,
  'P0001',
  'access_denied: release requires shop session',
  'release_workstation: raises access_denied for non-shop audience'
);

SELECT * FROM finish();
ROLLBACK;
