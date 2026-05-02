-- 0005_jobs_tables.sql
-- Source: docs/DESIGN.md §3.3 Jobs and history (lines 540–698)
-- Provides: jobs table, app.next_job_number SECURITY DEFINER function,
--           job_status_history table, set_history_company_id trigger,
--           compute_status_event_metadata trigger
--
-- SECURITY NOTE: app.next_job_number reads tenant_id ONLY from app.tenant_id() (JWT claim).
-- It does NOT accept tenant_id as a parameter (that would be a privilege escalation
-- vulnerability — callers could generate job numbers for any tenant).
-- Source: CLAUDE.md anti-pattern; docs/DESIGN.md §3.3 lines 595–627

-- ============================================================
-- jobs table
-- ============================================================
CREATE TABLE jobs (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES tenants(id),
  parent_job_id            UUID REFERENCES jobs(id),
  CHECK (parent_job_id IS NULL OR parent_job_id != id),

  job_number               TEXT NOT NULL,
  packet_token             TEXT NOT NULL UNIQUE,  -- 16-char URL-safe random
  customer_po_number       TEXT,

  company_id               UUID NOT NULL REFERENCES companies(id),
  contact_id               UUID REFERENCES contacts(id),

  job_name                 TEXT NOT NULL,
  description              TEXT,
  part_count               INT,
  parts_received_count     INT,
  parts_completed_count    INT,
  parts_damaged_count      INT NOT NULL DEFAULT 0,
  parts_rework_count       INT NOT NULL DEFAULT 0,
  weight_lbs               NUMERIC(10,2),
  dimensions_text          TEXT,
  color                    TEXT,
  -- color_library_id added in Wave 2
  coating_type             TEXT,

  due_date                 DATE,
  priority                 TEXT NOT NULL DEFAULT 'normal'
                            CHECK (priority IN ('low','normal','high','rush')),

  intake_status            TEXT NOT NULL DEFAULT 'draft'
                            CHECK (intake_status IN ('draft','scheduled','in_production','archived')),
  production_status        TEXT
                            CHECK (production_status IS NULL
                                   OR production_status IN ('received','prep','coating','curing','qc','completed','picked_up')),

  on_hold                  BOOLEAN NOT NULL DEFAULT false,
  hold_reason              TEXT,
  CHECK (on_hold = false OR hold_reason IS NOT NULL),

  qc_passed                BOOLEAN,
  picked_up_at             TIMESTAMPTZ,
  quoted_price             NUMERIC(12,2),
  packet_dirty             BOOLEAN NOT NULL DEFAULT false,  -- needs reprint

  notes                    TEXT,
  archived_at              TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_staff_id      UUID REFERENCES staff(id),

  UNIQUE (tenant_id, job_number),
  CHECK (intake_status != 'in_production' OR production_status IS NOT NULL)
);
CREATE INDEX ON jobs (tenant_id);
CREATE INDEX ON jobs (tenant_id, company_id);
CREATE INDEX ON jobs (tenant_id, intake_status);
CREATE INDEX ON jobs (tenant_id, production_status) WHERE production_status IS NOT NULL;
CREATE INDEX ON jobs (packet_token);

-- app.set_updated_at trigger on jobs (has updated_at column)
CREATE TRIGGER set_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- ============================================================
-- app.next_job_number — atomic, tenant-isolated job number generator
-- Source: docs/DESIGN.md §3.3 lines 599–627
-- SECURITY DEFINER bypasses RLS so office staff can increment
-- shop_settings.job_number_seq without needing raw UPDATE on the table.
-- The function reads tenant_id ONLY from app.tenant_id() (JWT) — NEVER from a parameter.
-- ============================================================
CREATE OR REPLACE FUNCTION app.next_job_number() RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id UUID := app.tenant_id();
  v_prefix TEXT; v_seq INT; v_year INT;
  v_current_year INT := EXTRACT(YEAR FROM now());
