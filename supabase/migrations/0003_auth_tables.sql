-- 0003_auth_tables.sql
-- Source: docs/DESIGN.md §3.3 Auth-related tables (lines 385–463)
--         docs/DESIGN.md §3.3 Customer portal tables (lines 703–719)
--
-- HIDDEN INVARIANT: ordering matters. The cross-table email uniqueness function
-- app.assert_email_unique_across_actor_tables() references BOTH staff and customer_users.
-- Postgres parses function bodies lazily, so the function definition succeeds even if
-- customer_users doesn't exist yet. BUT the trigger fires on the first INSERT INTO staff,
-- and at that moment customer_users must already exist or the function body fails at runtime
-- with "relation customer_users does not exist".
--
-- Mandatory ordering (per docs/DESIGN.md §3.3 lines 458–463 and
-- .planning/phases/01-foundation/01-RESEARCH.md Pitfall 3):
--   1. CREATE TABLE staff
--   2. CREATE TABLE shop_employees
--   3. CREATE TABLE workstations
--   4. CREATE TABLE customer_users        ← both tables exist before function
--   5. CREATE OR REPLACE FUNCTION app.assert_email_unique_across_actor_tables()
--   6. CREATE TRIGGER ensure_email_unique ON staff
--   7. CREATE TRIGGER ensure_customer_email_unique ON customer_users

-- ============================================================
-- 1. staff table
-- ============================================================
CREATE TABLE staff (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL REFERENCES tenants(id),
  auth_user_id           UUID UNIQUE REFERENCES auth.users(id),
  email                  TEXT NOT NULL,
  name                   TEXT NOT NULL,
  phone                  TEXT,
  role                   TEXT NOT NULL CHECK (role IN ('admin','manager','office','shop','tenant_admin','agency_super_admin')),
  pin_hash               TEXT,            -- if office staff also scans
  hire_date              DATE,
  is_active              BOOLEAN NOT NULL DEFAULT true,
  archived_at            TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);
CREATE INDEX ON staff (tenant_id);
CREATE INDEX ON staff (auth_user_id);

-- app.set_updated_at trigger on staff (has updated_at column)
CREATE TRIGGER set_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ============================================================
-- 2. shop_employees table (floor workers; may or may not be a staff member)
-- ============================================================
CREATE TABLE shop_employees (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id),
  staff_id                UUID REFERENCES staff(id),  -- optional link if same person
  display_name            TEXT NOT NULL,
  pin_hash                TEXT NOT NULL,
  avatar_url              TEXT,
  failed_pin_attempts     INT NOT NULL DEFAULT 0,
  locked_until            TIMESTAMPTZ,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  archived_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON shop_employees (tenant_id);

-- ============================================================
-- 3. workstations table (per-workstation synthetic Supabase user)
-- ============================================================
CREATE TABLE workstations (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID NOT NULL REFERENCES tenants(id),
  auth_user_id                UUID UNIQUE REFERENCES auth.users(id),  -- per-workstation synthetic user
  name                        TEXT NOT NULL,
  default_stage               TEXT,
  physical_location           TEXT,
  device_token                TEXT NOT NULL UNIQUE,  -- 48-char URL-safe random; also workstation password
  current_employee_id         UUID REFERENCES shop_employees(id),
  current_employee_id_set_at  TIMESTAMPTZ,
  last_activity_at            TIMESTAMPTZ,
  version                     INT NOT NULL DEFAULT 0,  -- optimistic concurrency
  is_active                   BOOLEAN NOT NULL DEFAULT true,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
CREATE INDEX ON workstations (tenant_id);

-- app.set_updated_at trigger on workstations (has updated_at column)
CREATE TRIGGER set_updated_at BEFORE UPDATE ON workstations
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ============================================================
-- 4. customer_users table
--    Note: company_id and contact_id FKs reference tables created in 0004_crm_tables.sql.
--    Those FKs are declared here as plain UUID columns (no REFERENCES) to avoid forward FK
--    issues. The FKs are added in 0004 via ALTER TABLE ... ADD CONSTRAINT after the referenced
--    tables are created.
-- ============================================================
CREATE TABLE customer_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  company_id      UUID NOT NULL,  -- FK to companies(id) added in 0004 after companies is created
  contact_id      UUID,           -- FK to contacts(id) added in 0004 after contacts is created
  auth_user_id    UUID UNIQUE REFERENCES auth.users(id),
  email           TEXT NOT NULL,
  name            TEXT,
  -- role added in Wave 2
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);
CREATE INDEX ON customer_users (tenant_id);
CREATE INDEX ON customer_users (company_id);

-- ============================================================
-- 5. Cross-table email uniqueness function
--    Both tables MUST exist before this function is created (step 4 above ensures this).
--    Source: docs/DESIGN.md §3.3 lines 438–451
-- ============================================================
CREATE OR REPLACE FUNCTION app.assert_email_unique_across_actor_tables()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME = 'staff' AND EXISTS (
    SELECT 1 FROM customer_users WHERE email = NEW.email
  ) THEN RAISE EXCEPTION 'email_already_exists_as_customer'; END IF;

  IF TG_TABLE_NAME = 'customer_users' AND EXISTS (
    SELECT 1 FROM staff WHERE email = NEW.email
  ) THEN RAISE EXCEPTION 'email_already_exists_as_staff'; END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 6. Trigger on staff (fires BEFORE INSERT OR UPDATE of email)
--    Source: docs/DESIGN.md §3.3 lines 453–455
-- ============================================================
CREATE TRIGGER ensure_email_unique
  BEFORE INSERT OR UPDATE OF email ON staff
  FOR EACH ROW EXECUTE FUNCTION app.assert_email_unique_across_actor_tables();

-- ============================================================
-- 7. Trigger on customer_users (mirror trigger — must also exist)
--    Source: docs/DESIGN.md §3.3 lines 717–719
-- ============================================================
CREATE TRIGGER ensure_customer_email_unique
  BEFORE INSERT OR UPDATE OF email ON customer_users
  FOR EACH ROW EXECUTE FUNCTION app.assert_email_unique_across_actor_tables();

-- ============================================================
-- Enable RLS on all four auth-related tables
-- Policies land in 0006_rls_policies.sql
-- ============================================================
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE workstations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_users ENABLE ROW LEVEL SECURITY;
