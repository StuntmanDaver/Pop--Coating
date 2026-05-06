-- supabase/tests/functions/test_jobs_packet_dirty_trigger.sql
-- Coverage for 0017_jobs_packet_dirty_trigger.sql
--
-- Trigger: mark_packet_dirty_on_jobs_update (BEFORE UPDATE ON jobs)
-- Rule: updating any printed field sets packet_dirty=true.
--       Updating ONLY packet_dirty (loop guard) passes through unchanged.
--       Updating non-printed fields (notes, etc.) leaves packet_dirty unchanged.
--
-- Tests (10):
--   1-7: Printed field changes set packet_dirty=true
--     1. job_name
--     2. color
--     3. coating_type
--     4. part_count
--     5. due_date
--     6. priority
--     7. job_number
--   8. Loop guard: clearing packet_dirty (true→false) with no content change passes through
--   9. Non-printed field update (notes) does NOT set packet_dirty
--  10. production_status update (via direct superuser write) does NOT set packet_dirty
--
-- Runs entirely as superuser — no SET ROLE needed; trigger behavior is role-independent.

BEGIN;
SELECT plan(10);

-- ============================================================
-- Fixture setup
-- UUID prefix tt: trigger test namespace
-- ============================================================

INSERT INTO tenants (id, name, slug) VALUES
  ('tt000000-0000-0000-0000-000000000001'::uuid, 'Trigger Test Tenant', 'trigger-test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO shop_settings (tenant_id, tablet_inactivity_hours) VALUES
  ('tt000000-0000-0000-0000-000000000001'::uuid, 4)
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO companies (id, tenant_id, name) VALUES
  ('tt004000-0000-0000-0000-000000000001'::uuid,
   'tt000000-0000-0000-0000-000000000001'::uuid, 'Trigger Test Co')
ON CONFLICT (id) DO NOTHING;

-- Job 1: main job for printed-field + loop-guard tests; starts packet_dirty=false
INSERT INTO jobs (id, tenant_id, company_id, job_name, packet_token, job_number,
                  intake_status, packet_dirty) VALUES
  ('tt006000-0000-0000-0000-000000000001'::uuid,
   'tt000000-0000-0000-0000-000000000001'::uuid,
   'tt004000-0000-0000-0000-000000000001'::uuid,
   'Original Job Name', 'tttrig001tok', 'TT-2026-00001',
   'draft', false)
ON CONFLICT (id) DO NOTHING;

-- Job 2: for non-printed-field and production_status tests; starts packet_dirty=false
INSERT INTO jobs (id, tenant_id, company_id, job_name, packet_token, job_number,
                  intake_status, packet_dirty) VALUES
  ('tt006000-0000-0000-0000-000000000002'::uuid,
   'tt000000-0000-0000-0000-000000000001'::uuid,
   'tt004000-0000-0000-0000-000000000001'::uuid,
   'Non-Printed Job', 'tttrig002tok', 'TT-2026-00002',
   'draft', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Tests 1-7: Printed field changes set packet_dirty=true
-- Run sequentially on Job 1. Once packet_dirty=true it stays true; each UPDATE
-- verifies the trigger fires on that specific column change.
-- Reset packet_dirty=false between tests via loop-guard path (no assertions).
-- ============================================================

-- ─── Test 1: job_name ──────────────────────────────────────
UPDATE jobs SET job_name = 'New Job Name' WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid;
SELECT is(
  (SELECT packet_dirty FROM jobs WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid),
  true,
  'trigger: updating job_name sets packet_dirty=true'
);
-- Reset via loop guard (only packet_dirty changes → trigger passes through)
UPDATE jobs SET packet_dirty = false WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid;

-- ─── Test 2: color ────────────────────────────────────────
UPDATE jobs SET color = 'Powder Blue' WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid;
SELECT is(
  (SELECT packet_dirty FROM jobs WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid),
  true,
  'trigger: updating color sets packet_dirty=true'
);
UPDATE jobs SET packet_dirty = false WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid;

-- ─── Test 3: coating_type ────────────────────────────────
UPDATE jobs SET coating_type = 'epoxy' WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid;
SELECT is(
  (SELECT packet_dirty FROM jobs WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid),
  true,
  'trigger: updating coating_type sets packet_dirty=true'
);
UPDATE jobs SET packet_dirty = false WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid;

-- ─── Test 4: part_count ──────────────────────────────────
UPDATE jobs SET part_count = 42 WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid;
SELECT is(
  (SELECT packet_dirty FROM jobs WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid),
  true,
  'trigger: updating part_count sets packet_dirty=true'
);
UPDATE jobs SET packet_dirty = false WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid;

-- ─── Test 5: due_date ────────────────────────────────────
UPDATE jobs SET due_date = '2026-12-31' WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid;
SELECT is(
  (SELECT packet_dirty FROM jobs WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid),
  true,
  'trigger: updating due_date sets packet_dirty=true'
);
UPDATE jobs SET packet_dirty = false WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid;

-- ─── Test 6: priority ────────────────────────────────────
UPDATE jobs SET priority = 'rush' WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid;
SELECT is(
  (SELECT packet_dirty FROM jobs WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid),
  true,
  'trigger: updating priority sets packet_dirty=true'
);
UPDATE jobs SET packet_dirty = false WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid;

-- ─── Test 7: job_number ──────────────────────────────────
UPDATE jobs SET job_number = 'TT-2026-00001-R'
  WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid;
SELECT is(
  (SELECT packet_dirty FROM jobs WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid),
  true,
  'trigger: updating job_number sets packet_dirty=true'
);

-- ============================================================
-- Test 8: Loop guard — flipping packet_dirty back to false
-- At this point Job 1 has packet_dirty=true from Test 7.
-- An UPDATE that changes ONLY packet_dirty must pass through
-- unchanged (the packets module clears the flag this way).
-- ============================================================
UPDATE jobs SET packet_dirty = false WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid;
SELECT is(
  (SELECT packet_dirty FROM jobs WHERE id = 'tt006000-0000-0000-0000-000000000001'::uuid),
  false,
  'trigger: loop guard — only packet_dirty change passes through (stays false)'
);

-- ============================================================
-- Test 9: Non-printed field update (notes) does NOT set packet_dirty
-- Job 2 starts with packet_dirty=false; updating notes alone should not dirty it.
-- ============================================================
UPDATE jobs SET notes = 'some notes' WHERE id = 'tt006000-0000-0000-0000-000000000002'::uuid;
SELECT is(
  (SELECT packet_dirty FROM jobs WHERE id = 'tt006000-0000-0000-0000-000000000002'::uuid),
  false,
  'trigger: updating notes (non-printed field) does NOT set packet_dirty'
);

-- ============================================================
-- Test 10: production_status update does NOT set packet_dirty
-- The status-transition columns (production_status, intake_status, picked_up_at)
-- are intentionally excluded from the printed-fields list.
-- ============================================================
UPDATE jobs SET production_status = 'received', intake_status = 'in_production'
  WHERE id = 'tt006000-0000-0000-0000-000000000002'::uuid;
SELECT is(
  (SELECT packet_dirty FROM jobs WHERE id = 'tt006000-0000-0000-0000-000000000002'::uuid),
  false,
  'trigger: production_status/intake_status update does NOT set packet_dirty'
);

SELECT * FROM finish();
ROLLBACK;
