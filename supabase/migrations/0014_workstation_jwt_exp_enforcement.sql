-- 0014_workstation_jwt_exp_enforcement.sql
-- Enforce a hard 1-hour JWT exp for workstation tokens in the custom_access_token_hook.
--
-- WHY: DESIGN.md §1365 — "Workstation: 1-hour refresh (short window so a stolen tablet
-- stops working quickly after device_token rotation)". The global jwt_expiry = 3600
-- already achieves this, but explicitly setting exp = iat + 3600 inside the hook makes
-- the constraint immune to accidental global config changes and documents intent clearly.
--
-- MECHANISM: The device_token IS the Supabase user password. When a tablet is reported
-- stolen, regenerateDeviceToken() (Phase 3) rotates the password, which Supabase uses
-- to invalidate all existing refresh tokens for that synthetic user. Combined with the
-- 1-hour access token cap set here, the stolen session dies within 1 hour of rotation.
--
-- STABLE invariant preserved: exp is computed from iat (already in the claims event) —
-- no DB reads or writes. DESIGN.md §5.2 / CLAUDE.md hidden invariant still holds.

CREATE OR REPLACE FUNCTION app.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_user_id UUID := (event ->> 'user_id')::uuid;
  v_email TEXT;
  v_claims jsonb := event -> 'claims';
  v_app_meta jsonb;
  v_staff record; v_customer record; v_workstation record;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  -- 1. Look up staff: prefer rows linked by auth_user_id; fall back to email match
  SELECT id, tenant_id, role, is_active INTO v_staff
    FROM staff
    WHERE auth_user_id = v_user_id
       OR (auth_user_id IS NULL AND email = v_email)
    ORDER BY (auth_user_id IS NOT NULL) DESC, created_at ASC
    LIMIT 1;

  IF v_staff.id IS NOT NULL THEN
    IF NOT v_staff.is_active THEN
      RETURN jsonb_build_object('error',
        jsonb_build_object('http_code', 403, 'message', 'Account inactive'));
    END IF;
    v_app_meta := jsonb_build_object(
      'tenant_id', v_staff.tenant_id,
      'audience', CASE WHEN v_staff.role = 'shop' THEN 'staff_shop' ELSE 'staff_office' END,
      'role', v_staff.role,
      'staff_id', v_staff.id
    );
    v_claims := jsonb_set(v_claims, '{app_metadata}',
                          COALESCE(v_claims -> 'app_metadata', '{}'::jsonb) || v_app_meta);
    RETURN jsonb_build_object('claims', v_claims);
  END IF;

  -- 2. Look up workstation (synthetic user; linked by auth_user_id only)
  SELECT id, tenant_id INTO v_workstation
    FROM workstations
    WHERE auth_user_id = v_user_id AND is_active = true
    LIMIT 1;

  IF v_workstation.id IS NOT NULL THEN
    v_app_meta := jsonb_build_object(
      'tenant_id', v_workstation.tenant_id,
      'audience', 'staff_shop',
      'role', 'shop',
      'workstation_id', v_workstation.id
    );
    v_claims := jsonb_set(v_claims, '{app_metadata}',
                          COALESCE(v_claims -> 'app_metadata', '{}'::jsonb) || v_app_meta);
    -- Hard cap workstation access token at 1 hour from iat (DESIGN.md §1365).
    -- Stolen-tablet mitigation: after device_token rotation the refresh token is
    -- invalidated; this cap ensures the access token also cannot outlive 1 hour.
    v_claims := jsonb_set(v_claims, '{exp}',
                          to_jsonb((v_claims ->> 'iat')::bigint + 3600));
    RETURN jsonb_build_object('claims', v_claims);
  END IF;

  -- 3. Look up customer_users: prefer linked rows
  SELECT id, tenant_id, company_id, is_active INTO v_customer
    FROM customer_users
    WHERE auth_user_id = v_user_id
       OR (auth_user_id IS NULL AND email = v_email)
    ORDER BY (auth_user_id IS NOT NULL) DESC, created_at ASC
    LIMIT 1;

  IF v_customer.id IS NOT NULL THEN
    IF NOT v_customer.is_active THEN
      RETURN jsonb_build_object('error',
        jsonb_build_object('http_code', 403, 'message', 'Account inactive'));
    END IF;
    v_app_meta := jsonb_build_object(
      'tenant_id', v_customer.tenant_id,
      'audience', 'customer',
      'company_id', v_customer.company_id,
      'customer_user_id', v_customer.id
    );
    v_claims := jsonb_set(v_claims, '{app_metadata}',
                          COALESCE(v_claims -> 'app_metadata', '{}'::jsonb) || v_app_meta);
    RETURN jsonb_build_object('claims', v_claims);
  END IF;

  -- 4. No matching actor found
  RETURN jsonb_build_object('error',
    jsonb_build_object('http_code', 403, 'message', 'Account not provisioned'));
END;
$$;

-- Grants unchanged from 0007 — re-applied to ensure they hold after CREATE OR REPLACE.
GRANT EXECUTE ON FUNCTION app.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION app.custom_access_token_hook FROM authenticated, anon, public;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON staff, customer_users, workstations TO supabase_auth_admin;
