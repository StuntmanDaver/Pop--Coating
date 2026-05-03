-- 0010_link_auth_user_trigger.sql
-- Source: docs/DESIGN.md §5.2 lines 1909–1949
--         .planning/phases/01-foundation/01-RESEARCH.md Pitfall 5
--
-- HIDDEN INVARIANT (CLAUDE.md + RESEARCH.md Pitfall 5):
-- This trigger fires AFTER INSERT on auth.users. It requires the new user's
-- raw_app_meta_data to contain { tenant_id, intended_actor: 'staff'|'customer' }
-- so the link is tenant-scoped (prevents multi-tenant email collision where
-- the same email exists in two tenants' staff/customer_users tables).
--
-- If tenant_id is missing and the user is NOT a workstation synthetic user
-- (workstation users set audience='staff_shop' in app_metadata), the trigger
-- raises 'auth_user_created_without_tenant_id' — fail loudly so callers
-- (scripts/seed-tenant.ts, inviteStaff server action) are forced to set
-- the required metadata at invite time (see Pitfall 5 in RESEARCH.md).
--
-- Workstation synthetic users (audience='staff_shop') SKIP this linking trigger.
-- The createWorkstation server action inserts the workstations row and sets
-- workstations.auth_user_id directly after creating the synthetic auth.users row.
--
-- Note: This function is SECURITY DEFINER (can UPDATE staff/customer_users bypassing RLS)
-- and SET search_path = public (prevents search_path injection).
-- It is intentionally write-capable (unlike the hook in 0007); trigger functions
-- do NOT run inside the auth.users lock that causes the hook deadlock.

CREATE OR REPLACE FUNCTION app.link_auth_user_to_actor()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id UUID := NULLIF(NEW.raw_app_meta_data ->> 'tenant_id', '')::uuid;
  v_intended_actor TEXT := NEW.raw_app_meta_data ->> 'intended_actor';
BEGIN
  IF v_tenant_id IS NULL THEN
    -- Workstation synthetic users have audience='staff_shop' in their metadata.
    -- createWorkstation server action sets workstations.auth_user_id directly — skip linking.
    IF NEW.raw_app_meta_data ->> 'audience' = 'staff_shop' THEN
      RETURN NEW;
    END IF;
    -- All other invite paths (staff, customer) MUST supply tenant_id — fail loudly.
    RAISE EXCEPTION 'auth_user_created_without_tenant_id: invite code path must populate app_metadata.tenant_id';
  END IF;

  -- Link by intended_actor hint first; fall back to try-staff-then-customer
  IF v_intended_actor = 'staff' THEN
    UPDATE staff
      SET auth_user_id = NEW.id
      WHERE email = NEW.email AND tenant_id = v_tenant_id AND auth_user_id IS NULL;
  ELSIF v_intended_actor = 'customer' THEN
    UPDATE customer_users
      SET auth_user_id = NEW.id
      WHERE email = NEW.email AND tenant_id = v_tenant_id AND auth_user_id IS NULL;
  ELSE
    -- No intended_actor hint: try staff first, then customer_users (both tenant-scoped)
    UPDATE staff SET auth_user_id = NEW.id
      WHERE email = NEW.email AND tenant_id = v_tenant_id AND auth_user_id IS NULL;
    IF NOT FOUND THEN
      UPDATE customer_users SET auth_user_id = NEW.id
        WHERE email = NEW.email AND tenant_id = v_tenant_id AND auth_user_id IS NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Install trigger: AFTER INSERT on auth.users
-- FOR EACH ROW: fires once per new user row
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION app.link_auth_user_to_actor();
