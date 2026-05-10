-- 0020_security_definer_fail_closed.sql
-- Module: scanning/settings security hardening.
-- Why now: first SQL security hardening slice. SECURITY DEFINER functions bypass
-- RLS by design, so tenant claims must fail closed before any row mutation.
--
-- This migration:
--   1. Replaces workstation lifecycle SECURITY DEFINER functions with explicit
--      tenant_id_missing checks and null-safe tenant/workstation comparisons.
--   2. Replaces app.record_scan_event with the same fail-closed tenant checks.
--   3. Recreates workstations UPDATE RLS as office-only. Shop workstation writes
--      must go through app.claim_workstation(), app.record_workstation_heartbeat(),
--      and app.release_workstation().
--
-- Down migration:
-- /*
-- DROP POLICY IF EXISTS workstations_office_update ON workstations;
-- DROP POLICY IF EXISTS workstations_shop_update ON workstations;
-- CREATE POLICY workstations_office_update ON workstations FOR UPDATE
--   USING (tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'))
--   WITH CHECK (tenant_id = app.tenant_id());
--
-- CREATE OR REPLACE FUNCTION app.claim_workstation(
--   p_workstation_id UUID, p_employee_id UUID, p_expected_version INT
-- ) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $down$
-- DECLARE
--   v_caller_tenant UUID := app.tenant_id();
--   v_caller_workstation UUID := app.workstation_id();
--   v_emp_tenant UUID; v_ws_tenant UUID; v_new_version INT;
-- BEGIN
--   IF app.audience() != 'staff_shop' THEN
--     RAISE EXCEPTION 'access_denied: claim requires shop session';
--   END IF;
--   IF v_caller_workstation != p_workstation_id THEN
--     RAISE EXCEPTION 'access_denied: can only claim own workstation';
--   END IF;
--   SELECT tenant_id INTO v_ws_tenant FROM workstations WHERE id = p_workstation_id;
--   SELECT tenant_id INTO v_emp_tenant FROM shop_employees WHERE id = p_employee_id;
--   IF v_ws_tenant IS NULL OR v_emp_tenant IS NULL
--      OR v_ws_tenant != v_caller_tenant OR v_emp_tenant != v_caller_tenant THEN
--     RAISE EXCEPTION 'access_denied: cross-tenant or missing entity';
--   END IF;
--   UPDATE workstations
--     SET current_employee_id = p_employee_id,
--         current_employee_id_set_at = now(),
--         last_activity_at = now(),
--         version = version + 1
--     WHERE id = p_workstation_id
--       AND version = p_expected_version
--       AND (current_employee_id IS NULL
--            OR last_activity_at < now() - make_interval(hours => (
--              SELECT tablet_inactivity_hours FROM shop_settings WHERE tenant_id = v_caller_tenant
--            )))
--     RETURNING version INTO v_new_version;
--   IF v_new_version IS NULL THEN
--     RETURN jsonb_build_object('ok', false, 'reason', 'workstation_in_use_or_stale_version');
--   END IF;
--   RETURN jsonb_build_object('ok', true, 'version', v_new_version);
-- END;
-- $down$;
--
-- CREATE OR REPLACE FUNCTION app.record_workstation_heartbeat() RETURNS void
-- LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $down$
-- DECLARE v_ws_id UUID := app.workstation_id();
-- BEGIN
--   IF app.audience() != 'staff_shop' OR v_ws_id IS NULL THEN
--     RAISE EXCEPTION 'access_denied: heartbeat requires shop session';
--   END IF;
--   UPDATE workstations SET last_activity_at = now() WHERE id = v_ws_id;
-- END;
-- $down$;
--
-- CREATE OR REPLACE FUNCTION app.release_workstation() RETURNS void
-- LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $down$
-- DECLARE v_ws_id UUID := app.workstation_id();
-- BEGIN
--   IF app.audience() != 'staff_shop' OR v_ws_id IS NULL THEN
--     RAISE EXCEPTION 'access_denied: release requires shop session';
--   END IF;
--   UPDATE workstations
--     SET current_employee_id = NULL,
--         current_employee_id_set_at = NULL,
--         version = version + 1
--     WHERE id = v_ws_id;
-- END;
-- $down$;
--
-- CREATE OR REPLACE FUNCTION app.record_scan_event(
--   p_job_id UUID,
--   p_to_status TEXT,
--   p_employee_id UUID,
--   p_workstation_id UUID,
--   p_notes TEXT DEFAULT NULL,
--   p_attachment_id UUID DEFAULT NULL
-- ) RETURNS UUID
-- LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $down$
-- DECLARE
--   v_event_id UUID;
--   v_from TEXT;
--   v_tenant_id UUID;
--   v_caller_tenant UUID := app.tenant_id();
--   v_caller_audience TEXT := app.audience();
--   v_caller_workstation UUID := app.workstation_id();
--   v_emp_tenant UUID;
--   v_ws record;
-- BEGIN
--   IF v_caller_audience IS DISTINCT FROM 'staff_shop' THEN
--     RAISE EXCEPTION 'access_denied: scan requires shop workstation session';
--   END IF;
--   IF v_caller_workstation IS NULL OR p_workstation_id != v_caller_workstation THEN
--     RAISE EXCEPTION 'access_denied: workstation attribution mismatch';
--   END IF;
--   IF p_to_status NOT IN ('received', 'prep', 'coating', 'curing', 'qc', 'completed', 'picked_up') THEN
--     RAISE EXCEPTION 'invalid_to_status: %', p_to_status;
--   END IF;
--   SELECT tenant_id, production_status
--     INTO v_tenant_id, v_from
--     FROM jobs
--     WHERE id = p_job_id
--     FOR UPDATE;
--   IF v_tenant_id IS NULL THEN
--     RAISE EXCEPTION 'job_not_found';
--   END IF;
--   IF v_tenant_id != v_caller_tenant THEN
--     RAISE EXCEPTION 'access_denied: cross-tenant scan blocked';
--   END IF;
--   SELECT tenant_id INTO v_emp_tenant FROM shop_employees WHERE id = p_employee_id;
--   SELECT tenant_id, current_employee_id
--     INTO v_ws
--     FROM workstations
--     WHERE id = p_workstation_id;
--   IF v_emp_tenant IS NULL THEN RAISE EXCEPTION 'employee_not_found'; END IF;
--   IF v_ws.tenant_id IS NULL THEN RAISE EXCEPTION 'workstation_not_found'; END IF;
--   IF v_emp_tenant != v_caller_tenant OR v_ws.tenant_id != v_caller_tenant THEN
--     RAISE EXCEPTION 'access_denied: cross-tenant employee/workstation';
--   END IF;
--   IF v_ws.current_employee_id IS NULL OR v_ws.current_employee_id != p_employee_id THEN
--     RAISE EXCEPTION 'access_denied: employee not currently claimed on workstation';
--   END IF;
--   INSERT INTO job_status_history
--     (tenant_id, job_id, event_type, from_status, to_status,
--      shop_employee_id, workstation_id, attachment_id, notes)
--   VALUES
--     (v_tenant_id, p_job_id, 'stage_change', v_from, p_to_status,
--      p_employee_id, p_workstation_id, p_attachment_id, p_notes)
--   RETURNING id INTO v_event_id;
--   UPDATE jobs
--     SET production_status = p_to_status,
--         intake_status = CASE WHEN intake_status = 'scheduled' THEN 'in_production' ELSE intake_status END,
--         picked_up_at = CASE WHEN p_to_status = 'picked_up' AND picked_up_at IS NULL THEN now() ELSE picked_up_at END
--     WHERE id = p_job_id;
--   RETURN v_event_id;
-- END;
-- $down$;
-- */

