-- 0019_pgtap_test_schema_usage.sql
-- Ensure linked/branch pgTAP runs can resolve pgTAP functions from the
-- extensions schema. Supabase installs pgTAP there, while CLI test sessions do
-- not always inherit extensions schema USAGE.

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

GRANT USAGE ON SCHEMA extensions TO PUBLIC;

