-- supabase/tests/rls/test_authenticated_no_tenant_denial.sql
-- Phase 1 success criterion 5 smoke: an authenticated request that omits
-- tenant claims sees zero rows from tenant-scoped business tables.

BEGIN;
SELECT plan(16);

-- Fixture setup runs before SET ROLE so rows exist but RLS still decides what
-- the authenticated caller can see.
INSERT INTO tenants (id, name, slug)
VALUES ('c1000000-0000-0000-0000-000000000001'::uuid, 'No Tenant Claims Tenant', 'no-tenant-claims-tenant');

INSERT INTO shop_settings (tenant_id)
VALUES ('c1000000-0000-0000-0000-000000000001'::uuid);

INSERT INTO tenant_domains (id, tenant_id, host, audience)
VALUES (
  'c1000001-0000-0000-0000-000000000001'::uuid,
  'c1000000-0000-0000-0000-000000000001'::uuid,
  'no-tenant-claims.example',
  'staff'
);

INSERT INTO staff (id, tenant_id, email, name, role)
VALUES (
  'c1000002-0000-0000-0000-000000000001'::uuid,
  'c1000000-0000-0000-0000-000000000001'::uuid,
  'office@no-tenant-claims.example',
  'No Tenant Office',
  'admin'
);

INSERT INTO shop_employees (id, tenant_id, display_name, pin_hash)
VALUES (
  'c1000003-0000-0000-0000-000000000001'::uuid,
  'c1000000-0000-0000-0000-000000000001'::uuid,
  'No Tenant Floor',
  'placeholder-hash'
);

INSERT INTO workstations (id, tenant_id, name, device_token)
VALUES (
  'c1000004-0000-0000-0000-000000000001'::uuid,
  'c1000000-0000-0000-0000-000000000001'::uuid,
  'No Tenant Station',
  'no-tenant-claims-device-token-001'
);

INSERT INTO companies (id, tenant_id, name)
VALUES (
  'c1000005-0000-0000-0000-000000000001'::uuid,
  'c1000000-0000-0000-0000-000000000001'::uuid,
  'No Tenant Customer Co'
);

INSERT INTO contacts (id, tenant_id, company_id, first_name)
VALUES (
  'c1000006-0000-0000-0000-000000000001'::uuid,
  'c1000000-0000-0000-0000-000000000001'::uuid,
  'c1000005-0000-0000-0000-000000000001'::uuid,
  'No Tenant Contact'
);

INSERT INTO customer_users (id, tenant_id, company_id, contact_id, email, name)
VALUES (
  'c1000007-0000-0000-0000-000000000001'::uuid,
  'c1000000-0000-0000-0000-000000000001'::uuid,
  'c1000005-0000-0000-0000-000000000001'::uuid,
  'c1000006-0000-0000-0000-000000000001'::uuid,
  'customer@no-tenant-claims.example',
  'No Tenant Customer'
);

INSERT INTO activities (id, tenant_id, entity_type, entity_id, activity_type, subject, staff_id)
VALUES (
  'c1000008-0000-0000-0000-000000000001'::uuid,
  'c1000000-0000-0000-0000-000000000001'::uuid,
  'company',
  'c1000005-0000-0000-0000-000000000001'::uuid,
  'note',
  'No tenant claims fixture',
  'c1000002-0000-0000-0000-000000000001'::uuid
);

INSERT INTO tags (id, tenant_id, name, color_hex)
VALUES (
  'c1000009-0000-0000-0000-000000000001'::uuid,
  'c1000000-0000-0000-0000-000000000001'::uuid,
  'No Tenant Tag',
  '#F59E0B'
);

INSERT INTO tagged_entities (tenant_id, tag_id, entity_type, entity_id)
VALUES (
  'c1000000-0000-0000-0000-000000000001'::uuid,
  'c1000009-0000-0000-0000-000000000001'::uuid,
  'company',
  'c1000005-0000-0000-0000-000000000001'::uuid
);