CREATE OR REPLACE FUNCTION app.claim_workstation(
  p_workstation_id UUID,
  p_employee_id UUID,
  p_expected_version INT
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_caller_tenant UUID := app.tenant_id();
  v_caller_audience TEXT := app.audience();
  v_caller_workstation UUID := app.workstation_id();
  v_emp_tenant UUID;
  v_ws_tenant UUID;
  v_new_version INT;
BEGIN
  IF v_caller_tenant IS NULL THEN
    RAISE EXCEPTION 'tenant_id_missing: caller must have valid JWT';
  END IF;

  IF v_caller_audience IS DISTINCT FROM 'staff_shop' THEN
    RAISE EXCEPTION 'access_denied: claim requires shop session';
  END IF;

  IF v_caller_workstation IS NULL
     OR v_caller_workstation IS DISTINCT FROM p_workstation_id THEN
    RAISE EXCEPTION 'access_denied: can only claim own workstation';
  END IF;

  SELECT tenant_id INTO v_ws_tenant
    FROM workstations
    WHERE id = p_workstation_id;

  SELECT tenant_id INTO v_emp_tenant
    FROM shop_employees
    WHERE id = p_employee_id;

  IF v_ws_tenant IS DISTINCT FROM v_caller_tenant
     OR v_emp_tenant IS DISTINCT FROM v_caller_tenant THEN
    RAISE EXCEPTION 'access_denied: cross-tenant or missing entity';
  END IF;

  UPDATE workstations
    SET current_employee_id = p_employee_id,
        current_employee_id_set_at = now(),
        last_activity_at = now(),
        version = version + 1
    WHERE id = p_workstation_id
      AND tenant_id = v_caller_tenant
      AND version = p_expected_version
      AND (current_employee_id IS NULL
           OR last_activity_at < now() - make_interval(hours => (
             SELECT tablet_inactivity_hours FROM shop_settings WHERE tenant_id = v_caller_tenant
           )))
    RETURNING version INTO v_new_version;

  IF v_new_version IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'workstation_in_use_or_stale_version');
  END IF;

  RETURN jsonb_build_object('ok', true, 'version', v_new_version);
