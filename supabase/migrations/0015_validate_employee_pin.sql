-- 0015_validate_employee_pin.sql
-- Source: docs/DESIGN.md §4.3 Module 5 (Scanning) — Critical PIN function.
--
-- SECURITY DEFINER required: function does writes (UPDATE shop_employees) that
-- shop_staff RLS would block. Tenant validation happens via the p_tenant_id
-- parameter, which the calling Server Action MUST set from the authenticated
-- user's JWT (app.tenant_id()) — never from user input.
--
-- Lockout policy: 5 consecutive failed attempts → 15-minute lockout.
-- pgcrypto crypt() / bcrypt comparison; pin_hash is bcrypt-hashed at write time.
--
-- Returns jsonb so the wrapper can dispatch on .ok / .reason without parsing strings:
--   { ok: true,  employee_id }
--   { ok: false, reason: 'tenant_mismatch' }
--   { ok: false, reason: 'inactive' }
--   { ok: false, reason: 'locked', until: <ts> }
--   { ok: false, reason: 'invalid_pin', attempts_remaining: <0..4> }

CREATE OR REPLACE FUNCTION app.validate_employee_pin(
  p_tenant_id UUID,
  p_employee_id UUID,
  p_pin TEXT
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_emp record;
  v_now TIMESTAMPTZ := now();
BEGIN
  SELECT id, pin_hash, failed_pin_attempts, locked_until, is_active, tenant_id
    INTO v_emp
    FROM shop_employees
    WHERE id = p_employee_id
    FOR UPDATE;

  IF v_emp.id IS NULL THEN
    -- Anti-enumeration: same shape as tenant_mismatch so callers can't
    -- distinguish "no such employee" from "wrong tenant".
    RETURN jsonb_build_object('ok', false, 'reason', 'tenant_mismatch');
  END IF;

  IF v_emp.tenant_id != p_tenant_id THEN
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
  ELSE
    UPDATE shop_employees
      SET failed_pin_attempts = v_emp.failed_pin_attempts + 1,
          locked_until = CASE
            WHEN v_emp.failed_pin_attempts + 1 >= 5
              THEN v_now + interval '15 minutes'
            ELSE locked_until
          END
      WHERE id = p_employee_id;
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'invalid_pin',
      'attempts_remaining', GREATEST(0, 4 - v_emp.failed_pin_attempts)
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION app.validate_employee_pin(UUID, UUID, TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION app.validate_employee_pin(UUID, UUID, TEXT) FROM anon, public;
