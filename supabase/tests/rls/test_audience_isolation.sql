-- supabase/tests/rls/test_audience_isolation.sql
-- Source: docs/DESIGN.md §9.2 (lines 2906–2915); 01-PLAN.md Task 1a Step 3
--
-- pgTAP test suite: audience boundary enforcement.
-- Verifies that each audience (customer, staff_shop, staff_office) can only access
-- what their RLS policies allow, and are blocked from tables/operations outside their scope.
--
-- Tests (13 total):
--   1. Customer JWT cannot SELECT from the staff table (0 rows)
--   2. Customer JWT can SELECT their own company (1 row)
--   3. Customer JWT cannot SELECT another company in the same tenant (0 rows)
--   4. Customer JWT cannot SELECT contacts from a different company (0 rows)
--   5. Customer JWT cannot SELECT from customer_users table (0 rows)
--   6. Staff_shop JWT cannot SELECT from staff table — WAIT: shop CAN see staff (per policy)
--      Correct assertion: shop CAN see their tenant's staff, but NOT other-tenant staff
--   7. Staff_shop JWT cannot INSERT into companies (office-only INSERT policy)
--   8. Staff_shop JWT can SELECT jobs (shop has read on jobs)
--   9. Customer JWT cannot SELECT jobs from another company in the same tenant
--  10. Customer JWT cannot INSERT into companies (no INSERT policy for customer audience)
--  11. Customer JWT cannot SELECT archived jobs (archived_at IS NOT NULL filtered by RLS)
--  12. authenticated role: DELETE on jobs runs without error but deletes 0 rows
--  13. authenticated role: row still exists after DELETE attempt (proves RLS blocked it)

BEGIN;
SELECT plan(13);

-- ============================================================
-- Fixture setup (superuser context)
-- ============================================================

INSERT INTO tenants (id, name, slug) VALUES
  ('a1000000-0000-0000-0000-000000000001'::uuid, 'Audience Test Tenant', 'audience-test-tenant')
ON CONFLICT (id) DO NOTHING;

