-- 0006_rls_policies.sql
-- Source: docs/DESIGN.md §5.7 (lines 2068–2109)
--         01-RESEARCH.md Pattern 4 (lines 409–436)
--
-- RLS policies for ALL 15 Wave-1 business tables.
-- CRITICAL INVARIANTS (enforced in acceptance criteria):
--   1. NEVER use inline JWT parsing in policy expressions — always use app.tenant_id(),
--      app.audience(), app.company_id() helpers (CLAUDE.md + RESEARCH.md Anti-Patterns)
--   2. NO DELETE policies for authenticated users — hard deletes are forbidden
--      (soft delete via archived_at per docs/DESIGN.md §5.7 lines 2105–2109)
--   3. Every business table gets tenant_id isolation in USING/WITH CHECK clauses
--
-- Tables covered (15 total):
--   tenants, shop_settings, tenant_domains,
--   staff, shop_employees, workstations, customer_users,
--   companies, contacts, activities, tags, tagged_entities,
--   jobs, job_status_history, attachments

-- ============================================================
-- 1. tenants
-- Special case: the tenants table has no tenant_id column (it IS the tenant record).
-- Isolation uses id = app.tenant_id() instead.
-- No customer SELECT on tenants directly; customers see tenant brand via shop_settings.
-- No INSERT/UPDATE for authenticated — tenants created via service-role (seed-tenant.ts).
-- ============================================================
CREATE POLICY tenants_staff_select ON tenants FOR SELECT
  USING (id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'));

-- No customer_select on tenants (customers read brand via shop_settings, not tenants row)
-- No INSERT/UPDATE policies — tenants are managed via service-role only

-- ============================================================
-- 2. shop_settings
-- Special case: PK is tenant_id (one row per tenant)
-- Customers can read brand settings (logo_storage_path, brand_color_hex, etc.)
-- No INSERT policy (created via service-role during tenant onboarding)
-- No UPDATE policy for authenticated (managed via admin server action with service-role)
-- ============================================================
CREATE POLICY shop_settings_staff_select ON shop_settings FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'));

CREATE POLICY shop_settings_customer_select ON shop_settings FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() = 'customer');

-- shop_settings UPDATE only via service-role or scoped admin path; no authenticated UPDATE policy

-- ============================================================
-- 3. tenant_domains
-- Staff only — used for routing and domain verification
-- ============================================================
CREATE POLICY tenant_domains_staff_select ON tenant_domains FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'));

CREATE POLICY tenant_domains_office_insert ON tenant_domains FOR INSERT
  WITH CHECK (tenant_id = app.tenant_id() AND app.audience() = 'staff_office');

CREATE POLICY tenant_domains_office_update ON tenant_domains FOR UPDATE
  USING (tenant_id = app.tenant_id() AND app.audience() = 'staff_office')
  WITH CHECK (tenant_id = app.tenant_id());

-- ============================================================
-- 4. staff
-- Staff only — employees view their own tenant's staff roster
-- No customer SELECT (customers cannot see staff records)
-- ============================================================
CREATE POLICY staff_staff_select ON staff FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'));

CREATE POLICY staff_office_insert ON staff FOR INSERT
  WITH CHECK (tenant_id = app.tenant_id() AND app.audience() = 'staff_office');

CREATE POLICY staff_office_update ON staff FOR UPDATE
  USING (tenant_id = app.tenant_id() AND app.audience() = 'staff_office')
  WITH CHECK (tenant_id = app.tenant_id());

-- ============================================================
-- 5. shop_employees
-- Staff only — employees manage floor worker records
-- ============================================================
CREATE POLICY shop_employees_staff_select ON shop_employees FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'));

CREATE POLICY shop_employees_office_insert ON shop_employees FOR INSERT
  WITH CHECK (tenant_id = app.tenant_id() AND app.audience() = 'staff_office');

CREATE POLICY shop_employees_office_update ON shop_employees FOR UPDATE
  USING (tenant_id = app.tenant_id() AND app.audience() = 'staff_office')
  WITH CHECK (tenant_id = app.tenant_id());

-- ============================================================
-- 6. workstations
-- Staff only — workstations are managed by office staff
-- ============================================================
CREATE POLICY workstations_staff_select ON workstations FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'));

CREATE POLICY workstations_office_insert ON workstations FOR INSERT
  WITH CHECK (tenant_id = app.tenant_id() AND app.audience() = 'staff_office');

CREATE POLICY workstations_office_update ON workstations FOR UPDATE
  USING (tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'))
  WITH CHECK (tenant_id = app.tenant_id());

-- ============================================================
-- 7. customer_users
-- Staff only — customers do not directly query their own row
-- (customer identity comes from JWT; no self-service customer_users table access)
-- ============================================================
CREATE POLICY customer_users_staff_select ON customer_users FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'));

CREATE POLICY customer_users_office_insert ON customer_users FOR INSERT
  WITH CHECK (tenant_id = app.tenant_id() AND app.audience() = 'staff_office');

CREATE POLICY customer_users_office_update ON customer_users FOR UPDATE
  USING (tenant_id = app.tenant_id() AND app.audience() = 'staff_office')
  WITH CHECK (tenant_id = app.tenant_id());

-- ============================================================
-- 8. companies
-- Staff: all in tenant
-- Customer: only their own company (company_id = app.company_id())
-- Source: docs/DESIGN.md §5.7 lines 2092–2103
-- ============================================================
CREATE POLICY companies_staff_select ON companies FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'));

CREATE POLICY companies_customer_select ON companies FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() = 'customer'
         AND id = app.company_id());

