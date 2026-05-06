-- supabase/tests/functions/test_record_scan_event.sql
-- Coverage for 0016_record_scan_event.sql
--
-- Tests (13):
--   Authorization (2):
--     1. Anon JWT → access_denied: scan requires staff session
--     2. Customer JWT → access_denied: scan requires staff session
--   Validation errors (5):
--     3. Invalid to_status → invalid_to_status: <value>
--     4. Job not found → job_not_found
--     5. Cross-tenant job → access_denied: cross-tenant scan blocked
--     6. Employee not found → employee_not_found
--     7. Workstation not found → workstation_not_found
--   Happy path side effects (6):
--     8.  Returns non-null UUID event_id
--     9.  job_status_history row has correct to_status
--     10. jobs.production_status updated
--     11. intake_status 'scheduled' promoted to 'in_production' on first scan
--     12. picked_up_at stamped when to_status='picked_up'
--     13. picked_up_at NOT overwritten on subsequent 'picked_up' scan (idempotent)

BEGIN;
SELECT plan(13);

-- ============================================================
-- Fixture setup (superuser context)
-- UUID prefix rr: record_scan_event test namespace
-- ============================================================

-- Tenant A (caller's tenant)
INSERT INTO tenants (id, name, slug) VALUES
  ('rr000000-0000-0000-0000-000000000001'::uuid, 'Scan Test Tenant A', 'scan-test-a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO shop_settings (tenant_id, tablet_inactivity_hours) VALUES
  ('rr000000-0000-0000-0000-000000000001'::uuid, 4)
ON CONFLICT (tenant_id) DO NOTHING;

-- Tenant B (for cross-tenant test)
INSERT INTO tenants (id, name, slug) VALUES
  ('rr000000-0000-0000-0000-000000000002'::uuid, 'Scan Test Tenant B', 'scan-test-b')
ON CONFLICT (id) DO NOTHING;

INSERT INTO shop_settings (tenant_id, tablet_inactivity_hours) VALUES
  ('rr000000-0000-0000-0000-000000000002'::uuid, 4)
ON CONFLICT (tenant_id) DO NOTHING;

-- Staff (office role → audience staff_office, sufficient for record_scan_event)
INSERT INTO staff (id, tenant_id, email, name, role) VALUES
  ('rr001000-0000-0000-0000-000000000001'::uuid,
   'rr000000-0000-0000-0000-000000000001'::uuid,
   'scanner@scan-test.example', 'Scan Test Staff', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Customer (for authorization rejection test)
INSERT INTO companies (id, tenant_id, name) VALUES
  ('rr004000-0000-0000-0000-000000000001'::uuid,
   'rr000000-0000-0000-0000-000000000001'::uuid, 'Scan Test Co')
ON CONFLICT (id) DO NOTHING;

INSERT INTO customer_users (id, tenant_id, company_id, email, name) VALUES
  ('rr005000-0000-0000-0000-000000000001'::uuid,
   'rr000000-0000-0000-0000-000000000001'::uuid,
   'rr004000-0000-0000-0000-000000000001'::uuid,
   'cust@scan-test.example', 'Scan Test Customer')
ON CONFLICT (id) DO NOTHING;

-- Shop employee (tenant A)
INSERT INTO shop_employees (id, tenant_id, display_name, pin_hash) VALUES
  ('rr002000-0000-0000-0000-000000000001'::uuid,
   'rr000000-0000-0000-0000-000000000001'::uuid,
   'Scanner Employee', crypt('0000', gen_salt('bf', 4)))
ON CONFLICT (id) DO NOTHING;

-- Workstation (tenant A)
INSERT INTO workstations (id, tenant_id, name, device_token) VALUES
  ('rr003000-0000-0000-0000-000000000001'::uuid,
   'rr000000-0000-0000-0000-000000000001'::uuid,
   'Scan Workstation', 'rr-scan-ws-device-token-0001')
ON CONFLICT (id) DO NOTHING;

-- Job A: in_production, production_status=received — happy path transition to 'prep'
INSERT INTO jobs (id, tenant_id, company_id, job_name, packet_token, job_number,
                  intake_status, production_status) VALUES
  ('rr006000-0000-0000-0000-000000000001'::uuid,
   'rr000000-0000-0000-0000-000000000001'::uuid,
   'rr004000-0000-0000-0000-000000000001'::uuid,
   'Scan Job A', 'rrscan001tok', 'RR-2026-00001',
   'in_production', 'received')
ON CONFLICT (id) DO NOTHING;

-- Job B: scheduled (intake_status) — verifies promotion to in_production on scan
INSERT INTO jobs (id, tenant_id, company_id, job_name, packet_token, job_number,
                  intake_status, production_status) VALUES
  ('rr006000-0000-0000-0000-000000000002'::uuid,
   'rr000000-0000-0000-0000-000000000001'::uuid,
   'rr004000-0000-0000-0000-000000000001'::uuid,
   'Scan Job B', 'rrscan002tok', 'RR-2026-00002',
   'scheduled', NULL)
ON CONFLICT (id) DO NOTHING;

-- Job C: in_production, production_status=qc — for picked_up_at stamp test
INSERT INTO jobs (id, tenant_id, company_id, job_name, packet_token, job_number,
                  intake_status, production_status) VALUES
  ('rr006000-0000-0000-0000-000000000003'::uuid,
   'rr000000-0000-0000-0000-000000000001'::uuid,
   'rr004000-0000-0000-0000-000000000001'::uuid,
   'Scan Job C', 'rrscan003tok', 'RR-2026-00003',
   'in_production', 'qc')
ON CONFLICT (id) DO NOTHING;

-- Job D: already has picked_up_at set — verifies idempotency guard
INSERT INTO jobs (id, tenant_id, company_id, job_name, packet_token, job_number,
                  intake_status, production_status, picked_up_at) VALUES
  ('rr006000-0000-0000-0000-000000000004'::uuid,
   'rr000000-0000-0000-0000-000000000001'::uuid,
   'rr004000-0000-0000-0000-000000000001'::uuid,
   'Scan Job D', 'rrscan004tok', 'RR-2026-00004',
   'in_production', 'completed',
   '2026-01-01 12:00:00+00'::timestamptz)
ON CONFLICT (id) DO NOTHING;

-- Cross-tenant job (tenant B) — for access_denied cross-tenant test
INSERT INTO jobs (id, tenant_id, company_id, job_name, packet_token, job_number,
                  intake_status, production_status) VALUES
  ('rr006000-0000-0000-0000-000000000005'::uuid,
   'rr000000-0000-0000-0000-000000000002'::uuid,  -- tenant B
   -- Tenant B needs its own company
   (SELECT id FROM (
     INSERT INTO companies (id, tenant_id, name)
       VALUES ('rr004000-0000-0000-0000-000000000002'::uuid,
               'rr000000-0000-0000-0000-000000000002'::uuid, 'Scan Test Co B')
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
       RETURNING id
   ) AS sub),
   'Scan Job E (cross-tenant)', 'rrscan005tok', 'RR-2026-00005',
   'in_production', 'received')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Switch to authenticated role
-- ============================================================
SET ROLE authenticated;

-- ============================================================
-- Test 1: Anon JWT → access_denied
-- ============================================================
SELECT set_jwt_anon();

SELECT throws_ok(
  $$SELECT app.record_scan_event(
      'rr006000-0000-0000-0000-000000000001'::uuid,
      'prep',
      'rr002000-0000-0000-0000-000000000001'::uuid,
      'rr003000-0000-0000-0000-000000000001'::uuid
    )$$,
  'P0001',
  'access_denied: scan requires staff session',
  'record_scan_event: anon JWT → access_denied'
);

-- ============================================================
-- Test 2: Customer JWT → access_denied
-- ============================================================
SELECT set_jwt_for_customer('rr005000-0000-0000-0000-000000000001'::uuid);

SELECT throws_ok(
  $$SELECT app.record_scan_event(
      'rr006000-0000-0000-0000-000000000001'::uuid,
      'prep',
      'rr002000-0000-0000-0000-000000000001'::uuid,
      'rr003000-0000-0000-0000-000000000001'::uuid
    )$$,
  'P0001',
  'access_denied: scan requires staff session',
  'record_scan_event: customer JWT → access_denied'
);

-- Switch to office staff for remaining tests
SELECT set_jwt_for_staff('rr001000-0000-0000-0000-000000000001'::uuid);

-- ============================================================
-- Test 3: Invalid to_status
-- ============================================================
SELECT throws_ok(
  $$SELECT app.record_scan_event(
      'rr006000-0000-0000-0000-000000000001'::uuid,
      'invalid_stage',
      'rr002000-0000-0000-0000-000000000001'::uuid,
      'rr003000-0000-0000-0000-000000000001'::uuid
    )$$,
  'P0001',
  NULL,
  'record_scan_event: invalid to_status → raises invalid_to_status'
);

-- ============================================================
-- Test 4: Job not found
-- ============================================================
SELECT throws_ok(
  $$SELECT app.record_scan_event(
      '00000000-0000-0000-0000-000000000099'::uuid,
      'prep',
      'rr002000-0000-0000-0000-000000000001'::uuid,
      'rr003000-0000-0000-0000-000000000001'::uuid
    )$$,
  'P0001',
  'job_not_found',
  'record_scan_event: nonexistent job → job_not_found'
);

-- ============================================================
-- Test 5: Cross-tenant job → access_denied: cross-tenant scan blocked
-- ============================================================
SELECT throws_ok(
  $$SELECT app.record_scan_event(
      'rr006000-0000-0000-0000-000000000005'::uuid,  -- tenant B's job
      'prep',
      'rr002000-0000-0000-0000-000000000001'::uuid,
      'rr003000-0000-0000-0000-000000000001'::uuid
    )$$,
  'P0001',
  'access_denied: cross-tenant scan blocked',
  'record_scan_event: cross-tenant job → access_denied: cross-tenant scan blocked'
);

-- ============================================================
-- Test 6: Employee not found
-- ============================================================
SELECT throws_ok(
  $$SELECT app.record_scan_event(
      'rr006000-0000-0000-0000-000000000001'::uuid,
      'prep',
      '00000000-0000-0000-0000-000000000099'::uuid,  -- nonexistent employee
      'rr003000-0000-0000-0000-000000000001'::uuid
    )$$,
  'P0001',
  'employee_not_found',
  'record_scan_event: nonexistent employee → employee_not_found'
);

-- ============================================================
-- Test 7: Workstation not found
-- ============================================================
SELECT throws_ok(
  $$SELECT app.record_scan_event(
      'rr006000-0000-0000-0000-000000000001'::uuid,
      'prep',
      'rr002000-0000-0000-0000-000000000001'::uuid,
      '00000000-0000-0000-0000-000000000099'::uuid  -- nonexistent workstation
    )$$,
  'P0001',
  'workstation_not_found',
  'record_scan_event: nonexistent workstation → workstation_not_found'
);

-- ============================================================
-- Test 8: Happy path — returns non-null UUID
-- Advance Job A: received → prep
-- ============================================================
SELECT isnt(
  app.record_scan_event(
    'rr006000-0000-0000-0000-000000000001'::uuid,
    'prep',
    'rr002000-0000-0000-0000-000000000001'::uuid,
    'rr003000-0000-0000-0000-000000000001'::uuid
  ),
  NULL,
  'record_scan_event: happy path returns non-null event UUID'
);

-- Additional side-effect calls (no assertions on these — verified via superuser reads below)
-- Job B scan: scheduled → in_production intake promotion test
PERFORM app.record_scan_event(
  'rr006000-0000-0000-0000-000000000002'::uuid,
  'received',
  'rr002000-0000-0000-0000-000000000001'::uuid,
  'rr003000-0000-0000-0000-000000000001'::uuid
);

-- Job C scan: qc → picked_up (stamps picked_up_at)
PERFORM app.record_scan_event(
  'rr006000-0000-0000-0000-000000000003'::uuid,
  'picked_up',
  'rr002000-0000-0000-0000-000000000001'::uuid,
  'rr003000-0000-0000-0000-000000000001'::uuid
);

-- Job D scan: completed → picked_up with existing picked_up_at (idempotency test)
PERFORM app.record_scan_event(
  'rr006000-0000-0000-0000-000000000004'::uuid,
  'picked_up',
  'rr002000-0000-0000-0000-000000000001'::uuid,
  'rr003000-0000-0000-0000-000000000001'::uuid
);

-- Switch back to superuser to read side effects (bypasses RLS)
RESET ROLE;

-- ============================================================
-- Test 9: job_status_history row has correct to_status for Job A
-- ============================================================
SELECT is(
  (SELECT to_status FROM job_status_history
   WHERE job_id = 'rr006000-0000-0000-0000-000000000001'::uuid
   ORDER BY scanned_at DESC LIMIT 1),
  'prep',
  'record_scan_event: job_status_history row records correct to_status'
);

-- ============================================================
-- Test 10: jobs.production_status updated for Job A
-- ============================================================
SELECT is(
  (SELECT production_status FROM jobs
   WHERE id = 'rr006000-0000-0000-0000-000000000001'::uuid),
  'prep',
  'record_scan_event: jobs.production_status updated after scan'
);

-- ============================================================
-- Test 11: intake_status promoted from scheduled → in_production (Job B)
-- ============================================================
SELECT is(
  (SELECT intake_status FROM jobs
   WHERE id = 'rr006000-0000-0000-0000-000000000002'::uuid),
  'in_production',
  'record_scan_event: first scan promotes intake_status from scheduled to in_production'
);

-- ============================================================
-- Test 12: picked_up_at stamped when to_status = picked_up (Job C)
-- ============================================================
SELECT isnt(
  (SELECT picked_up_at FROM jobs
   WHERE id = 'rr006000-0000-0000-0000-000000000003'::uuid),
  NULL,
  'record_scan_event: picked_up scan stamps picked_up_at'
);

-- ============================================================
-- Test 13: picked_up_at NOT overwritten if already set (Job D)
-- Job D was inserted with picked_up_at = 2026-01-01 12:00:00+00;
-- the subsequent picked_up scan must not change it.
-- ============================================================
SELECT is(
  (SELECT picked_up_at FROM jobs
   WHERE id = 'rr006000-0000-0000-0000-000000000004'::uuid),
  '2026-01-01 12:00:00+00'::timestamptz,
  'record_scan_event: picked_up_at not overwritten on subsequent picked_up scan'
);

SELECT * FROM finish();
ROLLBACK;