END;
$$;

CREATE OR REPLACE FUNCTION app.record_workstation_heartbeat() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_caller_tenant UUID := app.tenant_id();
  v_caller_audience TEXT := app.audience();
  v_ws_id UUID := app.workstation_id();
  v_ws_tenant UUID;
BEGIN
  IF v_caller_tenant IS NULL THEN
    RAISE EXCEPTION 'tenant_id_missing: caller must have valid JWT';
  END IF;

  IF v_caller_audience IS DISTINCT FROM 'staff_shop' OR v_ws_id IS NULL THEN
    RAISE EXCEPTION 'access_denied: heartbeat requires shop session';
  END IF;

  SELECT tenant_id INTO v_ws_tenant
    FROM workstations
    WHERE id = v_ws_id;

  IF v_ws_tenant IS DISTINCT FROM v_caller_tenant THEN
    RAISE EXCEPTION 'access_denied: workstation tenant mismatch';
  END IF;

  UPDATE workstations
    SET last_activity_at = now()
    WHERE id = v_ws_id
      AND tenant_id = v_caller_tenant;
END;
$$;

CREATE OR REPLACE FUNCTION app.release_workstation() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_caller_tenant UUID := app.tenant_id();
  v_caller_audience TEXT := app.audience();
  v_ws_id UUID := app.workstation_id();
  v_ws_tenant UUID;
BEGIN
  IF v_caller_tenant IS NULL THEN
    RAISE EXCEPTION 'tenant_id_missing: caller must have valid JWT';
  END IF;

  IF v_caller_audience IS DISTINCT FROM 'staff_shop' OR v_ws_id IS NULL THEN
    RAISE EXCEPTION 'access_denied: release requires shop session';
  END IF;

  SELECT tenant_id INTO v_ws_tenant
    FROM workstations
    WHERE id = v_ws_id;

  IF v_ws_tenant IS DISTINCT FROM v_caller_tenant THEN
    RAISE EXCEPTION 'access_denied: workstation tenant mismatch';
  END IF;

  UPDATE workstations
    SET current_employee_id = NULL,
        current_employee_id_set_at = NULL,
        version = version + 1
    WHERE id = v_ws_id
      AND tenant_id = v_caller_tenant;
END;
$$;

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
    WHERE id = p_job_id
      AND tenant_id = v_caller_tenant;

  RETURN v_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION app.claim_workstation(UUID, UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION app.record_workstation_heartbeat() TO authenticated;
GRANT EXECUTE ON FUNCTION app.release_workstation() TO authenticated;
GRANT EXECUTE ON FUNCTION app.record_scan_event(UUID, TEXT, UUID, UUID, TEXT, UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION app.claim_workstation(UUID, UUID, INT) FROM anon, public;
REVOKE EXECUTE ON FUNCTION app.record_workstation_heartbeat() FROM anon, public;
REVOKE EXECUTE ON FUNCTION app.release_workstation() FROM anon, public;
REVOKE EXECUTE ON FUNCTION app.record_scan_event(UUID, TEXT, UUID, UUID, TEXT, UUID) FROM anon, public;

DROP POLICY IF EXISTS workstations_office_update ON workstations;
DROP POLICY IF EXISTS workstations_shop_update ON workstations;

CREATE POLICY workstations_office_update ON workstations FOR UPDATE
  USING (tenant_id = app.tenant_id() AND app.audience() = 'staff_office')
  WITH CHECK (tenant_id = app.tenant_id());
