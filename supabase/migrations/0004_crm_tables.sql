-- 0004_crm_tables.sql
-- Source: docs/DESIGN.md §3.3 CRM tables (lines 467–535)
--         docs/DESIGN.md §3.3 Customer portal & attachments (lines 700–805)
-- Provides: companies, contacts, activities, tags, tagged_entities, attachments tables
--           app.can_user_access_attachment_path SECURITY DEFINER helper
--           Deferred FKs from customer_users (company_id → companies, contact_id → contacts)

-- ============================================================
-- companies table
-- ============================================================
CREATE TABLE companies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  name                TEXT NOT NULL,
  shipping_address    TEXT, shipping_city TEXT, shipping_state TEXT, shipping_zip TEXT,
  billing_address     TEXT, billing_city TEXT, billing_state TEXT, billing_zip TEXT,
  phone               TEXT,
  email               TEXT,
  tax_id              TEXT,
  payment_terms       TEXT,
  customer_since      DATE,
  notes               TEXT,
  archived_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON companies (tenant_id);

-- app.set_updated_at trigger on companies (has updated_at column)
CREATE TRIGGER set_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ============================================================
-- contacts table
-- ============================================================
CREATE TABLE contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  company_id      UUID NOT NULL REFERENCES companies(id),
  first_name      TEXT NOT NULL,
  last_name       TEXT,
  email           TEXT,
  phone           TEXT,
  role            TEXT,
  is_primary      BOOLEAN NOT NULL DEFAULT false,
  notes           TEXT,
  archived_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON contacts (tenant_id);
CREATE INDEX ON contacts (company_id);
CREATE UNIQUE INDEX one_primary_per_company
  ON contacts (company_id) WHERE is_primary = true AND archived_at IS NULL;

-- app.set_updated_at trigger on contacts (has updated_at column)
CREATE TRIGGER set_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ============================================================
-- activities table (polymorphic: company / contact / job)
-- ============================================================
CREATE TABLE activities (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id),
  entity_type        TEXT NOT NULL CHECK (entity_type IN ('company','contact','job')),
  entity_id          UUID NOT NULL,
  activity_type      TEXT NOT NULL CHECK (activity_type IN ('call','email','meeting','note','sms')),
  subject            TEXT NOT NULL,
  body               TEXT,
  customer_visible   BOOLEAN NOT NULL DEFAULT false,
  staff_id           UUID REFERENCES staff(id),
  occurred_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON activities (tenant_id, entity_type, entity_id, occurred_at DESC);

-- ============================================================
-- tags table (tenant-scoped, colored, polymorphic)
-- ============================================================
CREATE TABLE tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  name            TEXT NOT NULL,
  color_hex       TEXT NOT NULL CHECK (color_hex ~* '^#[0-9A-Fa-f]{6}$'),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
CREATE INDEX ON tags (tenant_id);

-- ============================================================
-- tagged_entities table (join table: tags ↔ any entity)
-- ============================================================
CREATE TABLE tagged_entities (
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  tag_id          UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  entity_type     TEXT NOT NULL CHECK (entity_type IN ('job','company','contact','inventory_item')),
  entity_id       UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tag_id, entity_type, entity_id)
);
CREATE INDEX ON tagged_entities (tenant_id, entity_type, entity_id);

-- ============================================================
-- attachments table (polymorphic storage references)
-- ============================================================
CREATE TABLE attachments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  -- Wave 1 entity types only. Wave 2 ALTER TABLE adds 'qc_inspection'; Wave 3 adds 'quote'.
  -- This prevents orphaned-FK confusion (no rows can reference nonexistent tables).
  entity_type           TEXT NOT NULL CHECK (entity_type IN ('job','company','contact','tenant_logo','employee_avatar')),
  entity_id             UUID NOT NULL,
  storage_path          TEXT NOT NULL,
  filename              TEXT NOT NULL,
  mime_type             TEXT,
  size_bytes            BIGINT CHECK (size_bytes <= 25 * 1024 * 1024),  -- 25 MB max
  width                 INT,
  height                INT,
  caption               TEXT,
  customer_visible      BOOLEAN NOT NULL DEFAULT false,
  uploaded_by_staff_id  UUID REFERENCES staff(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON attachments (tenant_id, entity_type, entity_id);

-- ============================================================
-- Deferred FKs from customer_users (created in 0003, tables now available)
-- ============================================================
-- company_id FK: customer_users → companies
ALTER TABLE customer_users
  ADD CONSTRAINT customer_users_company_id_fk
  FOREIGN KEY (company_id) REFERENCES companies(id);

-- contact_id FK: customer_users → contacts
-- Source: Plan 02 Task 2 action text
ALTER TABLE customer_users
  ADD CONSTRAINT customer_users_contact_id_fk
  FOREIGN KEY (contact_id) REFERENCES contacts(id);

-- ============================================================
-- Polymorphic attachment access check function
-- Used by Storage RLS policies in Phase 3
-- Source: docs/DESIGN.md §3.3 lines 748–800
-- The path scheme is: attachments/{tenant_id}/{entity_type}/{entity_id}/{filename}
-- ============================================================
CREATE OR REPLACE FUNCTION app.can_user_access_attachment_path(p_path TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_parts TEXT[] := string_to_array(p_path, '/');
  v_tenant UUID;
  v_entity_type TEXT;
  v_entity_id UUID;
  v_caller_tenant UUID := app.tenant_id();
  v_caller_audience TEXT := app.audience();
  v_caller_company UUID := app.company_id();
BEGIN
  IF array_length(v_parts, 1) < 4 THEN RETURN false; END IF;

  v_tenant := v_parts[2]::UUID;          -- 'attachments/{tenant_id}/...'
  v_entity_type := v_parts[3];
  v_entity_id := v_parts[4]::UUID;

  -- Tenant boundary first
  IF v_tenant != v_caller_tenant THEN RETURN false; END IF;

  -- Staff sees everything in tenant
  IF v_caller_audience IN ('staff_office','staff_shop') THEN RETURN true; END IF;

  -- Customer: walk parent entity, check ownership + customer_visible
  IF v_caller_audience = 'customer' THEN
    IF v_entity_type = 'job' THEN
      RETURN EXISTS (
        SELECT 1 FROM jobs j
          JOIN attachments a ON a.entity_type='job' AND a.entity_id=j.id
        WHERE j.id = v_entity_id
          AND j.company_id = v_caller_company
          AND a.customer_visible = true
          AND a.storage_path = p_path
      );
    END IF;
    IF v_entity_type = 'qc_inspection' THEN
      RETURN EXISTS (
        SELECT 1 FROM qc_inspections q
          JOIN jobs j ON q.job_id = j.id
          JOIN attachments a ON a.entity_type='qc_inspection' AND a.entity_id=q.id
        WHERE q.id = v_entity_id
          AND j.company_id = v_caller_company
          AND a.customer_visible = true
          AND a.storage_path = p_path
      );
    END IF;
    -- Other entity types: not customer-accessible by default
    RETURN false;
  END IF;

  RETURN false;
END;
$$;

-- ============================================================
-- Enable RLS on all CRM tables
-- Policies land in 0006_rls_policies.sql
-- ============================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tagged_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
