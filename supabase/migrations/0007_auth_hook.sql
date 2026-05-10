-- 0007_auth_hook.sql
-- Source: docs/DESIGN.md §5.2; .planning/phases/01-foundation/01-RESEARCH.md lines 711–798
--
-- HIDDEN INVARIANT (CLAUDE.md + RESEARCH.md Pitfall 1):
-- This function MUST be STABLE. Any INSERT/UPDATE/DELETE inside the function body
-- will deadlock on auth.users (Supabase Issue #29073). The function only reads
-- from staff, workstations, customer_users to stamp JWT app_metadata claims.
-- User-row linking happens in a SEPARATE AFTER INSERT trigger (migration 0010).
--
-- HIDDEN INVARIANT (CLAUDE.md + RESEARCH.md Pitfall 4):
-- supabase_auth_admin role MUST keep BYPASSRLS. The hook executes as this role
-- and reads from staff, customer_users, workstations (all RLS-enabled). Without
-- BYPASSRLS, the hook gets zero rows and every sign-in returns 403.
-- This migration GRANTS SELECT but NEVER ALTERs the role's attributes.
--
-- Hook registration:
--   Local dev: registered via supabase/config.toml [auth.hook.custom_access_token] (below)
--   Production: registered in Supabase Dashboard → Authentication → Hooks (Plan 06 checkpoint)
--
-- JWT app_metadata shape (DESIGN.md §5.1):
--   { tenant_id, audience, role, staff_id? | workstation_id? | (company_id + customer_user_id)? }
-- Hook lookup order: staff → workstation → customer_users (prefer linked rows via auth_user_id)

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

-- Grants: hook executes as supabase_auth_admin (which has BYPASSRLS by Supabase default).
-- GRANT SELECT explicitly so the function can read from public.* tables in its body.
-- NEVER modify the supabase_auth_admin role attributes — that would risk removing BYPASSRLS (Pitfall 4).
GRANT EXECUTE ON FUNCTION app.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION app.custom_access_token_hook FROM authenticated, anon, public;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON staff, customer_users, workstations TO supabase_auth_admin;
