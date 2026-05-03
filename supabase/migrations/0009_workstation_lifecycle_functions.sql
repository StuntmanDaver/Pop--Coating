-- 0009_workstation_lifecycle_functions.sql
-- Source: docs/DESIGN.md §3.2 (helper signatures) + Module 5 lines 1485–1556
--         .planning/phases/01-foundation/01-CONTEXT.md D-04
--
-- Three SECURITY DEFINER wrapper functions for workstation lifecycle management.
-- All three functions are SECURITY DEFINER so they can UPDATE workstations rows
-- that the calling shop session's RLS would otherwise block. Authorization is
-- enforced INTERNALLY in each function — the caller's app.workstation_id() JWT
-- claim must match the workstation being modified (prevents cross-workstation tampering).
--
-- Trust boundary (PLAN.md Threat Model T-01-03-04 / T-01-03-05):
--   - claim_workstation: validates caller workstation_id == p_workstation_id (T-01-03-04)
--   - All three: validate audience == 'staff_shop' (T-01-03-08)
--   - claim_workstation: validates ws + employee tenant == caller tenant (T-01-03-05)
--
-- search_path = public: prevents search_path injection via SECURITY DEFINER (residual risk noted
-- in threat model). All table references are unqualified and resolve to public.*.

-- ============================================================
-- 1. claim_workstation: assign an employee to this workstation for the shift
--    Optimistic concurrency via p_expected_version prevents double-claiming.
--    Callers pass current workstations.version; UPDATE fails silently if stale.
-- ============================================================
CREATE OR REPLACE FUNCTION app.claim_workstation(
  p_workstation_id UUID, p_employee_id UUID, p_expected_version INT
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_caller_tenant UUID := app.tenant_id();
  v_caller_workstation UUID := app.workstation_id();
  v_emp_tenant UUID; v_ws_tenant UUID; v_new_version INT;
BEGIN
  -- Audience gate: only shop sessions can claim a workstation
  IF app.audience() != 'staff_shop' THEN
    RAISE EXCEPTION 'access_denied: claim requires shop session';
  END IF;

  -- Workstation identity gate: can only claim the caller's own workstation (T-01-03-04)
  IF v_caller_workstation != p_workstation_id THEN
    RAISE EXCEPTION 'access_denied: can only claim own workstation';
  END IF;

  -- Tenant boundary gate: both the workstation and employee must belong to the caller's tenant (T-01-03-05)
  SELECT tenant_id INTO v_ws_tenant FROM workstations WHERE id = p_workstation_id;
  SELECT tenant_id INTO v_emp_tenant FROM shop_employees WHERE id = p_employee_id;
  IF v_ws_tenant IS NULL OR v_emp_tenant IS NULL
     OR v_ws_tenant != v_caller_tenant OR v_emp_tenant != v_caller_tenant THEN
    RAISE EXCEPTION 'access_denied: cross-tenant or missing entity';
  END IF;

  -- Optimistic concurrency: only claim if version matches AND workstation is unoccupied
  -- (or the previous occupant's session has been idle past tablet_inactivity_hours)
  UPDATE workstations
    SET current_employee_id = p_employee_id,
        current_employee_id_set_at = now(),
        last_activity_at = now(),
        version = version + 1
    WHERE id = p_workstation_id
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

-- ============================================================
-- 2. record_workstation_heartbeat: keep the workstation session alive
--    Called every 30s by the tablet to prevent idle auto-release.
--    No parameters — acts on the caller's own workstation from JWT claim.
-- ============================================================
CREATE OR REPLACE FUNCTION app.record_workstation_heartbeat() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ws_id UUID := app.workstation_id();
BEGIN
  IF app.audience() != 'staff_shop' OR v_ws_id IS NULL THEN
    RAISE EXCEPTION 'access_denied: heartbeat requires shop session';
  END IF;
  UPDATE workstations SET last_activity_at = now() WHERE id = v_ws_id;
END;
$$;

-- ============================================================
-- 3. release_workstation: explicit logout or auto-release at shift end
--    Clears current_employee_id on the caller's workstation.
--    No parameters — acts on the caller's own workstation from JWT claim.
-- ============================================================
CREATE OR REPLACE FUNCTION app.release_workstation() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ws_id UUID := app.workstation_id();
BEGIN
  IF app.audience() != 'staff_shop' OR v_ws_id IS NULL THEN
    RAISE EXCEPTION 'access_denied: release requires shop session';
  END IF;
  UPDATE workstations
    SET current_employee_id = NULL,
        current_employee_id_set_at = NULL,
        version = version + 1
    WHERE id = v_ws_id;
END;
$$;

-- Grant EXECUTE to authenticated only; deny anon/public
GRANT EXECUTE ON FUNCTION app.claim_workstation TO authenticated;
GRANT EXECUTE ON FUNCTION app.record_workstation_heartbeat TO authenticated;
GRANT EXECUTE ON FUNCTION app.release_workstation TO authenticated;
REVOKE EXECUTE ON FUNCTION app.claim_workstation FROM anon, public;
REVOKE EXECUTE ON FUNCTION app.record_workstation_heartbeat FROM anon, public;
REVOKE EXECUTE ON FUNCTION app.release_workstation FROM anon, public;
