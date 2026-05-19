-- supabase/seed.sql
-- Source: CONTEXT.md D-12; docs/DESIGN.md §9.6
-- Local dev fixtures: runs automatically via `supabase db reset`.
--
-- FIXED UUID for test tenant per D-12 — test files can import this as a constant.
-- DO NOT change the test tenant UUID: 00000000-0000-0000-0000-000000000001
--
-- What is seeded:
--   1. Test tenant (fixed UUID) + shop_settings + tenant_domains (app.localhost:3000, track.localhost:3000)
--   2. 1 office staff user in auth.users + staff row (admin, staff_office audience)
--   3. 1 synthetic workstation in auth.users + workstations row (staff_shop audience)
--   4. Sample companies + contacts (for visual testing without re-seeding)
--   5. 1 customer user scoped to Acme Manufacturing
--   6. 1 shop employee with demo PIN 1234
--   7. 1 demo job with packet token + visible status history
--
-- Note on auth.users inserts:
--   Supabase db reset runs as the postgres superuser, so direct inserts into auth.users
--   are permitted here. The service-role client is NOT needed for seed.sql.
--   In production, auth users are created via auth.admin.createUser (seed-tenant.ts).
--
-- raw_app_meta_data drives the auth.users linking trigger and mirrors expected local claims.
-- app.custom_access_token_hook stamps JWT app_metadata by reading staff, workstations,
-- customer_users, and auth.users.email; it must remain read-only.

-- ============================================================
-- 1. Test tenant (FIXED UUID)
-- ============================================================
INSERT INTO public.tenants (id, name, slug)
  VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Pops Test Tenant', 'pops-test')
  ON CONFLICT (id) DO NOTHING;

INSERT INTO public.shop_settings (tenant_id)
  VALUES ('00000000-0000-0000-0000-000000000001'::uuid)
  ON CONFLICT (tenant_id) DO NOTHING;

-- Local dev domain routing (per docs/DESIGN.md §3294)
-- *.localhost TLD is routed by the browser without /etc/hosts changes.
INSERT INTO public.tenant_domains (tenant_id, host, audience)
  VALUES
    ('00000000-0000-0000-0000-000000000001'::uuid, 'app.localhost:3000', 'staff'),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'track.localhost:3000', 'customer')
  ON CONFLICT (host) DO NOTHING;

-- ============================================================
-- 2. Test office staff user (admin role, staff_office audience)
--    Fixed auth.users UUID: 00000000-0000-0000-0000-000000000010
--    Email: admin@pops-test.local  Password: DevPassword1!
--    (change password in Supabase Dashboard for any real deployment)
-- ============================================================
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  role,
  aud,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000010'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'admin@pops-test.local',
  crypt('DevPassword1!', gen_salt('bf')),
  now(),
  'authenticated',
  'authenticated',
  '{"tenant_id": "00000000-0000-0000-0000-000000000001", "audience": "staff_office", "role": "admin", "intended_actor": "staff"}'::jsonb,
  '{"name": "Test Admin"}'::jsonb,
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Corresponding staff row (auth_user_id linked immediately for local dev)
INSERT INTO public.staff (id, tenant_id, auth_user_id, email, name, role)
  VALUES (
    '00000000-0000-0000-0000-000000000011'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000010'::uuid,
    'admin@pops-test.local',
    'Test Admin',
    'admin'
  )
  ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Synthetic workstation user (staff_shop audience, workstation)
--    Fixed auth.users UUID: 00000000-0000-0000-0000-000000000020
--    Email: workstation-seed-001@workstations.pops-test.local
--    device_token used as password: dev-workstation-device-token-seed-001
-- ============================================================
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  role,
  aud,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000020'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'workstation-seed-001@workstations.pops-test.local',
  crypt('dev-workstation-device-token-seed-001', gen_salt('bf')),
  now(),
  'authenticated',
  'authenticated',
  '{"tenant_id": "00000000-0000-0000-0000-000000000001", "audience": "staff_shop", "role": "shop", "workstation_id": "00000000-0000-0000-0000-000000000021"}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.workstations (id, tenant_id, auth_user_id, name, device_token, is_active)
  VALUES (
    '00000000-0000-0000-0000-000000000021'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000020'::uuid,
    'Dev Workstation 1',
    'dev-workstation-device-token-seed-001',
    true
  )
  ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Sample companies and contacts (for Phase 2+ visual testing)