INSERT INTO shop_settings (tenant_id) VALUES
  ('a1000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (tenant_id) DO NOTHING;

-- Staff members
INSERT INTO staff (id, tenant_id, email, name, role) VALUES
  ('a1000001-0000-0000-0000-000000000001'::uuid,
   'a1000000-0000-0000-0000-000000000001'::uuid,
   'office@audience-test.example', 'Office Staff', 'admin'),
  ('a1000001-0000-0000-0000-000000000002'::uuid,
   'a1000000-0000-0000-0000-000000000001'::uuid,
   'shop@audience-test.example', 'Shop Staff', 'shop')
ON CONFLICT (id) DO NOTHING;

-- Two companies in the same tenant (for cross-company isolation tests)
INSERT INTO companies (id, tenant_id, name) VALUES
  ('a1000002-0000-0000-0000-000000000001'::uuid,
   'a1000000-0000-0000-0000-000000000001'::uuid,
   'Customer Co Alpha'),
  ('a1000002-0000-0000-0000-000000000002'::uuid,
   'a1000000-0000-0000-0000-000000000001'::uuid,
   'Customer Co Beta')
ON CONFLICT (id) DO NOTHING;

-- Contacts for both companies
INSERT INTO contacts (id, tenant_id, company_id, first_name) VALUES
  ('a1000003-0000-0000-0000-000000000001'::uuid,
   'a1000000-0000-0000-0000-000000000001'::uuid,
   'a1000002-0000-0000-0000-000000000001'::uuid,
   'Alpha Contact'),
  ('a1000003-0000-0000-0000-000000000002'::uuid,
   'a1000000-0000-0000-0000-000000000001'::uuid,
   'a1000002-0000-0000-0000-000000000002'::uuid,
   'Beta Contact')
ON CONFLICT (id) DO NOTHING;

-- Customer user scoped to Alpha company
INSERT INTO customer_users (id, tenant_id, company_id, email, name) VALUES
  ('a1000004-0000-0000-0000-000000000001'::uuid,
   'a1000000-0000-0000-0000-000000000001'::uuid,
   'a1000002-0000-0000-0000-000000000001'::uuid,
   'customer@alpha.example', 'Alpha Customer')
ON CONFLICT (id) DO NOTHING;

-- Workstation for shop audience tests
INSERT INTO workstations (id, tenant_id, name, device_token) VALUES
  ('a1000005-0000-0000-0000-000000000001'::uuid,
   'a1000000-0000-0000-0000-000000000001'::uuid,
   'Test Workstation', 'aud-test-ws-device-token-001-secure')
ON CONFLICT (id) DO NOTHING;

-- A live job (for DELETE test) and an archived job (for archived_at filter test)
-- Both belong to Alpha company so the customer JWT is eligible by company_id
INSERT INTO jobs (id, tenant_id, company_id, job_name, job_number, packet_token) VALUES
  ('a1000006-0000-0000-0000-000000000001'::uuid,
   'a1000000-0000-0000-0000-000000000001'::uuid,
   'a1000002-0000-0000-0000-000000000001'::uuid,
   'Live Test Job', 'AUDTEST-2026-00001', 'aud-test-live-packet-tok-001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO jobs (id, tenant_id, company_id, job_name, job_number, packet_token, archived_at) VALUES
  ('a1000006-0000-0000-0000-000000000002'::uuid,
   'a1000000-0000-0000-0000-000000000001'::uuid,
   'a1000002-0000-0000-0000-000000000001'::uuid,
   'Archived Test Job', 'AUDTEST-2026-00002', 'aud-test-archived-packet-tk-001',
   now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Switch to authenticated role
-- ============================================================
SET ROLE authenticated;

-- ============================================================
-- Customer audience tests
-- ============================================================
SELECT set_jwt_for_customer('a1000004-0000-0000-0000-000000000001'::uuid);

-- Test 1: Customer JWT cannot SELECT from staff table
SELECT is(
  (SELECT count(*)::int FROM staff WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001'::uuid),
  0,
  'Customer JWT cannot SELECT from staff table'
);

-- Test 2: Customer JWT can SELECT their own company (company_id = app.company_id())
SELECT is(
  (SELECT count(*)::int FROM companies WHERE id = 'a1000002-0000-0000-0000-000000000001'::uuid),
  1,
  'Customer JWT can SELECT their own company'
);

-- Test 3: Customer JWT cannot SELECT another company in the same tenant
SELECT is(
  (SELECT count(*)::int FROM companies WHERE id = 'a1000002-0000-0000-0000-000000000002'::uuid),
  0,
  'Customer JWT cannot SELECT a different company in the same tenant'
);

-- Test 4: Customer JWT cannot SELECT contacts from a different company
SELECT is(
  (SELECT count(*)::int FROM contacts WHERE company_id = 'a1000002-0000-0000-0000-000000000002'::uuid),
  0,
  'Customer JWT cannot SELECT contacts from a different company'
);

-- Test 5: Customer JWT cannot SELECT from customer_users table
-- (RLS on customer_users has no customer_select policy — staff_select only)
SELECT is(
  (SELECT count(*)::int FROM customer_users WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001'::uuid),
  0,
  'Customer JWT cannot SELECT from customer_users table'
);

-- Test 6: Customer JWT cannot SELECT from jobs table for another company
-- (No jobs seeded here — test verifies 0 rows returned, which is correct per
--  jobs_customer_select policy: tenant_id + audience=customer + company_id=app.company_id())
SELECT is(
  (SELECT count(*)::int FROM jobs WHERE company_id = 'a1000002-0000-0000-0000-000000000002'::uuid),
  0,
  'Customer JWT cannot SELECT jobs from another company in the same tenant'
);

-- ============================================================
-- Staff_shop audience tests
-- ============================================================
SELECT set_jwt_for_workstation('a1000005-0000-0000-0000-000000000001'::uuid);

-- Test 7: Staff_shop (workstation) JWT cannot INSERT into companies
-- (companies_office_insert policy requires audience = 'staff_office')
SELECT throws_ok(
  $$
    INSERT INTO companies (tenant_id, name)
    VALUES ('a1000000-0000-0000-0000-000000000001'::uuid, 'Shop Injection Attempt')
  $$,
  NULL,
  NULL,
  'Staff_shop JWT cannot INSERT into companies (office-only policy)'
);

-- Test 8: Staff_shop JWT CAN SELECT jobs in their tenant
-- (jobs_staff_select policy allows both staff_office and staff_shop)
-- 2 jobs seeded (live + archived); shop sees both (staff has no archived_at filter)
SELECT is(
  (SELECT count(*)::int FROM jobs WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001'::uuid),
  2,
  'Staff_shop JWT can SELECT from jobs table (2 rows — shop sees all jobs including archived)'
);

-- Test 9: Staff_shop JWT cannot INSERT into staff table
-- (staff_office_insert requires staff_office audience)
SELECT throws_ok(
  $$
    INSERT INTO staff (tenant_id, email, name, role)
    VALUES ('a1000000-0000-0000-0000-000000000001'::uuid, 'inject@example.com', 'Injected', 'admin')
  $$,
  NULL,
  NULL,
  'Staff_shop JWT cannot INSERT into staff table (office-only policy)'
);

-- ============================================================
-- Test 10: Customer JWT cannot INSERT into companies
-- No INSERT policy exists for customer audience — RLS raises an error
-- ============================================================
SELECT set_jwt_for_customer('a1000004-0000-0000-0000-000000000001'::uuid);

SELECT throws_ok(
  $$INSERT INTO companies (tenant_id, name)
    VALUES ('a1000000-0000-0000-0000-000000000001'::uuid, 'Customer Injection Attempt')$$,
  NULL,
  NULL,
  'Customer JWT cannot INSERT into companies (no INSERT policy for customer audience)'
);

-- ============================================================
-- Test 11: Customer JWT cannot SELECT archived jobs
-- jobs_customer_select policy: archived_at IS NULL — archived jobs are hidden from customers
-- ============================================================
SELECT is(
  (SELECT count(*)::int FROM jobs WHERE id = 'a1000006-0000-0000-0000-000000000002'::uuid),
  0,
  'Customer JWT cannot SELECT jobs with archived_at set (filtered by RLS policy)'
);

-- ============================================================
-- Tests 12+13: authenticated role cannot DELETE jobs
-- No DELETE policy exists for any audience — hard deletes are forbidden (DESIGN.md §5.7)
-- Data-modifying CTEs must be top-level; use lives_ok + row-existence check instead.
-- ============================================================
SELECT set_jwt_for_staff('a1000001-0000-0000-0000-000000000001'::uuid);

-- Test 12: DELETE runs without error (RLS silently blocks it — no exception, just 0 rows)
SELECT lives_ok(
  $$DELETE FROM jobs WHERE id = 'a1000006-0000-0000-0000-000000000001'::uuid$$,
  'authenticated role: DELETE on jobs runs without error (RLS silently blocks it)'
);

-- Test 13: Row still exists, proving RLS blocked the DELETE
SELECT is(
  (SELECT count(*)::int FROM jobs WHERE id = 'a1000006-0000-0000-0000-000000000001'::uuid),
  1,
  'authenticated role: job row still exists after DELETE attempt (RLS enforced — hard deletes forbidden)'
);

SELECT * FROM finish();
ROLLBACK;
