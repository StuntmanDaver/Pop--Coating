-- 0023_auth_hook_app_schema_usage.sql
-- Allow Supabase Auth to resolve the custom access token hook in the app schema.
--
-- The hook itself already grants EXECUTE to supabase_auth_admin, but Postgres also
-- requires USAGE on the containing schema before a role can resolve a function by
-- schema-qualified name. Without this grant, the Supabase Dashboard hook picker may
-- not expose the app schema/function for registration.

GRANT USAGE ON SCHEMA app TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION app.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION app.custom_access_token_hook(jsonb) FROM authenticated, anon, public;
