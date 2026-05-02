-- 0002_tenants_and_domains.sql
-- Source: docs/DESIGN.md §3.3 Core/tenant tables (lines 304–383)
-- Provides: tenants, shop_settings, tenant_domains, audit_log tables
--
-- RLS is ENABLED on all four tables.
-- audit_log has its inline staff_select policy (service-role inserts only — no INSERT policy for authenticated).
-- tenants, shop_settings, tenant_domains: RLS enabled but policies land in 0006_rls_policies.sql.

-- Core tenant record
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-tenant operational settings (PK = tenant_id — one row per tenant)
CREATE TABLE shop_settings (
  tenant_id              UUID PRIMARY KEY REFERENCES tenants(id),
  timezone               TEXT NOT NULL DEFAULT 'America/New_York',
  currency               TEXT NOT NULL DEFAULT 'USD',
  job_number_prefix      TEXT NOT NULL DEFAULT 'JOB',
  job_number_seq         INT NOT NULL DEFAULT 0,
  job_number_year        INT NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  business_hours         JSONB,
  logo_storage_path      TEXT,
  brand_color_hex        TEXT CHECK (brand_color_hex IS NULL
                                     OR brand_color_hex ~* '^#[0-9A-Fa-f]{6}$'),
  default_due_days       INT DEFAULT 14,
  tablet_inactivity_hours INT DEFAULT 4,
  pin_mode               TEXT NOT NULL DEFAULT 'per_shift'
                          CHECK (pin_mode IN ('per_shift', 'per_scan')),
  -- locked once first job exists. Set to true by createJob server action via
  -- shop_settings UPDATE in the same transaction as the first jobs INSERT.
  -- Enforced at action layer: updateShopSettings refuses to change timezone/currency
  -- when is_first_job_created = true.
  is_first_job_created   BOOLEAN NOT NULL DEFAULT false,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- app.set_updated_at trigger on shop_settings (has updated_at column)
CREATE TRIGGER set_updated_at BEFORE UPDATE ON shop_settings
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- Per-tenant domain routing entries (staff vs customer subdomains)
CREATE TABLE tenant_domains (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  host        TEXT NOT NULL UNIQUE,
  audience    TEXT NOT NULL CHECK (audience IN ('staff', 'customer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Seed for v1 (executed via supabase/seed.sql or scripts/seed-tenant.ts):
--  ('app.popscoating.com', pops_tenant_id, 'staff'),
--  ('track.popscoating.com', pops_tenant_id, 'customer')
CREATE INDEX ON tenant_domains (tenant_id);

-- Immutable audit trail for sensitive operations.
-- Inserts come exclusively from shared/audit/log.ts using the service-role client (bypasses RLS).
-- No INSERT policy for authenticated — prevents arbitrary code from writing audit rows.
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  entity_type     TEXT NOT NULL,
  entity_id       UUID NOT NULL,
  action          TEXT NOT NULL CHECK (action IN (
                    'create','update','archive','delete','export',
                    'login','login_failed','logout','invite','deactivate',
                    'reset_pin','pin_lockout','regenerate_token',
                    'enroll_workstation','magic_link_request','role_change',
                    -- Wave 4 (multi-tenant whitelabel)
                    'impersonate_start','impersonate_end','consent_token_issued',
                    'consent_token_revoked','module_toggle_changed',
                    'domain_added','domain_verified','branding_updated',
                    'workflow_template_cloned','workflow_template_edited'
                  )),
  changed_fields  JSONB,
  actor_type      TEXT NOT NULL CHECK (actor_type IN ('staff','customer','system')),
  actor_id        UUID,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON audit_log (tenant_id, entity_type, entity_id, created_at DESC);

-- Enable RLS on all four tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;

-- audit_log RLS: staff can SELECT their tenant's audit history; service-role only for INSERT
-- Source: docs/DESIGN.md §3.3 lines 376–378
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_staff_select ON audit_log FOR SELECT
  USING (tenant_id = app.tenant_id()
         AND app.audience() IN ('staff_office', 'staff_shop'));

-- Inserts come exclusively from shared/audit/log.ts using the service-role client
-- (which bypasses RLS), so no INSERT policy is needed for authenticated users.
-- This prevents arbitrary code paths from writing audit_log rows under user identity.