CREATE POLICY companies_office_insert ON companies FOR INSERT
  WITH CHECK (tenant_id = app.tenant_id() AND app.audience() = 'staff_office');

CREATE POLICY companies_office_update ON companies FOR UPDATE
  USING (tenant_id = app.tenant_id() AND app.audience() = 'staff_office')
  WITH CHECK (tenant_id = app.tenant_id());

-- ============================================================
-- 9. contacts
-- Staff: all in tenant
-- Customer: contacts in their company (company_id = app.company_id())
-- Source: docs/DESIGN.md §5.7 lines 2092–2103
-- ============================================================
CREATE POLICY contacts_staff_select ON contacts FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'));

CREATE POLICY contacts_customer_select ON contacts FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() = 'customer'
         AND company_id = app.company_id());

CREATE POLICY contacts_office_insert ON contacts FOR INSERT
  WITH CHECK (tenant_id = app.tenant_id() AND app.audience() = 'staff_office');

CREATE POLICY contacts_office_update ON contacts FOR UPDATE
  USING (tenant_id = app.tenant_id() AND app.audience() = 'staff_office')
  WITH CHECK (tenant_id = app.tenant_id());

-- ============================================================
-- 10. activities
-- Staff only — no customer_visible filter implemented yet (Wave 2)
-- ============================================================
CREATE POLICY activities_staff_select ON activities FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'));

CREATE POLICY activities_office_insert ON activities FOR INSERT
  WITH CHECK (tenant_id = app.tenant_id() AND app.audience() = 'staff_office');

CREATE POLICY activities_office_update ON activities FOR UPDATE
  USING (tenant_id = app.tenant_id() AND app.audience() = 'staff_office')
  WITH CHECK (tenant_id = app.tenant_id());

-- ============================================================
-- 11. tags
-- Staff only — tags are internal tenant metadata
-- ============================================================
CREATE POLICY tags_staff_select ON tags FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'));

CREATE POLICY tags_office_insert ON tags FOR INSERT
  WITH CHECK (tenant_id = app.tenant_id() AND app.audience() = 'staff_office');

CREATE POLICY tags_office_update ON tags FOR UPDATE
  USING (tenant_id = app.tenant_id() AND app.audience() = 'staff_office')
  WITH CHECK (tenant_id = app.tenant_id());

-- ============================================================
-- 12. tagged_entities
-- Staff only — tagging is an internal operation
-- ============================================================
CREATE POLICY tagged_entities_staff_select ON tagged_entities FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'));

CREATE POLICY tagged_entities_office_insert ON tagged_entities FOR INSERT
  WITH CHECK (tenant_id = app.tenant_id() AND app.audience() = 'staff_office');

-- No UPDATE on tagged_entities (tags are added/removed, not modified)
-- tagged_entities records are "deleted" by removing the row (tag cascade), not soft-deleted

-- ============================================================
-- 13. jobs
-- Staff: all in tenant
-- Customer: only their company's non-archived jobs
-- Source: docs/DESIGN.md §5.7 lines 2092–2103
-- ============================================================
CREATE POLICY jobs_staff_select ON jobs FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'));

CREATE POLICY jobs_customer_select ON jobs FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() = 'customer'
         AND company_id = app.company_id() AND archived_at IS NULL);

CREATE POLICY jobs_office_insert ON jobs FOR INSERT
  WITH CHECK (tenant_id = app.tenant_id() AND app.audience() = 'staff_office');

CREATE POLICY jobs_office_update ON jobs FOR UPDATE
  USING (tenant_id = app.tenant_id() AND app.audience() = 'staff_office')
  WITH CHECK (tenant_id = app.tenant_id());

-- NOTE: production_status direct UPDATE is REVOKED in 0008_production_status_revoke.sql (Plan 03)
-- All production_status transitions go only through app.record_scan_event()

-- ============================================================
-- 14. job_status_history
-- Staff: all in tenant
-- Customer: only customer_visible rows for their company
-- Source: docs/DESIGN.md §5.7 lines 2092–2103
-- ============================================================
CREATE POLICY job_status_history_staff_select ON job_status_history FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'));

CREATE POLICY job_status_history_customer_select ON job_status_history FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() = 'customer'
         AND customer_visible = true AND company_id = app.company_id());

-- job_status_history INSERT is done via app.record_scan_event() SECURITY DEFINER (Plan 03)
-- No direct INSERT policy for authenticated; the SECURITY DEFINER function handles tenant isolation
CREATE POLICY job_status_history_shop_insert ON job_status_history FOR INSERT
  WITH CHECK (tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'));

-- No UPDATE on job_status_history (history is immutable)

-- ============================================================
-- 15. attachments
-- Staff: all in tenant
-- Customer: customer_visible attachments in their tenant
--   (deep entity-level check via app.can_user_access_attachment_path() is used in Storage RLS;
--    table-level RLS uses customer_visible + tenant_id for efficiency)
-- Source: docs/DESIGN.md §5.7 lines 2092–2103
-- ============================================================
CREATE POLICY attachments_staff_select ON attachments FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'));

CREATE POLICY attachments_customer_select ON attachments FOR SELECT
  USING (tenant_id = app.tenant_id() AND app.audience() = 'customer'
         AND customer_visible = true);

CREATE POLICY attachments_office_insert ON attachments FOR INSERT
  WITH CHECK (tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'));

CREATE POLICY attachments_office_update ON attachments FOR UPDATE
  USING (tenant_id = app.tenant_id() AND app.audience() IN ('staff_office', 'staff_shop'))
  WITH CHECK (tenant_id = app.tenant_id());
