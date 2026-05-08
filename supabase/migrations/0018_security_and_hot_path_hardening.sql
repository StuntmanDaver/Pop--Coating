-- 0018_security_and_hot_path_hardening.sql
-- Production-readiness hardening from security/performance audit.

-- PIN validation must derive tenant from JWT, not caller input.
DROP FUNCTION IF EXISTS app.validate_employee_pin(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION app.validate_employee_pin(
  p_employee_id UUID,
  p_pin TEXT
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_emp record;
  v_now TIMESTAMPTZ := now();
  v_caller_tenant UUID := app.tenant_id();
  v_caller_audience TEXT := app.audience();
BEGIN
  IF v_caller_tenant IS NULL OR v_caller_audience != 'staff_shop' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'tenant_mismatch');
  END IF;

  SELECT id, pin_hash, failed_pin_attempts, locked_until, is_active, tenant_id
    INTO v_emp
    FROM shop_employees
    WHERE id = p_employee_id
    FOR UPDATE;

  IF v_emp.id IS NULL OR v_emp.tenant_id != v_caller_tenant THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'tenant_mismatch');
  END IF;

  IF NOT v_emp.is_active THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'inactive');
  END IF;

  IF v_emp.locked_until IS NOT NULL AND v_emp.locked_until > v_now THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'locked', 'until', v_emp.locked_until);
  END IF;

  IF crypt(p_pin, v_emp.pin_hash) = v_emp.pin_hash THEN
    UPDATE shop_employees
      SET failed_pin_attempts = 0,
          locked_until = NULL
      WHERE id = p_employee_id;
    RETURN jsonb_build_object('ok', true, 'employee_id', p_employee_id);
  END IF;

  UPDATE shop_employees
    SET failed_pin_attempts = v_emp.failed_pin_attempts + 1,
        locked_until = CASE
          WHEN v_emp.failed_pin_attempts + 1 >= 5 THEN v_now + interval '15 minutes'
          ELSE locked_until
        END
    WHERE id = p_employee_id;

  RETURN jsonb_build_object(
    'ok', false,
    'reason', 'invalid_pin',
    'attempts_remaining', GREATEST(0, 4 - v_emp.failed_pin_attempts)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION app.validate_employee_pin(UUID, TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION app.validate_employee_pin(UUID, TEXT) FROM anon, public;

-- Timeline rows must be created by app.record_scan_event(), not direct INSERTs.
DROP POLICY IF EXISTS job_status_history_shop_insert ON job_status_history;

-- Scan event attribution must match the caller workstation and currently claimed employee.
CREATE OR REPLACE FUNCTION app.record_scan_event(
  p_job_id UUID,
  p_to_status TEXT,
  p_employee_id UUID,
  p_workstation_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_attachment_id UUID DEFAULT NULL
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
  IF v_caller_audience IS DISTINCT FROM 'staff_shop' THEN
    RAISE EXCEPTION 'access_denied: scan requires shop workstation session';
  END IF;

  IF v_caller_workstation IS NULL OR p_workstation_id != v_caller_workstation THEN
    RAISE EXCEPTION 'access_denied: workstation attribution mismatch';
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

  IF v_tenant_id != v_caller_tenant THEN
    RAISE EXCEPTION 'access_denied: cross-tenant scan blocked';
  END IF;

  SELECT tenant_id INTO v_emp_tenant FROM shop_employees WHERE id = p_employee_id;
  SELECT tenant_id, current_employee_id
    INTO v_ws
    FROM workstations
    WHERE id = p_workstation_id;

  IF v_emp_tenant IS NULL THEN RAISE EXCEPTION 'employee_not_found'; END IF;
  IF v_ws.tenant_id IS NULL THEN RAISE EXCEPTION 'workstation_not_found'; END IF;

  IF v_emp_tenant != v_caller_tenant OR v_ws.tenant_id != v_caller_tenant THEN
    RAISE EXCEPTION 'access_denied: cross-tenant employee/workstation';
  END IF;

  IF v_ws.current_employee_id IS NULL OR v_ws.current_employee_id != p_employee_id THEN
    RAISE EXCEPTION 'access_denied: employee not currently claimed on workstation';
  END IF;

  INSERT INTO job_status_history
    (tenant_id, job_id, event_type, from_status, to_status,
     shop_employee_id, workstation_id, attachment_id, notes)
  VALUES
    (v_tenant_id, p_job_id, 'stage_change', v_from, p_to_status,
     p_employee_id, p_workstation_id, p_attachment_id, p_notes)
  RETURNING id INTO v_event_id;

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

-- Index trigger and dashboard/portal hot paths.
CREATE INDEX IF NOT EXISTS job_status_history_status_duration_idx
  ON job_status_history (tenant_id, job_id, to_status, scanned_at DESC);

CREATE INDEX IF NOT EXISTS jobs_active_due_date_idx
  ON jobs (tenant_id, due_date)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS jobs_active_hold_idx
  ON jobs (tenant_id, on_hold)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS jobs_active_intake_status_idx
  ON jobs (tenant_id, intake_status)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS jobs_active_created_at_idx
  ON jobs (tenant_id, created_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS jobs_portal_company_created_at_idx
  ON jobs (tenant_id, company_id, created_at DESC)
  WHERE archived_at IS NULL;

-- Lock first-job settings no matter which trusted path creates a job.
CREATE OR REPLACE FUNCTION app.mark_first_job_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  UPDATE shop_settings
    SET is_first_job_created = true
    WHERE tenant_id = NEW.tenant_id
      AND is_first_job_created = false;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mark_first_job_created ON jobs;
CREATE TRIGGER mark_first_job_created
  AFTER INSERT ON jobs
  FOR EACH ROW EXECUTE FUNCTION app.mark_first_job_created();