INSERT INTO jobs (id, tenant_id, company_id, contact_id, job_number, packet_token, job_name)
VALUES (
  'c1000010-0000-0000-0000-000000000001'::uuid,
  'c1000000-0000-0000-0000-000000000001'::uuid,
  'c1000005-0000-0000-0000-000000000001'::uuid,
  'c1000006-0000-0000-0000-000000000001'::uuid,
  'NTC-2026-00001',
  'ntc-packet-token-001',
  'No Tenant Job'
);

INSERT INTO attachments (id, tenant_id, entity_type, entity_id, storage_path, filename, customer_visible)
VALUES (
  'c1000011-0000-0000-0000-000000000001'::uuid,
  'c1000000-0000-0000-0000-000000000001'::uuid,
  'job',
  'c1000010-0000-0000-0000-000000000001'::uuid,
  'attachments/c1000000-0000-0000-0000-000000000001/job/c1000010-0000-0000-0000-000000000001/no-tenant.jpg',
  'no-tenant.jpg',
  true
);

INSERT INTO job_status_history (
  id,
  tenant_id,
  job_id,
  company_id,
  event_type,
  to_status,
  shop_employee_id,
  workstation_id,
  attachment_id
)
VALUES (
  'c1000012-0000-0000-0000-000000000001'::uuid,
  'c1000000-0000-0000-0000-000000000001'::uuid,
  'c1000010-0000-0000-0000-000000000001'::uuid,
  'c1000005-0000-0000-0000-000000000001'::uuid,
  'stage_change',
  'received',
  'c1000003-0000-0000-0000-000000000001'::uuid,
  'c1000004-0000-0000-0000-000000000001'::uuid,
  'c1000011-0000-0000-0000-000000000001'::uuid
);

INSERT INTO audit_log (id, tenant_id, entity_type, entity_id, action, actor_type)
VALUES (
  'c1000013-0000-0000-0000-000000000001'::uuid,
  'c1000000-0000-0000-0000-000000000001'::uuid,
  'company',
  'c1000005-0000-0000-0000-000000000001'::uuid,
  'create',
  'system'
);

SET ROLE authenticated;
SELECT set_jwt_anon();

SELECT is((SELECT count(*)::int FROM tenants), 0, 'authenticated caller with no tenant claims cannot SELECT tenants');
SELECT is((SELECT count(*)::int FROM shop_settings), 0, 'authenticated caller with no tenant claims cannot SELECT shop_settings');
SELECT is((SELECT count(*)::int FROM tenant_domains), 0, 'authenticated caller with no tenant claims cannot SELECT tenant_domains');
SELECT is((SELECT count(*)::int FROM staff), 0, 'authenticated caller with no tenant claims cannot SELECT staff');
SELECT is((SELECT count(*)::int FROM shop_employees), 0, 'authenticated caller with no tenant claims cannot SELECT shop_employees');
SELECT is((SELECT count(*)::int FROM workstations), 0, 'authenticated caller with no tenant claims cannot SELECT workstations');
SELECT is((SELECT count(*)::int FROM customer_users), 0, 'authenticated caller with no tenant claims cannot SELECT customer_users');
SELECT is((SELECT count(*)::int FROM companies), 0, 'authenticated caller with no tenant claims cannot SELECT companies');
SELECT is((SELECT count(*)::int FROM contacts), 0, 'authenticated caller with no tenant claims cannot SELECT contacts');
SELECT is((SELECT count(*)::int FROM activities), 0, 'authenticated caller with no tenant claims cannot SELECT activities');
SELECT is((SELECT count(*)::int FROM tags), 0, 'authenticated caller with no tenant claims cannot SELECT tags');
SELECT is((SELECT count(*)::int FROM tagged_entities), 0, 'authenticated caller with no tenant claims cannot SELECT tagged_entities');
SELECT is((SELECT count(*)::int FROM jobs), 0, 'authenticated caller with no tenant claims cannot SELECT jobs');
SELECT is((SELECT count(*)::int FROM job_status_history), 0, 'authenticated caller with no tenant claims cannot SELECT job_status_history');
SELECT is((SELECT count(*)::int FROM attachments), 0, 'authenticated caller with no tenant claims cannot SELECT attachments');
SELECT is((SELECT count(*)::int FROM audit_log), 0, 'authenticated caller with no tenant claims cannot SELECT audit_log');

SELECT * FROM finish();
ROLLBACK;
