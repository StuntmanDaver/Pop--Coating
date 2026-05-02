-- 0001_app_schema_helpers.sql
-- Source: docs/DESIGN.md §3.2; 01-RESEARCH.md Code Examples lines 649–708
-- All helpers are STABLE (no writes) — read JWT claims via current_setting
--
-- CRITICAL INVARIANTS:
--   1. Every function except set_updated_at is declared STABLE (no side effects, no writes)
--   2. app.custom_access_token_hook (Plan 03) must also be STABLE — never write from the hook
--      (Supabase Issue #29073 deadlock: any write inside the hook deadlocks with auth.users lock)
--   3. Never inline JWT parsing in RLS policies — always call these helpers

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS app;

-- Returns the caller's tenant_id from JWT app_metadata.
-- STABLE: reads JWT claim, no writes. Used in every RLS policy.
CREATE OR REPLACE FUNCTION app.tenant_id() RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'tenant_id', ''
  )::uuid;
$$;

-- Returns the caller's audience: 'staff_office' | 'staff_shop' | 'customer'
-- STABLE: reads JWT claim, no writes. Used in every RLS policy.
CREATE OR REPLACE FUNCTION app.audience() RETURNS TEXT
LANGUAGE sql STABLE AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb
    -> 'app_metadata' ->> 'audience';
$$;

-- Returns the caller's role: 'admin' | 'manager' | 'office' | 'shop' (staff) | NULL (customer/anon)
-- STABLE: reads JWT claim, no writes.
CREATE OR REPLACE FUNCTION app.role() RETURNS TEXT
LANGUAGE sql STABLE AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb
    -> 'app_metadata' ->> 'role';
$$;

-- Returns the caller's staff_id (UUID) from JWT app_metadata. NULL for non-staff.
-- STABLE: reads JWT claim, no writes.
CREATE OR REPLACE FUNCTION app.staff_id() RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'staff_id', ''
  )::uuid;
$$;

-- Returns the caller's workstation_id (UUID) from JWT app_metadata. NULL for non-workstation.
-- STABLE: reads JWT claim, no writes.
CREATE OR REPLACE FUNCTION app.workstation_id() RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'workstation_id', ''
  )::uuid;
$$;

-- Returns the caller's company_id (UUID) from JWT app_metadata. NULL for non-customer.
-- STABLE: reads JWT claim, no writes. Used in customer-facing RLS policies.
CREATE OR REPLACE FUNCTION app.company_id() RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'company_id', ''
  )::uuid;
$$;

-- Universal updated_at trigger function.
-- Apply to every mutable table that has an updated_at column via:
--   CREATE TRIGGER set_updated_at BEFORE UPDATE ON <table>
--     FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();
-- Wave 1 tables: shop_settings, staff, workstations, companies, contacts, jobs
CREATE OR REPLACE FUNCTION app.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
