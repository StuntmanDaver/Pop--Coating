-- 0011_jobs_column_revoke_fix.sql
-- Migration 0008 used column-level REVOKE UPDATE (production_status) FROM authenticated,
-- but Postgres has_column_privilege() returns true when a table-level UPDATE grant exists.
-- Fix: REVOKE table-level UPDATE, then GRANT UPDATE on all columns except production_status.
-- This makes column-level restriction effective and has_column_privilege() correct.

REVOKE UPDATE ON jobs FROM authenticated;

GRANT UPDATE (
  tenant_id, parent_job_id, job_number, packet_token, customer_po_number,
  company_id, contact_id, job_name, description, part_count,
  parts_received_count, parts_completed_count, parts_damaged_count,
  parts_rework_count, weight_lbs, dimensions_text, color, coating_type,
  due_date, priority, intake_status, on_hold, hold_reason, qc_passed,
  picked_up_at, quoted_price, packet_dirty, notes, archived_at,
  created_at, updated_at, created_by_staff_id
) ON jobs TO authenticated;
