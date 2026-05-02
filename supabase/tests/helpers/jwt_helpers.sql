-- supabase/tests/helpers/jwt_helpers.sql
-- Source: docs/DESIGN.md §9.2 (lines 2853–2904); 01-PLAN.md Task 1a interfaces
--
-- Helper functions to simulate JWT app_metadata claims in pgTAP tests.
-- All helpers use set_config('request.jwt.claims', ..., true) — the third param
-- `is_local = true` means the setting is transaction-scoped (auto-reset on ROLLBACK).
--
-- SECURITY DEFINER: helpers need to bypass RLS to look up the row and build the
-- correct claims. Without SECURITY DEFINER, calling these after SET ROLE authenticated
-- (while no JWT is set yet) would fail because RLS filters out all rows.
--
-- Usage: Safe to call either before or after SET ROLE authenticated.
-- The app.tenant_id(), app.audience(), etc. SECURITY DEFINER helpers
-- read from 'request.jwt.claims', so these helpers fully simulate what
-- the custom_access_token_hook stamps into real JWTs.
--
-- Functions provided:
--   set_jwt_for_staff(p_staff_id UUID)           — staff_office or staff_shop audience
--   set_jwt_for_customer(p_customer_user_id UUID) — customer audience
--   set_jwt_for_workstation(p_workstation_id UUID) — staff_shop audience (workstation)
--   set_jwt_anon()                                — empty claims (anonymous / no JWT)

CREATE OR REPLACE FUNCTION set_jwt_for_staff(p_staff_id UUID) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_staff record;
BEGIN
  SELECT id, tenant_id, role
    INTO v_staff
    FROM staff
    WHERE id = p_staff_id;

  IF v_staff.id IS NULL THEN
    RAISE EXCEPTION 'set_jwt_for_staff: staff row % not found', p_staff_id;
  END IF;

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', p_staff_id::text,
      'app_metadata', jsonb_build_object(
        'tenant_id', v_staff.tenant_id,
        'audience',  CASE WHEN v_staff.role = 'shop' THEN 'staff_shop' ELSE 'staff_office' END,
        'role',      v_staff.role,
        'staff_id',  v_staff.id
      )
    )::text,
    true  -- is_local: transaction-scoped, auto-cleared on ROLLBACK
  );
END;
$$;

CREATE OR REPLACE FUNCTION set_jwt_for_customer(p_customer_user_id UUID) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cu record;
BEGIN
  SELECT id, tenant_id, company_id
    INTO v_cu
    FROM customer_users
    WHERE id = p_customer_user_id;

  IF v_cu.id IS NULL THEN
    RAISE EXCEPTION 'set_jwt_for_customer: customer_user row % not found', p_customer_user_id;
  END IF;

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', p_customer_user_id::text,
      'app_metadata', jsonb_build_object(
        'tenant_id',        v_cu.tenant_id,
        'audience',         'customer',
        'company_id',       v_cu.company_id,
        'customer_user_id', v_cu.id
      )
    )::text,
    true
  );
END;
$$;

CREATE OR REPLACE FUNCTION set_jwt_for_workstation(p_workstation_id UUID) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ws record;
BEGIN
  SELECT id, tenant_id
    INTO v_ws
    FROM workstations
    WHERE id = p_workstation_id;

  IF v_ws.id IS NULL THEN
    RAISE EXCEPTION 'set_jwt_for_workstation: workstation row % not found', p_workstation_id;
  END IF;

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', p_workstation_id::text,
      'app_metadata', jsonb_build_object(
        'tenant_id',     v_ws.tenant_id,
        'audience',      'staff_shop',
        'role',          'shop',
        'workstation_id', v_ws.id
      )
    )::text,
    true
  );
END;
$$;

CREATE OR REPLACE FUNCTION set_jwt_anon() RETURNS void
LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims', '{}', true);
$$;
