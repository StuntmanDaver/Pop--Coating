-- 0024_public_auth_hook_wrapper.sql
-- Dashboard registration shim for the Custom Access Token hook.
--
-- Canonical hook logic remains in app.custom_access_token_hook(event jsonb).
-- Supabase Dashboard currently does not expose the app schema in the hook picker
-- for this project, so this public wrapper delegates without adding any logic.

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, app, pg_temp
AS $$
  SELECT app.custom_access_token_hook(event);
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated, anon, public;
