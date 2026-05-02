-- supabase/seed.sql
-- Source: CONTEXT.md D-12; docs/DESIGN.md §9.6
-- Local dev fixtures: test tenant with FIXED known UUID, sample data for Phase 2+ visual testing
--
-- This file is loaded automatically by `supabase db reset` (seed enabled in config.toml).
-- Full seed data (staff user, workstation, companies, contacts, jobs) lands in Plan 06
-- after the auth hook (Plan 03) and auth helpers (Plan 04) are in place.
--
-- Phase 1 Plan 02: minimal stub — creates the test tenant so migrations can be verified.
-- Plan 06 Task 3 expands this with all test fixtures.

-- Fixed test tenant UUID (per D-12 — so tests can import it as a constant)
-- DO NOT change this UUID — test suites import it as a constant.
DO $$
BEGIN
  INSERT INTO public.tenants (id, name, slug)
    VALUES ('00000000-0000-0000-0000-000000000001', 'Test Tenant', 'test-tenant')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.shop_settings (tenant_id)
    VALUES ('00000000-0000-0000-0000-000000000001')
  ON CONFLICT (tenant_id) DO NOTHING;
END;
$$;
