-- 0027_drop_legacy_auth_user_created_trigger.sql
-- Remove legacy auth.users linking trigger left behind by 0010.
-- 0013 replaced it with link_auth_user_to_actor_trigger, but dropped the newer
-- trigger name instead of the old on_auth_user_created trigger.
-- Keep the trigger function; only remove the duplicate trigger.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

NOTIFY pgrst, 'reload schema';
