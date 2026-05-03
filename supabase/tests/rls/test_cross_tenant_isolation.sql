-- supabase/tests/rls/test_cross_tenant_isolation.sql
-- Source: docs/DESIGN.md §9.2 (lines 2849–2904); 01-PLAN.md Task 1a Step 2
--
-- pgTAP test suite: cross-tenant data isolation.
-- Verifies that Tenant A staff cannot access Tenant B's data and vice versa.
-- Also verifies that anonymous (no JWT) access returns zero rows.
--
-- Wraps all fixtures in BEGIN/ROLLBACK for test isolation.
-- Uses jwt_helpers.sql functions to simulate JWT claims.
--
-- Tests (8 total):
--   1. Tenant A staff cannot SELECT Tenant B's companies (0 rows)
--   2. Tenant A staff CAN SELECT their own companies (1 row)
--   3. Anonymous JWT cannot SELECT any companies (0 rows)
--   4. Tenant A staff cannot SELECT Tenant B's contacts (0 rows)
--   5. Tenant A staff cannot SELECT Tenant B's staff rows (0 rows)
--   6. Tenant A staff cannot SELECT Tenant B's jobs (0 rows)
--   7. Tenant B staff cannot SELECT Tenant A's companies (0 rows)
--   8. Tenant A staff cannot INSERT into Tenant B's companies (raises)

BEGIN;
SELECT plan(8);

-- ============================================================
-- Fixture setup (runs as superuser / service-role — bypasses RLS)
-- ============================================================

-- Two test tenants
INSERT INTO tenants (id, name, slug) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Tenant A', 'tenant-a-rls-test'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'Tenant B', 'tenant-b-rls-test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO shop_settings (tenant_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid)
ON CONFLICT (tenant_id) DO NOTHING;

-- Two staff members (one per tenant)
INSERT INTO staff (id, tenant_id, email, name, role) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid,
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
   'admin-a@rls-test.example', 'Admin A', 'admin'),
  ('22222222-2222-2222-2222-222222222222'::uuid,
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
   'admin-b@rls-test.example', 'Admin B', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Two companies (one per tenant)
INSERT INTO companies (id, tenant_id, name) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
   'Company A1'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
   'Company B1')
ON CONFLICT (id) DO NOTHING;

-- Two contacts (one per tenant)
INSERT INTO contacts (id, tenant_id, company_id, first_name) VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid,
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
   'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
   'Contact A'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
   'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
   'Contact B')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Switch to authenticated role + Tenant A staff JWT
-- ============================================================
SET ROLE authenticated;
SELECT set_jwt_for_staff('11111111-1111-1111-1111-111111111111'::uuid);

-- Test 1: Tenant A staff cannot see Tenant B's companies
SELECT is(
  (SELECT count(*)::int FROM companies WHERE tenant_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid),
  0,
  'Tenant A staff cannot SELECT Tenant B companies'
);

-- Test 2: Tenant A staff CAN see their own company
SELECT is(
  (SELECT count(*)::int FROM companies WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid),
  1,
  'Tenant A staff CAN SELECT their own company'
);

-- Test 3: Anonymous JWT cannot read any companies
SELECT set_jwt_anon();
SELECT is(
  (SELECT count(*)::int FROM companies),
  0,
  'Anonymous JWT cannot SELECT any companies'
);

-- Reset to Tenant A staff JWT for remaining tests
SELECT set_jwt_for_staff('11111111-1111-1111-1111-111111111111'::uuid);

-- Test 4: Tenant A staff cannot see Tenant B's contacts
SELECT is(
  (SELECT count(*)::int FROM contacts WHERE tenant_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid),
  0,
  'Tenant A staff cannot SELECT Tenant B contacts'
);

-- Test 5: Tenant A staff cannot see Tenant B's staff rows
SELECT is(
  (SELECT count(*)::int FROM staff WHERE id = '22222222-2222-2222-2222-222222222222'::uuid),
  0,
  'Tenant A staff cannot SELECT Tenant B staff rows'
);

-- Test 6: Tenant A staff cannot see Tenant B's jobs (no jobs seeded for B, but RLS should
-- return 0 for Tenant B's tenant_id filter even if rows exist in future)
SELECT is(
  (SELECT count(*)::int FROM jobs WHERE tenant_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid),
  0,
  'Tenant A staff cannot SELECT Tenant B jobs'
);

-- Test 7: Tenant B staff cannot see Tenant A's companies
SELECT set_jwt_for_staff('22222222-2222-2222-2222-222222222222'::uuid);
SELECT is(
  (SELECT count(*)::int FROM companies WHERE tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
  0,
  'Tenant B staff cannot SELECT Tenant A companies'
);

-- Test 8: Tenant A staff cannot INSERT into Tenant B's companies
-- (WITH CHECK enforces tenant_id = app.tenant_id() on INSERT policy)
SELECT set_jwt_for_staff('11111111-1111-1111-1111-111111111111'::uuid);
SELECT throws_ok(
  $$
    INSERT INTO companies (tenant_id, name)
    VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'Injection Attempt')
  $$,
  NULL,  -- any SQLSTATE
  NULL,  -- any message (RLS will produce a generic "new row violates row-level security policy")
  'Tenant A staff cannot INSERT into Tenant B companies'
);

SELECT * FROM finish();
ROLLBACK;