-- ============================================================
INSERT INTO public.companies (id, tenant_id, name, email, phone, payment_terms)
  VALUES
    ('00000000-0000-0000-0000-000000000030'::uuid,
     '00000000-0000-0000-0000-000000000001'::uuid,
     'Acme Manufacturing',
     'orders@acme.example',
     '555-0100',
     'net30'),
    ('00000000-0000-0000-0000-000000000031'::uuid,
     '00000000-0000-0000-0000-000000000001'::uuid,
     'Pinnacle Auto Parts',
     'shop@pinnacle.example',
     '555-0200',
     'net15'),
    ('00000000-0000-0000-0000-000000000032'::uuid,
     '00000000-0000-0000-0000-000000000001'::uuid,
     'Riverside Custom Fabrication',
     'fab@riverside.example',
     '555-0300',
     'net30')
  ON CONFLICT (id) DO NOTHING;

INSERT INTO public.contacts (id, tenant_id, company_id, first_name, last_name, email, phone, is_primary)
  VALUES
    ('00000000-0000-0000-0000-000000000040'::uuid,
     '00000000-0000-0000-0000-000000000001'::uuid,
     '00000000-0000-0000-0000-000000000030'::uuid,
     'Bob', 'Acme',
     'bob@acme.example', '555-0101', true),
    ('00000000-0000-0000-0000-000000000041'::uuid,
     '00000000-0000-0000-0000-000000000001'::uuid,
     '00000000-0000-0000-0000-000000000031'::uuid,
     'Carol', 'Pinnacle',
     'carol@pinnacle.example', '555-0201', true),
    ('00000000-0000-0000-0000-000000000042'::uuid,
     '00000000-0000-0000-0000-000000000001'::uuid,
     '00000000-0000-0000-0000-000000000032'::uuid,
     'Dave', 'Riverside',
     'dave@riverside.example', '555-0301', true)
  ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. Test customer user (scoped to Acme Manufacturing)
--    auth.users UUID: 00000000-0000-0000-0000-000000000050
--    Email: customer@acme.example  Password: DevPassword1!
-- ============================================================
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  role,
  aud,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000050'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'customer@acme.example',
  crypt('DevPassword1!', gen_salt('bf')),
  now(),
  'authenticated',
  'authenticated',
  '{"tenant_id": "00000000-0000-0000-0000-000000000001", "audience": "customer", "company_id": "00000000-0000-0000-0000-000000000030", "customer_user_id": "00000000-0000-0000-0000-000000000051", "intended_actor": "customer"}'::jsonb,
  '{"name": "Bob Acme"}'::jsonb,
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.customer_users (id, tenant_id, company_id, auth_user_id, email, name)
  VALUES (
    '00000000-0000-0000-0000-000000000051'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000030'::uuid,
    '00000000-0000-0000-0000-000000000050'::uuid,
    'customer@acme.example',
    'Bob Acme'
  )
  ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. Test shop employee
--    PIN: 1234
-- ============================================================
INSERT INTO public.shop_employees (
  id,
  tenant_id,
  display_name,
  pin_hash,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000060'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Pat Powder',
  '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiVEjrYt8CGRcBvO1lZPZK4u6tH3g4m',
  true
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. Demo job + visible status history
--    Packet token: demoPacketTok001
--    Manual entry suffix: etTok001
-- ============================================================
INSERT INTO public.jobs (
  id,
  tenant_id,
  job_number,
  packet_token,
  customer_po_number,
  company_id,
  contact_id,
  job_name,
  description,
  part_count,
  color,
  coating_type,
  due_date,
  priority,
  intake_status,
  production_status,
  notes,
  created_by_staff_id
) VALUES (
  '00000000-0000-0000-0000-000000000070'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'POPS-2026-00001',
  'demoPacketTok001',
  'ACME-PO-1001',
  '00000000-0000-0000-0000-000000000030'::uuid,
  '00000000-0000-0000-0000-000000000040'::uuid,
  'Acme Bracket Batch',
  'Demo job for local office, packet, scan, and portal walkthroughs.',
  48,
  'Safety Yellow',
  'Powder Coat',
  '2026-06-01',
  'normal',
  'in_production',
  'received',
  'Local demo seed job. Scan the packet to advance it.',
  '00000000-0000-0000-0000-000000000011'::uuid
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.job_status_history (
  id,
  tenant_id,
  job_id,
  event_type,
  from_status,
  to_status,
  shop_employee_id,
  workstation_id,
  customer_visible,
  notes,
  scanned_at
) VALUES (
  '00000000-0000-0000-0000-000000000080'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000070'::uuid,
  'stage_change',
  NULL,
  'received',
  '00000000-0000-0000-0000-000000000060'::uuid,
  '00000000-0000-0000-0000-000000000021'::uuid,
  true,
  'Seeded demo event: job received at the shop.',
  now() - interval '2 hours'
) ON CONFLICT (id) DO NOTHING;
