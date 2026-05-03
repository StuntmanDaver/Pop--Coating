-- 0013_link_auth_user_trigger_update_aware.sql
-- Fix: GoTrue Auth admin createUser INSERTs auth.users with empty raw_app_meta_data,
-- then UPDATEs raw_app_meta_data in a separate operation. The original AFTER INSERT
-- trigger (migration 0010) raised 'auth_user_created_without_tenant_id' on INSERT
-- before app_metadata could be populated, blocking the entire createUser flow.
--
-- This migration:
--   1. Updates the trigger function to silently skip on missing tenant_id (no exception)
--      — defers linking until raw_app_meta_data is populated
--   2. Replaces the AFTER INSERT trigger with AFTER INSERT OR UPDATE OF raw_app_meta_data
--      — so linking runs when GoTrue updates the metadata after creation
--   3. Adds an idempotency check: skip if auth_user_id is already set on the staff row
--      to prevent re-linking on subsequent metadata updates
--
-- Security: workstation bypass (audience=staff_shop) is preserved. Linking still
-- requires app_metadata.tenant_id to be present and matching email + tenant_id.

CREATE OR REPLACE FUNCTION app.link_auth_user_to_actor()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id UUID := NULLIF(NEW.raw_app_meta_data ->> 'tenant_id', '')::uuid;
  v_intended_actor TEXT := NEW.raw_app_meta_data ->> 'intended_actor';
BEGIN
  -- Workstation synthetic users have audience='staff_shop' in their metadata.
  -- createWorkstation server action sets workstations.auth_user_id directly — skip linking.
  IF NEW.raw_app_meta_data ->> 'audience' = 'staff_shop' THEN
    RETURN NEW;
  END IF;

  -- If tenant_id is missing, this fired before GoTrue populated app_metadata.
  -- Silently skip — the trigger will fire again on the subsequent UPDATE.
  IF v_tenant_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Link by intended_actor hint first; fall back to try-staff-then-customer.
  -- Idempotent: only updates rows where auth_user_id IS NULL, so re-firing is safe.
  IF v_intended_actor = 'staff' THEN
    UPDATE staff
      SET auth_user_id = NEW.id
      WHERE email = NEW.email AND tenant_id = v_tenant_id AND auth_user_id IS NULL;
  ELSIF v_intended_actor = 'customer' THEN
    UPDATE customer_users
      SET auth_user_id = NEW.id
      WHERE email = NEW.email AND tenant_id = v_tenant_id AND auth_user_id IS NULL;
  ELSE
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

-- Replace the trigger to fire on INSERT OR UPDATE OF raw_app_meta_data
DROP TRIGGER IF EXISTS link_auth_user_to_actor_trigger ON auth.users;

CREATE TRIGGER link_auth_user_to_actor_trigger
  AFTER INSERT OR UPDATE OF raw_app_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION app.link_auth_user_to_actor();
