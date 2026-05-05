-- 0016_record_scan_event.sql
-- Source: docs/DESIGN.md §4.3 Module 5 (Scanning) — record_scan_event function.
--
-- This is THE ONLY writer of jobs.production_status. Direct UPDATE is REVOKE'd
-- from authenticated by 0008/0011. Every status transition flows through this
-- SECURITY DEFINER function so each one creates an auditable job_status_history
-- row with employee + workstation attribution.
--
-- Tenant validation reads from JWT (app.tenant_id()) — does NOT accept tenant_id
-- as a parameter (anti-pattern; would allow privilege escalation by a caller
-- that lies about their tenant).
--
-- Side effects per call:
--   1. INSERT job_status_history (event_type='stage_change', from + to, attribution)
--      → triggers compute_status_event_metadata (duration + is_rework detection from 0005)
--   2. UPDATE jobs SET production_status = p_to_status
--   3. If intake_status was 'scheduled', promote to 'in_production' (one-way)
--   4. If p_to_status='picked_up' AND picked_up_at IS NULL, stamp picked_up_at = now()
--
-- Returns the new job_status_history.id (UUID) so the caller can correlate.
--
-- Errors raised:
--   access_denied: scan requires staff session
--   job_not_found
--   employee_not_found
--   workstation_not_found
--   access_denied: cross-tenant <entity>

CREATE OR REPLACE FUNCTION app.record_scan_event(
  p_job_id UUID,
  p_to_status TEXT,
  p_employee_id UUID,
  p_workstation_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_attachment_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_event_id UUID;
  v_from TEXT;
  v_tenant_id UUID;
  v_caller_tenant UUID := app.tenant_id();
  v_caller_audience TEXT := app.audience();
  v_emp_tenant UUID;
  v_ws_tenant UUID;
BEGIN
  IF v_caller_audience NOT IN ('staff_office', 'staff_shop') THEN
    RAISE EXCEPTION 'access_denied: scan requires staff session';
  END IF;

  -- Validate the to_status against the schema-defined production stages.
  IF p_to_status NOT IN ('received', 'prep', 'coating', 'curing', 'qc', 'completed', 'picked_up') THEN
    RAISE EXCEPTION 'invalid_to_status: %', p_to_status;
  END IF;

  -- Read the job + current status (FOR UPDATE prevents concurrent transitions stomping).
  SELECT tenant_id, production_status
    INTO v_tenant_id, v_from
    FROM jobs
    WHERE id = p_job_id
    FOR UPDATE;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'job_not_found';
  END IF;

  IF v_tenant_id != v_caller_tenant THEN
    RAISE EXCEPTION 'access_denied: cross-tenant scan blocked';
  END IF;

  SELECT tenant_id INTO v_emp_tenant FROM shop_employees WHERE id = p_employee_id;
  SELECT tenant_id INTO v_ws_tenant FROM workstations WHERE id = p_workstation_id;

  IF v_emp_tenant IS NULL THEN RAISE EXCEPTION 'employee_not_found'; END IF;
  IF v_ws_tenant IS NULL THEN RAISE EXCEPTION 'workstation_not_found'; END IF;

  IF v_emp_tenant != v_caller_tenant OR v_ws_tenant != v_caller_tenant THEN
    RAISE EXCEPTION 'access_denied: cross-tenant employee/workstation';
  END IF;

  INSERT INTO job_status_history
    (tenant_id, job_id, event_type, from_status, to_status,
     shop_employee_id, workstation_id, attachment_id, notes)
  VALUES
    (v_tenant_id, p_job_id, 'stage_change', v_from, p_to_status,
     p_employee_id, p_workstation_id, p_attachment_id, p_notes)
  RETURNING id INTO v_event_id;

  -- The status transition itself. intake_status promotes one-way scheduled→in_production
  -- on first scan. picked_up_at is stamped only on the to-completion side; later transitions
  -- away from picked_up don't clear it (history is preserved via job_status_history).
  UPDATE jobs
    SET production_status = p_to_status,
        intake_status = CASE WHEN intake_status = 'scheduled' THEN 'in_production' ELSE intake_status END,
        picked_up_at = CASE WHEN p_to_status = 'picked_up' AND picked_up_at IS NULL THEN now() ELSE picked_up_at END
    WHERE id = p_job_id;

  RETURN v_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION app.record_scan_event(UUID, TEXT, UUID, UUID, TEXT, UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION app.record_scan_event(UUID, TEXT, UUID, UUID, TEXT, UUID) FROM anon, public;
