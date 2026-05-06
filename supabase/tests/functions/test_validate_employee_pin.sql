-- supabase/tests/functions/test_validate_employee_pin.sql
-- Coverage for 0015_validate_employee_pin.sql
--
-- Tests (8):
--   1. Correct PIN returns {ok:true, employee_id}
--   2. Nonexistent employee returns tenant_mismatch (anti-enumeration)
--   3. Cross-tenant employee returns tenant_mismatch
--   4. Inactive employee returns inactive
--   5. Locked employee returns locked
--   6. Wrong PIN returns {ok:false, reason:invalid_pin, attempts_remaining:4}
--   7. 5th consecutive failure triggers lockout (attempts_remaining:0)
--   8. Expired lockout does not block correct PIN

BEGIN;
SELECT plan(8);

-- ============================================================
-- Fixture setup (superuser context)
-- UUID prefix pp: pin-test-specific namespace
-- ============================================================

INSERT INTO tenants (id, name, slug) VALUES
  ('pp000000-0000-0000-0000-000000000001'::uuid, 'PIN Test Tenant A', 'pin-test-a'),
  ('pp000000-0000-0000-0000-000000000002'::uuid, 'PIN Test Tenant B', 'pin-test-b')
ON CONFLICT (id) DO NOTHING;

INSERT INTO shop_settings (tenant_id, tablet_inactivity_hours) VALUES
  ('pp000000-0000-0000-0000-000000000001'::uuid, 4),
  ('pp000000-0000-0000-0000-000000000002'::uuid, 4)
ON CONFLICT (tenant_id) DO NOTHING;

-- A staff member so we can acquire an authenticated role JWT for calling the function.
-- validate_employee_pin doesn't read JWT claims internally; any authenticated session works.
INSERT INTO staff (id, tenant_id, email, name, role) VALUES
  ('pp001000-0000-0000-0000-000000000001'::uuid,
   'pp000000-0000-0000-0000-000000000001'::uuid,
   'caller@pin-test.example', 'PIN Test Caller', 'admin')
ON CONFLICT (id) DO NOTHING;

-- E1: active employee in tenant A, PIN = '1234'
INSERT INTO shop_employees (id, tenant_id, display_name, pin_hash) VALUES
  ('pp002000-0000-0000-0000-000000000001'::uuid,
   'pp000000-0000-0000-0000-000000000001'::uuid,
   'Active Employee', crypt('1234', gen_salt('bf', 4)))
ON CONFLICT (id) DO NOTHING;

-- E2: active employee in tenant B (cross-tenant scenario)
INSERT INTO shop_employees (id, tenant_id, display_name, pin_hash) VALUES
  ('pp002000-0000-0000-0000-000000000002'::uuid,
   'pp000000-0000-0000-0000-000000000002'::uuid,
   'Tenant B Employee', crypt('1234', gen_salt('bf', 4)))
ON CONFLICT (id) DO NOTHING;

-- E3: inactive employee in tenant A
INSERT INTO shop_employees (id, tenant_id, display_name, pin_hash, is_active) VALUES
  ('pp002000-0000-0000-0000-000000000003'::uuid,
   'pp000000-0000-0000-0000-000000000001'::uuid,
   'Inactive Employee', crypt('1234', gen_salt('bf', 4)), false)
ON CONFLICT (id) DO NOTHING;

-- E4: locked employee in tenant A (locked_until in the future)
INSERT INTO shop_employees (id, tenant_id, display_name, pin_hash, failed_pin_attempts, locked_until) VALUES
  ('pp002000-0000-0000-0000-000000000004'::uuid,
   'pp000000-0000-0000-0000-000000000001'::uuid,
   'Locked Employee', crypt('1234', gen_salt('bf', 4)),
   5, now() + interval '15 minutes')
ON CONFLICT (id) DO NOTHING;

-- E5: 4 prior failed attempts — one more failure triggers lockout
INSERT INTO shop_employees (id, tenant_id, display_name, pin_hash, failed_pin_attempts) VALUES
  ('pp002000-0000-0000-0000-000000000005'::uuid,
   'pp000000-0000-0000-0000-000000000001'::uuid,
   'Almost Locked Employee', crypt('1234', gen_salt('bf', 4)), 4)
ON CONFLICT (id) DO NOTHING;

-- E6: fresh employee for wrong-PIN / attempts_remaining test (0 prior failures)
INSERT INTO shop_employees (id, tenant_id, display_name, pin_hash, failed_pin_attempts) VALUES
  ('pp002000-0000-0000-0000-000000000006'::uuid,
   'pp000000-0000-0000-0000-000000000001'::uuid,
   'Fresh Wrong Pin Employee', crypt('1234', gen_salt('bf', 4)), 0)
