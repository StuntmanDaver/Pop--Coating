-- 0025_refresh_auth_hook_wrapper_cache.sql
-- Keep the Dashboard-visible wrapper in Supabase's documented PL/pgSQL shape
-- and force PostgREST to reload its schema cache.

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
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
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated, anon, public;

NOTIFY pgrst, 'reload schema';
