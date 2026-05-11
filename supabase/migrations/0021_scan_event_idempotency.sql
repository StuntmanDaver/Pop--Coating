-- 0021_scan_event_idempotency.sql
-- Phase 3: make offline scan replay idempotent.
--
-- Every client-originated scan may provide a UUID client_event_id. Replays with
-- the same tenant_id + client_event_id return the original history row id and do
-- not insert a duplicate event or advance production_status again.

ALTER TABLE job_status_history
  ADD COLUMN IF NOT EXISTS client_event_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS job_status_history_tenant_client_event_uidx
  ON job_status_history (tenant_id, client_event_id)
  WHERE client_event_id IS NOT NULL;
DROP FUNCTION IF EXISTS app.record_scan_event(UUID, TEXT, UUID, UUID, TEXT, UUID);
CREATE OR REPLACE FUNCTION app.record_scan_event(
  p_job_id UUID,
  p_to_status TEXT,
  p_employee_id UUID,
  p_workstation_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_attachment_id UUID DEFAULT NULL,
  p_client_event_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_event_id UUID;
  v_from TEXT;
  v_tenant_id UUID;
  v_caller_tenant UUID := app.tenant_id();
  v_caller_audience TEXT := app.audience();
  v_caller_workstation UUID := app.workstation_id();
  v_emp_tenant UUID;
  v_ws record;
BEGIN
  IF v_caller_tenant IS NULL THEN
    RAISE EXCEPTION 'tenant_id_missing: caller must have valid JWT';
  END IF;

  IF v_caller_audience IS DISTINCT FROM 'staff_shop' THEN
    RAISE EXCEPTION 'access_denied: scan requires shop workstation session';
  END IF;

  IF v_caller_workstation IS NULL
     OR p_workstation_id IS DISTINCT FROM v_caller_workstation THEN
    RAISE EXCEPTION 'access_denied: workstation attribution mismatch';
  END IF;

  IF p_client_event_id IS NOT NULL THEN
    SELECT id INTO v_event_id
      FROM job_status_history
      WHERE tenant_id = v_caller_tenant
        AND client_event_id = p_client_event_id
      LIMIT 1;

    IF v_event_id IS NOT NULL THEN
      RETURN v_event_id;
    END IF;
  END IF;

  IF p_to_status NOT IN ('received', 'prep', 'coating', 'curing', 'qc', 'completed', 'picked_up') THEN
    RAISE EXCEPTION 'invalid_to_status: %', p_to_status;
  END IF;

  SELECT tenant_id, production_status
    INTO v_tenant_id, v_from
    FROM jobs
    WHERE id = p_job_id
    FOR UPDATE;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'job_not_found';
  END IF;

  IF v_tenant_id IS DISTINCT FROM v_caller_tenant THEN
    RAISE EXCEPTION 'access_denied: cross-tenant scan blocked';
  END IF;

  SELECT tenant_id INTO v_emp_tenant
    FROM shop_employees
    WHERE id = p_employee_id;

  SELECT tenant_id, current_employee_id
    INTO v_ws
    FROM workstations
    WHERE id = p_workstation_id;

  IF v_emp_tenant IS NULL THEN
    RAISE EXCEPTION 'employee_not_found';
  END IF;

  IF v_ws.tenant_id IS NULL THEN
    RAISE EXCEPTION 'workstation_not_found';
  END IF;

  IF v_emp_tenant IS DISTINCT FROM v_caller_tenant
     OR v_ws.tenant_id IS DISTINCT FROM v_caller_tenant THEN
    RAISE EXCEPTION 'access_denied: cross-tenant employee/workstation';
  END IF;

  IF v_ws.current_employee_id IS DISTINCT FROM p_employee_id THEN
    RAISE EXCEPTION 'access_denied: employee not currently claimed on workstation';
  END IF;

  BEGIN
    INSERT INTO job_status_history
      (tenant_id, job_id, event_type, from_status, to_status,
       shop_employee_id, workstation_id, attachment_id, notes, client_event_id)
    VALUES
      (v_tenant_id, p_job_id, 'stage_change', v_from, p_to_status,
       p_employee_id, p_workstation_id, p_attachment_id, p_notes, p_client_event_id)
    RETURNING id INTO v_event_id;
  EXCEPTION WHEN unique_violation THEN
    IF p_client_event_id IS NOT NULL THEN
      SELECT id INTO v_event_id
        FROM job_status_history
        WHERE tenant_id = v_caller_tenant
          AND client_event_id = p_client_event_id
        LIMIT 1;

      IF v_event_id IS NOT NULL THEN
        RETURN v_event_id;
      END IF;
    END IF;
    RAISE;
  END;

  UPDATE jobs
    SET production_status = p_to_status,
        intake_status = CASE WHEN intake_status = 'scheduled' THEN 'in_production' ELSE intake_status END,
        picked_up_at = CASE WHEN p_to_status = 'picked_up' AND picked_up_at IS NULL THEN now() ELSE picked_up_at END
    WHERE id = p_job_id
      AND tenant_id = v_caller_tenant;

  RETURN v_event_id;
END;
$$;
GRANT EXECUTE ON FUNCTION app.record_scan_event(UUID, TEXT, UUID, UUID, TEXT, UUID, UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION app.record_scan_event(UUID, TEXT, UUID, UUID, TEXT, UUID, UUID) FROM anon, public;
