-- 0026_dashboard_auth_hook_wrapper.sql
-- Persist the Dashboard-created hook wrapper in migrations.
--
-- Supabase Dashboard would not list the canonical app schema hook for this
-- project, so production Auth Hooks registers this public wrapper. It delegates
-- to app.custom_access_token_hook(event jsonb), which remains the canonical
-- implementation and no-write invariant owner.

CREATE OR REPLACE FUNCTION public.dashboard_custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, app, pg_temp
AS $$
BEGIN
  RETURN app.custom_access_token_hook(event);
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT USAGE ON SCHEMA app TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.dashboard_custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.dashboard_custom_access_token_hook(jsonb) FROM authenticated, anon, public;

NOTIFY pgrst, 'reload schema';