BEGIN
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id_missing: caller must have valid JWT';
  END IF;
  IF app.audience() NOT IN ('staff_office', 'staff_shop') THEN
    RAISE EXCEPTION 'access_denied: only staff can generate job numbers';
  END IF;

  UPDATE shop_settings
    SET job_number_year = v_current_year,
        job_number_seq = CASE WHEN job_number_year < v_current_year THEN 1
                              ELSE job_number_seq + 1 END
    WHERE tenant_id = v_tenant_id
    RETURNING job_number_prefix, job_number_seq, job_number_year
    INTO v_prefix, v_seq, v_year;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'shop_settings_missing for tenant %', v_tenant_id;
  END IF;

  RETURN format('%s-%s-%s', v_prefix, v_year, lpad(v_seq::text, 5, '0'));
END;
$$;

-- ============================================================
-- job_status_history table
-- company_id is denormalized here for RLS performance — avoids a JOIN to jobs in the policy.
-- Source: docs/DESIGN.md §3.3 lines 629–655
-- ============================================================
CREATE TABLE job_status_history (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  job_id              UUID NOT NULL REFERENCES jobs(id),
  company_id          UUID NOT NULL REFERENCES companies(id),  -- denormalized for RLS perf

  event_type          TEXT NOT NULL CHECK (event_type IN ('stage_change','hold_on','hold_off','note','photo','qc_result','manual_transition')),

  from_status         TEXT,
  to_status           TEXT,
  is_rework           BOOLEAN NOT NULL DEFAULT false,
  is_unusual_transition BOOLEAN NOT NULL DEFAULT false,  -- wrong workstation warning bypassed

  shop_employee_id    UUID REFERENCES shop_employees(id),
  workstation_id      UUID REFERENCES workstations(id),
  attachment_id       UUID,  -- snap-at-scan photo (FK added after attachments table created)

  customer_visible    BOOLEAN NOT NULL DEFAULT true,
  notes               TEXT,

  scanned_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds    INT
);
CREATE INDEX ON job_status_history (tenant_id, job_id, scanned_at DESC);
CREATE INDEX ON job_status_history (tenant_id, scanned_at DESC);
CREATE INDEX ON job_status_history (shop_employee_id, scanned_at DESC);
CREATE INDEX ON job_status_history (company_id, scanned_at DESC);

-- ============================================================
-- Trigger to populate denormalized company_id
-- Source: docs/DESIGN.md §3.3 lines 658–669
-- ============================================================
CREATE OR REPLACE FUNCTION app.set_history_company_id() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id FROM jobs WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_company_id_on_history
  BEFORE INSERT ON job_status_history
  FOR EACH ROW EXECUTE FUNCTION app.set_history_company_id();

-- ============================================================
-- Trigger to compute duration_seconds and detect backward transitions (is_rework)
-- Source: docs/DESIGN.md §3.3 lines 672–697
-- ============================================================
CREATE OR REPLACE FUNCTION app.compute_status_event_metadata() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
  v_prev TIMESTAMPTZ;
  v_stages TEXT[] := ARRAY['received','prep','coating','curing','qc','completed','picked_up'];
BEGIN
  IF NEW.event_type IN ('stage_change','manual_transition') AND NEW.from_status IS NOT NULL THEN
    SELECT MAX(scanned_at) INTO v_prev
      FROM job_status_history
      WHERE job_id = NEW.job_id AND to_status = NEW.from_status;
    IF v_prev IS NOT NULL THEN
      NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.scanned_at - v_prev))::INT;
    END IF;
    -- Detect backward transition (rework)
    IF array_position(v_stages, NEW.to_status) IS NOT NULL
       AND array_position(v_stages, NEW.from_status) IS NOT NULL
       AND array_position(v_stages, NEW.to_status) < array_position(v_stages, NEW.from_status) THEN
      NEW.is_rework := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER compute_event_metadata
  BEFORE INSERT ON job_status_history
  FOR EACH ROW EXECUTE FUNCTION app.compute_status_event_metadata();

-- ============================================================
-- FK from job_status_history.attachment_id → attachments(id)
-- Source: docs/DESIGN.md §3.3 lines 742–744
-- Added here (after attachments table was created in 0004)
-- ============================================================
ALTER TABLE job_status_history
  ADD CONSTRAINT fk_attachment
  FOREIGN KEY (attachment_id) REFERENCES attachments(id);

-- ============================================================
-- Enable RLS on jobs tables
-- Policies land in 0006_rls_policies.sql
-- ============================================================
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_status_history ENABLE ROW LEVEL SECURITY;