ON CONFLICT (id) DO NOTHING;

-- E7: expired lockout — locked_until in the past; correct PIN should succeed
INSERT INTO shop_employees (id, tenant_id, display_name, pin_hash, failed_pin_attempts, locked_until) VALUES
  ('pp002000-0000-0000-0000-000000000007'::uuid,
   'pp000000-0000-0000-0000-000000000001'::uuid,
   'Expired Lock Employee', crypt('1234', gen_salt('bf', 4)),
   5, now() - interval '1 hour')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Switch to authenticated role; use caller staff JWT
-- ============================================================
SET ROLE authenticated;
SELECT set_jwt_for_staff('pp001000-0000-0000-0000-000000000001'::uuid);

-- ============================================================
-- Test 1: correct PIN returns {ok:true, employee_id}
-- ============================================================
SELECT is(
  app.validate_employee_pin(
    'pp000000-0000-0000-0000-000000000001'::uuid,
    'pp002000-0000-0000-0000-000000000001'::uuid,
    '1234'
  ),
  jsonb_build_object('ok', true, 'employee_id', 'pp002000-0000-0000-0000-000000000001'::uuid),
  'validate_employee_pin: correct PIN returns ok=true with employee_id'
);

-- ============================================================
-- Test 2: nonexistent employee → tenant_mismatch (anti-enumeration)
-- ============================================================
SELECT is(
  app.validate_employee_pin(
    'pp000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000099'::uuid,  -- does not exist
    '1234'
  ) ->> 'reason',
  'tenant_mismatch',
  'validate_employee_pin: nonexistent employee → tenant_mismatch (anti-enumeration)'
);

-- ============================================================
-- Test 3: cross-tenant employee → tenant_mismatch
-- ============================================================
SELECT is(
  app.validate_employee_pin(
    'pp000000-0000-0000-0000-000000000001'::uuid,  -- tenant A
    'pp002000-0000-0000-0000-000000000002'::uuid,  -- E2 belongs to tenant B
    '1234'
  ) ->> 'reason',
  'tenant_mismatch',
  'validate_employee_pin: cross-tenant employee → tenant_mismatch'
);

-- ============================================================
-- Test 4: inactive employee → inactive
-- ============================================================
SELECT is(
  app.validate_employee_pin(
    'pp000000-0000-0000-0000-000000000001'::uuid,
    'pp002000-0000-0000-0000-000000000003'::uuid,
    '1234'
  ) ->> 'reason',
  'inactive',
  'validate_employee_pin: inactive employee → reason=inactive'
);

-- ============================================================
-- Test 5: locked employee → locked
-- ============================================================
SELECT is(
  app.validate_employee_pin(
    'pp000000-0000-0000-0000-000000000001'::uuid,
    'pp002000-0000-0000-0000-000000000004'::uuid,
    '1234'
  ) ->> 'reason',
  'locked',
  'validate_employee_pin: locked employee → reason=locked'
);

-- ============================================================
-- Test 6: wrong PIN on fresh employee → invalid_pin, attempts_remaining=4
-- ============================================================
SELECT is(
  app.validate_employee_pin(
    'pp000000-0000-0000-0000-000000000001'::uuid,
    'pp002000-0000-0000-0000-000000000006'::uuid,
    'wrong'
  ),
  jsonb_build_object('ok', false, 'reason', 'invalid_pin', 'attempts_remaining', 4),
  'validate_employee_pin: wrong PIN (0 prior failures) → invalid_pin, attempts_remaining=4'
);

-- ============================================================
-- Test 7: 5th failure (4 prior) → attempts_remaining=0
-- ============================================================
SELECT is(
  (app.validate_employee_pin(
    'pp000000-0000-0000-0000-000000000001'::uuid,
    'pp002000-0000-0000-0000-000000000005'::uuid,
    'wrong'
  ) ->> 'attempts_remaining')::int,
  0,
  'validate_employee_pin: 5th consecutive failure → attempts_remaining=0 (lockout triggered)'
);

-- ============================================================
-- Test 8: expired lockout (locked_until in past) → correct PIN succeeds
-- ============================================================
SELECT is(
  (app.validate_employee_pin(
    'pp000000-0000-0000-0000-000000000001'::uuid,
    'pp002000-0000-0000-0000-000000000007'::uuid,
    '1234'
  ) ->> 'ok')::boolean,
  true,
  'validate_employee_pin: expired lockout does not block correct PIN'
);

SELECT * FROM finish();
ROLLBACK;
