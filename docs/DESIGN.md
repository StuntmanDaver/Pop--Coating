# [Platform TBD] — Industrial Finishing Operations Platform — Design Spec

**Document version:** 2.0 (multi-tenant whitelabel pivot)
**Date:** 2026-04-27
**Author:** David K. (with collaborative design + 5 audit passes; v2.0 pivot 2026-04-27)
**Status:** **Active — source of truth for technical design.** This is the official, canonical design document for the project. All implementation decisions trace back here.
**Companion docs:** [PRD](../PRD.md) · [Parallel execution plan](EXECUTION.md) · [README](../README.md)

---

## 0. Document overview

This is the consolidated design spec for the Industrial Finishing Operations Platform (multi-tenant whitelabel SaaS for industrial finishing shops). It supersedes the original v1 PRD (now archived at `docs/archive/original-prd.md`) where they differ; the current PRD is at `../PRD.md`.

**What this document covers:**
- §1. Decisions log
- §2. Architecture
- §3. Data model (full schema for Waves 1-4)
- §4. Module breakdown (code organization)
- §5. Auth flows (the load-bearing security section)
- §6. Phased roadmap (week-by-week build plan)
- §7. Operational concerns (hardware, costs, legal, runbook)
- §8. Risk register
- §9. Testing strategy
- §10. Cost & commercial terms
- §11. Verification log (research agent findings + sources)
- §12. Spec change log
- §13. Sign-off checklist

**How to read this:** §1-§6 are the design itself. §7-§10 are the supporting details a solo dev needs to actually ship and operate. Skip to §6 for the timeline; skip to §8 for what could go wrong; skip to §10 for the cost.

**Verification:** Technical assumptions (Supabase Auth Hook API, Next.js 16 patterns, rate-limiting infrastructure, PDF/QR libraries) were independently verified against current 2026 documentation by parallel research agents. Findings are baked in throughout.

---

## 1. Decisions log

The following decisions were made during the design process. Each is load-bearing for what follows.

| # | Decision | Rationale |
|---|---|---|
| 1 | **Multi-tenant DB from day 1** | `tenant_id` on every table is cheap to add now, expensive to retrofit. RLS policies enforce isolation at the DB level. Wave 1: Pops onboards as Tenant 1. Wave 4: whitelabel layer + Tenant 2 (sandblasting) + per-tenant custom domains. |
| 2 | **Scope: Internal MVP + read-only customer portal in v1** | Ships fastest with the differentiator (customer portal). Inventory, quotes, analytics deferred to Waves 2-3 with the architecture supporting them from day 1. |
| 3 | **Stack: Next.js 16 + Supabase + Vercel** | Single app, managed services, ~50% less plumbing than rolled-your-own. Trade-off: vendor dependency, mitigated by Postgres data portability. |
| 4 | **Hardware: wall-mounted iPads at workstations** | Best ergonomics for shop floor, durable, employees don't carry anything. Camera-based scanner via @zxing/browser. |
| 5 | **7 production stages, flexible transitions** | Received → Prep → Coating → Curing → QC → Completed → Picked Up. Any-to-any allowed (rework). Plus `on_hold` flag with reason. Plus separate `intake_status` field for pre-production states (draft, scheduled, in_production, archived). |
| 6 | **Multi-color jobs use parent/child pattern** | `parent_job_id` on `jobs` table. Split allowed only when parent is in `intake_status='draft'` or `'scheduled'`. |
| 7 | **Staff roles + RBAC scaffolding** | `office` and `shop` are active in Wave 1. CHECK constraint allows `'admin' | 'manager' | 'office' | 'shop' | 'tenant_admin' | 'agency_super_admin'`. Wave 4 activates `tenant_admin` (per-tenant admin) and `agency_super_admin` (cross-tenant agency support). |
| 8 | **PIN-based scan attribution on tablets** | Workstation tablet logs in once (per-workstation Supabase auth). Employee PIN-tap identifies who scanned. PIN session is per-shift (default 4-hour idle timeout). |
| 9 | **Customer auth: magic link only** | Passwordless, no reset flow to build. Single role per company in v1; admin/viewer/accounting roles deferred to Wave 2. |
| 10 | **Public tracking links: deferred to Wave 3** | Magic-link-to-job covers the same UX in v1 with zero extra code. |
| 11 | **Multi-domain, one Next.js app** | Wave 1: `app.popsindustrial.com` (internal) + `track.popsindustrial.com` (customer portal) for Tenant 1, with `tenant_domains` table seeded for routing. Wave 4: per-tenant custom domains tracked via Wave 4 columns on `tenant_domains` (verification_status, ssl_status); SSL auto-issued via Vercel. Routed via host-based proxy (Next.js 16 `proxy.ts`). Agency console at `admin.<platform>.com` is platform-wide (not in `tenant_domains`). |
| 12 | **Per-workstation Supabase auth (not service-role for scanner)** | Each workstation tablet gets a synthetic Supabase user at enrollment. RLS applies to all scanner queries. Defense in depth vs the original "service-role for scanner" pattern. |
| 13 | **Wave 1 honest timeline: 12 weeks + buffer** | Original 7-8 week estimate was optimistic by ~30%. The 12-week plan reflects realistic time for offline mode, workstation enrollment ceremony, audit infrastructure, RLS test suite, and Pops onboarding. |
| 14 | **Whitelabel + per-vertical workflow templates added in Wave 4** | One platform, one codebase, configured per tenant. Tenant config holds branding (logo, colors, custom domain, email-from), module toggles, working hours, currency/tax. Workflow templates are per-vertical (powder coating, sandblasting, media blasting, galvanizing, plating, custom) with versioning so existing jobs lock to their original template version. |
| 15 | **Agency super-admin console with consent-gated impersonation** | Wave 4 introduces a cross-tenant operations console for the Implementation Specialist. Tenant data access requires an explicit consent token issued by a `tenant_admin`; all actions audit-logged with `acted_as_tenant_id`. Enforcement is at the DB level (not just app), with pgTAP test coverage. |

---

## 2. Architecture

### 2.1 High-level architecture

```
                 ┌─────────────────────────────────────────┐
                 │          Vercel (Next.js 16 app)        │
                 │  ┌───────────────────────────────────┐  │
                 │  │  proxy.ts (host detection)        │  │
                 │  └───────────────────────────────────┘  │
                 │       │              │           │      │
                 │  (office)        (scan)      (portal)   │
                 │   route group   route group  route group│
                 └───────┼──────────────┼───────────┼──────┘
                         │              │           │
       ┌─────────────────▼──────────────▼───────────▼──────────────┐
       │                    Supabase (Pro plan)                     │
       │   Postgres + Auth + Realtime + Storage                     │
       │   Single DB, multi-tenant via tenant_id + RLS policies     │
       └────────────────────────────────────────────────────────────┘

   app.<tenant>.com   →  proxy → (office) or (scan) routes
   track.<tenant>.com → proxy → (portal) routes only
   admin.<platform>.com → proxy → (agency) routes (Wave 4)

   Wave 1: hardcoded to popsindustrial.com (Tenant 1).
   Wave 4: per-tenant custom domains via `tenant_domains` (Wave 4 column additions); agency audience added (admin.<platform>.com is platform-wide, not in tenant_domains).
```

### 2.2 Architectural rules (load-bearing)

1. **One database, one app, one deploy.** No microservices. No separate API server. Server Actions handle all writes.
2. **`tenant_id` is on every table.** Every Supabase RLS policy filters on `app.tenant_id()` (a helper that reads JWT app_metadata via `current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id'` — see helper definition in §3.2). Cross-tenant data leaks are prevented at the database level.

**URL convention**: route groups `(office)` and `(portal)` discriminate at the **root** (`/`) via host-based proxy rewrite. The scanner uses a regular path-segment folder `scan/` (NOT a route group) so URLs match the folder structure: `/scan/enroll`, `/scan/scanner`, etc. — no proxy rewrite needed for scanner paths. When this spec writes `/(scan)/*` in **folder context** it means "files under `app/scan/*`"; when it writes a URL like `/scan/enroll` that's the actual user-facing URL.
3. **Four audiences, four auth contexts:**
   - **Office staff** — Supabase Auth email+password. `audience: staff_office`. Lands on `/(office)/` at `app.<tenant>.com`. Wave 4 adds `tenant_admin` role within this audience for tenant-level config.
   - **Shop staff** — Per-workstation Supabase user (synthetic email, `device_token` as password). `audience: staff_shop`. Each scan attributed to an employee via PIN tap. Lands on `/(scan)/` at `app.<tenant>.com`.
   - **Customers** — Supabase Auth magic link. `audience: customer`. Lands on `/(portal)/` at `track.<tenant>.com`.
   - **Agency super-admin** (Wave 4) — Supabase Auth email+password against `agency_users` table (cross-tenant; no `tenant_id`). `audience: staff_agency`. Lands on `/(agency)/*` at `admin.<platform>.com`. Cross-tenant access requires a valid `agency_consent_token` issued by a `tenant_admin` (see §5.8 + §3.9).
4. **Modules are folders, not packages.** Everything in `src/modules/<name>/`. Each module owns its tables, queries, server actions, and UI components. Other modules import via the module's `index.ts` (enforced via `no-restricted-imports`).
5. **No custom API routes (yet).** Reads via Supabase client (with RLS), writes via Next.js Server Actions. Add `/api` routes only for webhook targets (Resend, Twilio later).
6. **Next.js 16 specifics**: file is `proxy.ts` (not `middleware.ts`). `cookies()` from `next/headers` is async. Always use `supabase.auth.getUser()` (validates with auth server) — never `getSession()` for auth checks.

### 2.3 Folder structure

```
pops-coating/
├── docs/                        # DESIGN.md, EXECUTION.md, archive/
│   └── (this document lives at docs/DESIGN.md)
├── e2e/                          # Playwright tests
├── public/
├── scripts/
│   └── seed-tenant.ts            # programmatic tenant seeding
├── src/
│   ├── app/
│   │   ├── (office)/             # internal: CRM, intake, dashboards (URL: /, /companies, /jobs, ...)
│   │   ├── scan/                 # internal: PIN login + camera scanner (URL: /scan, /scan/enroll, ...)
│   │   ├── (portal)/             # customer-facing: status + timeline (URL: /, /jobs, ...)
│   │   ├── api/
│   │   │   └── webhooks/         # Resend bounces, Stripe (Wave 3)
│   │   ├── manifest.ts           # PWA manifest
│   │   └── layout.tsx
│   ├── messages/
│   │   └── en/                   # next-intl namespace files
│   │       ├── common.json
│   │       ├── auth.json
│   │       ├── jobs.json
│   │       └── ...
│   ├── modules/
│   │   ├── auth/
│   │   ├── crm/
│   │   ├── jobs/
│   │   ├── packets/
│   │   ├── scanning/
│   │   ├── timeline/
│   │   ├── dashboard/
│   │   ├── settings/
│   │   ├── portal/
│   │   ├── tags/
│   │   ├── inventory/            # Wave 2
│   │   ├── quality/              # Wave 2
│   │   ├── alerts/               # Wave 2
│   │   ├── notifications/        # Wave 2
│   │   ├── quotes/               # Wave 3
│   │   ├── invoices/             # Wave 3
│   │   ├── analytics/            # Wave 3
│   │   ├── public-tracking/      # Wave 3
│   │   └── messaging/            # Wave 3
│   ├── shared/
│   │   ├── audit/                # withAudit() helper
│   │   ├── auth-helpers/         # requireOfficeStaff(), etc.
│   │   ├── db/
│   │   │   ├── server.ts         # createClient() — async, uses Next.js cookies
│   │   │   ├── client.ts         # createBrowserClient()
│   │   │   ├── admin.ts          # createServiceClient() — restricted use
│   │   │   └── types.ts          # generated by `supabase gen types typescript`
│   │   ├── rate-limit/           # @upstash/ratelimit wrappers
│   │   ├── realtime/             # subscription helpers
│   │   ├── storage/              # promoted from attachments module
│   │   └── ui/                   # shadcn components + custom shared
│   ├── proxy.ts                  # Next.js 16 proxy (was middleware.ts)
│   └── i18n.ts                   # next-intl config
├── supabase/
│   ├── functions/
│   │   ├── alerts-evaluator/     # Wave 2 cron
│   │   ├── notification-dispatcher/  # Wave 2 cron
│   │   ├── inactivity-sweeper/   # Wave 1 cron (workstation idle)
│   │   └── pin-lockout-cleanup/  # Wave 1 cron
│   ├── migrations/               # SQL migration files
│   ├── seed.sql                  # dev seed data
│   └── tests/
│       ├── rls/                  # pgtap RLS tests
│       └── fixtures/
├── .env.local.example
├── package.json
├── eslint.config.js              # includes no-restricted-imports rule
└── README.md
```

### 2.4 Module communication rules

1. **Public API only.** Modules import other modules via `index.ts` barrel files. Deep imports (`modules/jobs/internal/...`) forbidden via `no-restricted-imports`:
   ```js
   {
     rules: {
       'no-restricted-imports': ['error', {
         patterns: [{
           group: ['@/modules/*/!(index)*'],
           message: 'Import from module index.ts only'
         }]
       }]
     }
   }
   ```
2. **No circular dependencies.** `madge --circular src/modules` runs in CI.
3. **Reads vs writes.** `actions.ts` for mutations (Server Actions). `queries.ts` for complex reads. Simple reads use Supabase client directly.
4. **No business logic in components.** Components consume server actions and queries.
5. **Cross-module state is in the DB.** If module A reacts to module B's changes, it subscribes via Supabase Realtime.
6. **Service-role client restricted.** `src/shared/db/admin.ts` exports `createServiceClient()`. Lint rule allows import only in:
   - `src/modules/settings/**` (calls `auth.admin.createUser` for workstation enrollment, `auth.admin.inviteUserByEmail` for staff invites, `auth.admin.signOut` for forced sign-out)
   - `src/modules/portal/**` (calls `auth.admin.generateLink` for customer magic links)
   - `src/modules/auth/**` (calls `auth.admin.*` for various invite/reset operations)
   - `src/shared/audit/**` (writes audit_log even when calling user lacks INSERT permission)
   - `supabase/functions/**` (Edge Functions run with service-role)
   - **Forbidden** in `src/modules/scanning/**` (now uses per-workstation Supabase auth — RLS applies; no service-role needed)
   - **Forbidden** in all other modules

   The lint rule is enforced via `eslint.config.js`:
   ```js
   { files: ['src/modules/!(settings|portal|auth)/**', 'src/!(shared/audit)/**'],
     rules: { 'no-restricted-imports': ['error', {
       paths: [{ name: '@/shared/db/admin', message: 'service-role import not allowed in this module' }]
     }]}}
   ```

---

## 3. Data model

### 3.1 Cross-cutting design rules

- **Primary keys: UUIDs** (`gen_random_uuid()`), not auto-increment. Distributed-safe, no enumeration risk on URLs.
- **Multi-tenancy:** every table has `tenant_id UUID NOT NULL REFERENCES tenants(id)`. Every RLS policy filters on `app.tenant_id()`.
- **Soft delete:** `archived_at TIMESTAMPTZ NULL`. Filtering at the query layer. No hard deletes (preserves audit history).
- **Timestamps:** `TIMESTAMPTZ` always (never naked `TIMESTAMP`). Shop's local timezone is in `shop_settings`.
- **Money:** `NUMERIC(12,2)` always (never `FLOAT`). Currency from `shop_settings.currency`.
- **Strings:** `TEXT` always (never `VARCHAR(n)`).
- **JSON:** `JSONB` with CHECK constraints on shape where possible.
- **Status enums:** `TEXT` + `CHECK` constraint. Easier to add values via migration than `CREATE TYPE`.
- **FK behavior:** `ON DELETE RESTRICT` by default. Cascades only where explicitly desired (e.g., `quote_line_items` → `quotes`).
- **Updated-at trigger:** single `set_updated_at()` Postgres function applied to all mutable tables.
- **Indexes:** every FK gets an index. Every common filter gets one. RLS perf depends on `tenant_id` indexes.

### 3.2 Helper functions (the `app` schema)

```sql
-- Required Postgres extensions
-- (pgcrypto for bcrypt PIN hashing via crypt()/gen_salt('bf'))
-- Supabase pre-installs both, but explicit is safer for local dev / new tenants
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.tenant_id() RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'tenant_id', ''
  )::uuid;
$$;

CREATE OR REPLACE FUNCTION app.audience() RETURNS TEXT
LANGUAGE sql STABLE AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb
    -> 'app_metadata' ->> 'audience';
$$;

CREATE OR REPLACE FUNCTION app.role() RETURNS TEXT
LANGUAGE sql STABLE AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb
    -> 'app_metadata' ->> 'role';
$$;

CREATE OR REPLACE FUNCTION app.company_id() RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'company_id', ''
  )::uuid;
$$;

CREATE OR REPLACE FUNCTION app.staff_id() RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'staff_id', ''
  )::uuid;
$$;

CREATE OR REPLACE FUNCTION app.workstation_id() RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'workstation_id', ''
  )::uuid;
$$;

-- Universal updated_at trigger function. Apply to every mutable table via:
--   CREATE TRIGGER set_updated_at BEFORE UPDATE ON <table>
--     FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();
CREATE OR REPLACE FUNCTION app.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
```

**Apply the `set_updated_at` trigger to every table that has an `updated_at` column.** In Wave 1: `shop_settings`, `staff`, `workstations`, `companies`, `contacts`, `jobs`. In Wave 2: `color_library`, `inventory_items`. In Wave 3: `quotes`, `invoices`. Done immediately after each table's CREATE in the migration.

### 3.3 Wave 1 schema

#### Core / tenant tables

```sql
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE tenant_domains (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  host        TEXT NOT NULL UNIQUE,
  audience    TEXT NOT NULL CHECK (audience IN ('staff', 'customer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Seed for v1:
--  ('app.popsindustrial.com', pops_id, 'staff'),
--  ('track.popsindustrial.com', pops_id, 'customer')

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

-- audit_log RLS: staff can SELECT their tenant's audit history; only service-role inserts
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_staff_select ON audit_log FOR SELECT
  USING (tenant_id = app.tenant_id()
         AND app.audience() IN ('staff_office', 'staff_shop'));

-- Inserts come exclusively from shared/audit/log.ts using the service-role client
-- (which bypasses RLS), so no INSERT policy is needed for authenticated users.
-- This prevents arbitrary code paths from writing audit_log rows under user identity.
```

#### Auth-related tables

```sql
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

-- Cross-table email uniqueness trigger
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

CREATE TRIGGER ensure_email_unique
  BEFORE INSERT OR UPDATE OF email ON staff
  FOR EACH ROW EXECUTE FUNCTION app.assert_email_unique_across_actor_tables();
```

**Migration ordering note:** The function `app.assert_email_unique_across_actor_tables()` references `customer_users` which is defined later. Postgres parses function bodies lazily, so the function definition itself succeeds. **But** if any INSERT on `staff` fires the trigger before `customer_users` exists, the trigger will fail with `relation "customer_users" does not exist`. To avoid this in single-statement migrations:
1. Create both `staff` and `customer_users` tables first
2. Then create the function
3. Then create both triggers (on staff and on customer_users)

The corresponding trigger on `customer_users` is shown below alongside that table's CREATE statement.

#### CRM tables

```sql
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
CREATE UNIQUE INDEX one_primary_per_company
  ON contacts (company_id) WHERE is_primary = true AND archived_at IS NULL;

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

CREATE TABLE tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  name            TEXT NOT NULL,
  color_hex       TEXT NOT NULL CHECK (color_hex ~* '^#[0-9A-Fa-f]{6}$'),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE tagged_entities (
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  tag_id          UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  entity_type     TEXT NOT NULL CHECK (entity_type IN ('job','company','contact','inventory_item')),
  entity_id       UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tag_id, entity_type, entity_id)
);
```

#### Jobs and history

```sql
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

-- Atomic job number generation. SECURITY DEFINER bypasses RLS so office staff
-- can increment shop_settings.job_number_seq without needing raw UPDATE on the table.
-- The function reads tenant_id from the caller's JWT (NOT from a parameter) to prevent
-- cross-tenant pollution of job number sequences.
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

-- Trigger to populate denormalized company_id
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

-- Trigger to compute duration_seconds and is_rework
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
    -- Detect backward transition
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
```

#### Customer portal & attachments

```sql
CREATE TABLE customer_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  company_id      UUID NOT NULL REFERENCES companies(id),
  contact_id      UUID REFERENCES contacts(id),
  auth_user_id    UUID UNIQUE REFERENCES auth.users(id),
  email           TEXT NOT NULL,
  name            TEXT,
  -- role added in Wave 2
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);
CREATE TRIGGER ensure_customer_email_unique
  BEFORE INSERT OR UPDATE OF email ON customer_users
  FOR EACH ROW EXECUTE FUNCTION app.assert_email_unique_across_actor_tables();

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

-- Now we can add the FK from job_status_history.attachment_id
ALTER TABLE job_status_history
  ADD CONSTRAINT fk_attachment
  FOREIGN KEY (attachment_id) REFERENCES attachments(id);

-- Polymorphic access check function — used by Storage RLS policies
-- The path scheme is: attachments/{tenant_id}/{entity_type}/{entity_id}/{filename}
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

-- Apply to the storage.objects policy in supabase/storage/policies.sql:
--   CREATE POLICY attachments_read ON storage.objects FOR SELECT
--     USING (bucket_id = 'attachments'
--            AND app.can_user_access_attachment_path(name));
```

### 3.4 Wave 2 schema additions

```sql
CREATE TABLE color_library (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  name                TEXT NOT NULL,
  color_system        TEXT CHECK (color_system IN ('RAL','Pantone','Custom')),
  code                TEXT,
  hex_preview         TEXT,
  manufacturer        TEXT,
  sku                 TEXT,
  archived_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE jobs ADD COLUMN color_library_id UUID REFERENCES color_library(id);

CREATE TABLE inventory_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  name                TEXT NOT NULL,
  sku                 TEXT,
  category            TEXT NOT NULL CHECK (category IN ('powder','masking','chemicals','consumables','other')),
  unit_type           TEXT NOT NULL CHECK (unit_type IN ('lbs','gallons','each','feet','sqft')),
  quantity_on_hand    NUMERIC(12,3) NOT NULL DEFAULT 0,
  reorder_level       NUMERIC(12,3),
  unit_cost           NUMERIC(12,2),
  supplier_name       TEXT,
  location            TEXT,
  qr_value            TEXT UNIQUE,
  color_library_id    UUID REFERENCES color_library(id),
  archived_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inventory_movements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  inventory_item_id   UUID NOT NULL REFERENCES inventory_items(id),
  job_id              UUID REFERENCES jobs(id),
  shop_employee_id    UUID REFERENCES shop_employees(id),
  movement_type       TEXT NOT NULL CHECK (movement_type IN ('consumption','restock','adjustment','damage','transfer')),
  quantity            NUMERIC(12,3) NOT NULL CHECK (quantity != 0),
  unit_cost_at_time   NUMERIC(12,2),
  reference           TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON inventory_movements (tenant_id, inventory_item_id, created_at DESC);

CREATE TABLE job_inventory_usage (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES tenants(id),
  job_id                   UUID NOT NULL REFERENCES jobs(id),
  inventory_item_id        UUID NOT NULL REFERENCES inventory_items(id),
  quantity                 NUMERIC(12,3) NOT NULL,
  unit_cost                NUMERIC(12,2),
  total_cost               NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  recorded_by_employee_id  UUID REFERENCES shop_employees(id),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE qc_inspections (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES tenants(id),
  job_id                   UUID NOT NULL REFERENCES jobs(id),
  inspector_employee_id    UUID NOT NULL REFERENCES shop_employees(id),
  inspected_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  result                   TEXT NOT NULL CHECK (result IN ('pass','fail','conditional')),
  defect_categories        TEXT[],
  defect_count             INT,
  severity                 TEXT CHECK (severity IN ('minor','major','critical')),
  requires_rework          BOOLEAN NOT NULL DEFAULT false,
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Now that qc_inspections exists, allow attachments to reference it.
ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_entity_type_check;
ALTER TABLE attachments ADD CONSTRAINT attachments_entity_type_check
  CHECK (entity_type IN ('job','company','contact','tenant_logo','employee_avatar','qc_inspection'));

CREATE TABLE alert_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  name            TEXT NOT NULL,
  rule_type       TEXT NOT NULL,  -- no CHECK; rule types defined in app code
  config          JSONB NOT NULL,
  severity        TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info','warning','critical')),
  notify_emails   TEXT[],
  notify_in_app   BOOLEAN NOT NULL DEFAULT true,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE alerts (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID NOT NULL REFERENCES tenants(id),
  rule_id                     UUID NOT NULL REFERENCES alert_rules(id),
  entity_type                 TEXT,
  entity_id                   UUID,
  message                     TEXT NOT NULL,
  severity                    TEXT NOT NULL CHECK (severity IN ('info','warning','critical')),
  triggered_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at             TIMESTAMPTZ,
  acknowledged_by_staff_id    UUID REFERENCES staff(id),
  resolved_at                 TIMESTAMPTZ,
  resolution_note             TEXT
);
CREATE INDEX ON alerts (tenant_id, acknowledged_at) WHERE acknowledged_at IS NULL;

CREATE TABLE notification_preferences (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  customer_user_id      UUID NOT NULL REFERENCES customer_users(id),
  email_on_received     BOOLEAN NOT NULL DEFAULT true,
  email_on_completed    BOOLEAN NOT NULL DEFAULT true,
  email_on_delay        BOOLEAN NOT NULL DEFAULT true,
  email_on_picked_up    BOOLEAN NOT NULL DEFAULT false,
  digest_frequency      TEXT NOT NULL DEFAULT 'off' CHECK (digest_frequency IN ('off','daily','weekly')),
  UNIQUE (customer_user_id)
);

CREATE TABLE notification_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  customer_user_id    UUID REFERENCES customer_users(id),
  job_id              UUID REFERENCES jobs(id),
  channel             TEXT NOT NULL CHECK (channel IN ('email','sms')),
  template_name       TEXT NOT NULL,
  subject_snapshot    TEXT,
  status              TEXT NOT NULL CHECK (status IN ('queued','sent','delivered','bounced','failed','unsubscribed')),
  provider            TEXT NOT NULL,  -- 'resend','postmark','twilio'
  provider_message_id TEXT,
  error_message       TEXT,
  sent_at             TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migration: customer_users multi-role
ALTER TABLE customer_users ADD COLUMN role TEXT NOT NULL DEFAULT 'admin'
  CHECK (role IN ('admin','viewer','accounting'));
```

### 3.5 Wave 3 schema additions

```sql
CREATE TABLE quotes (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID NOT NULL REFERENCES tenants(id),
  quote_number                TEXT NOT NULL,
  company_id                  UUID NOT NULL REFERENCES companies(id),
  contact_id                  UUID REFERENCES contacts(id),
  job_id                      UUID REFERENCES jobs(id),
  status                      TEXT NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','sent','approved','rejected','expired','revised')),
  subtotal                    NUMERIC(12,2),
  tax_rate                    NUMERIC(5,4),
  tax_amount                  NUMERIC(12,2),
  total_price                 NUMERIC(12,2),
  revision_of_quote_id        UUID REFERENCES quotes(id),
  valid_until                 DATE,
  sent_at                     TIMESTAMPTZ,
  approved_at                 TIMESTAMPTZ,
  expires_at                  TIMESTAMPTZ,
  created_by_staff_id         UUID REFERENCES staff(id),
  notes                       TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, quote_number)
);

CREATE TABLE quote_line_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  quote_id      UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  quantity      NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  unit          TEXT,
  unit_price    NUMERIC(12,2) NOT NULL,
  line_total    NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order    INT NOT NULL DEFAULT 0
);

CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  invoice_number  TEXT NOT NULL,
  company_id      UUID NOT NULL REFERENCES companies(id),
  job_id          UUID REFERENCES jobs(id),
  quote_id        UUID REFERENCES quotes(id),
  status          TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','sent','paid','partial','overdue','void')),
  subtotal        NUMERIC(12,2),
  tax_amount      NUMERIC(12,2),
  total_amount    NUMERIC(12,2),
  amount_paid     NUMERIC(12,2) NOT NULL DEFAULT 0,
  issued_at       TIMESTAMPTZ,
  due_at          TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, invoice_number)
);

CREATE TABLE invoice_line_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  invoice_id    UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  quantity      NUMERIC(12,3) NOT NULL,
  unit          TEXT,
  unit_price    NUMERIC(12,2) NOT NULL,
  line_total    NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order    INT NOT NULL DEFAULT 0
);

CREATE TABLE payment_records (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES tenants(id),
  invoice_id               UUID NOT NULL REFERENCES invoices(id),
  amount                   NUMERIC(12,2) NOT NULL,
  method                   TEXT NOT NULL CHECK (method IN ('check','card','ach','cash','other')),
  reference                TEXT,
  received_at              TIMESTAMPTZ NOT NULL,
  recorded_by_staff_id     UUID REFERENCES staff(id),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE job_public_tokens (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  job_id              UUID NOT NULL REFERENCES jobs(id),
  token               TEXT NOT NULL UNIQUE,  -- 32-char URL-safe random
  expires_at          TIMESTAMPTZ,
  view_count          INT NOT NULL DEFAULT 0,
  last_viewed_at      TIMESTAMPTZ,
  created_by_staff_id UUID REFERENCES staff(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE message_threads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  job_id          UUID NOT NULL REFERENCES jobs(id),
  subject         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  thread_id         UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  from_actor_type   TEXT NOT NULL CHECK (from_actor_type IN ('staff','customer')),
  from_actor_id     UUID NOT NULL,
  body              TEXT NOT NULL,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON messages (tenant_id, thread_id, created_at DESC);
```

### 3.6 Status state matrix

Valid `(intake_status, production_status)` combinations:

| intake_status | production_status | Meaning |
|---|---|---|
| `draft` | NULL | Office is creating/quoting; no parts yet |
| `scheduled` | NULL | Approved, parts arriving soon, packet printed |
| `in_production` | `received` | Parts physically here, scanned in |
| `in_production` | `prep` / `coating` / `curing` / `qc` | Active production |
| `in_production` | `completed` | Done, awaiting pickup |
| `in_production` | `picked_up` | Customer has them |
| `archived` | any | Soft-deleted (won't show in active lists) |

`on_hold` is orthogonal — any production stage can be flagged on hold without changing status.

### 3.7 Useful views

```sql
-- Single LATERAL join fetches the latest event once per job (vs 3 correlated subqueries).
-- Performance: O(N) instead of O(3N) lookups; uses the existing
-- (tenant_id, job_id, scanned_at DESC) index on job_status_history.
CREATE VIEW jobs_with_latest_event AS
SELECT j.*,
       h.scanned_at        AS last_scanned_at,
       h.shop_employee_id  AS last_scanned_by,
       h.workstation_id    AS last_scanned_at_workstation,
       EXTRACT(EPOCH FROM (now() - h.scanned_at)) / 3600 AS hours_in_current_stage
FROM jobs j
LEFT JOIN LATERAL (
  SELECT scanned_at, shop_employee_id, workstation_id
  FROM job_status_history
  WHERE job_id = j.id
  ORDER BY scanned_at DESC
  LIMIT 1
) h ON true;

CREATE VIEW customer_visible_timeline AS
SELECT * FROM job_status_history
WHERE customer_visible = true
  AND event_type IN ('stage_change','note','manual_transition');
-- RLS does the per-company filtering on top.
```

### 3.8 ON DELETE behavior summary

| FK | Behavior | Rationale |
|---|---|---|
| `jobs.company_id` → companies | RESTRICT | Block company hard-delete if jobs exist; archive instead |
| `jobs.contact_id` → contacts | SET NULL | Contact deactivation shouldn't break jobs |
| `job_status_history.shop_employee_id` → shop_employees | SET NULL | Show "Mike R. (no longer here)" in UI |
| `workstations.current_employee_id` → shop_employees | SET NULL | Auto-clear on employee removal |
| `workstations.auth_user_id` → auth.users | RESTRICT | Workstation auth user must exist; drop workstation first |
| `inventory_movements.job_id` → jobs | RESTRICT | Movements are audit; preserve |
| `customer_users.company_id` → companies | (cascade soft) | Set is_active=false; don't delete |
| `quote_line_items.quote_id` → quotes | CASCADE | Line items have no meaning without quote |
| `invoice_line_items.invoice_id` → invoices | CASCADE | Same |
| `messages.thread_id` → message_threads | CASCADE | Same |
| `tagged_entities.tag_id` → tags | CASCADE | Tag delete removes its applications |

### 3.9 Wave 4 schema additions (whitelabel + multi-vertical + agency super-admin)

Wave 4 introduces tables to support per-tenant configuration, custom domains, vertical workflow templates, and agency super-admin with consent-gated impersonation. All tenant-scoped tables are covered by the cross-tenant pgTAP RLS suite.

**`shop_settings` Wave 4 column additions** (extends existing per-tenant settings table; only NEW columns — Wave 1 already has timezone, currency, business_hours, logo_storage_path, brand_color_hex per §3.3):

```sql
ALTER TABLE shop_settings
  ADD COLUMN accent_color_hex    TEXT
    CHECK (accent_color_hex IS NULL OR accent_color_hex ~* '^#[0-9A-Fa-f]{6}$'),  -- secondary brand color
  ADD COLUMN email_from_name     TEXT,                       -- "ACME Coatings" — appears in From header
  ADD COLUMN email_from_address  TEXT,                       -- "noreply@acme.com" — verified via SPF/DKIM/DMARC
  ADD COLUMN module_toggles      JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {qc_inspections: true, color_library: false, ...}
  ADD COLUMN tax_settings        JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {tax_rate: 0.085, tax_id: "..."}
  ADD COLUMN vertical            TEXT NOT NULL DEFAULT 'powder_coating'
    CHECK (vertical IN ('powder_coating','sandblasting','media_blasting','galvanizing','plating','other'));

-- Note: working hours are stored in the existing Wave 1 `business_hours JSONB` column (no rename).
-- Note: timezone and currency already exist in Wave 1 with defaults 'America/New_York' and 'USD'
-- respectively. Wave 4 doesn't change them — tenants can update via the new admin UI.
-- Note: `is_first_job_created` (Wave 1) currently freezes timezone/currency once first job is
-- created. Wave 4 keeps this constraint; tenants who need to change these post-creation must
-- contact agency support (super-admin console can override via SECURITY DEFINER helper).
```

**`tenant_domains` Wave 4 column additions** — extends the Wave 1 `tenant_domains` table (§3.3) with SSL and verification tracking for custom domains. Wave 1 already has: `id, tenant_id, host (UNIQUE), audience CHECK ('staff','customer'), created_at`.

```sql
ALTER TABLE tenant_domains
  ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','verified','failed')),
  ADD COLUMN ssl_status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (ssl_status IN ('pending','valid','expiring','expired','failed')),
  ADD COLUMN ssl_expires_at      TIMESTAMPTZ,
  ADD COLUMN verified_at         TIMESTAMPTZ;

-- Wave 4 backfill: existing rows (Pops's app.popsindustrial.com, track.popsindustrial.com)
-- get verification_status='verified' and ssl_status='valid' as part of the migration.
-- Agency console (admin.<platform>.com) is NOT in tenant_domains — it's a platform-wide
-- domain, not per-tenant. Routed by proxy.ts via a hardcoded host check.
```

**`tenant_workflow_template` table** — per-vertical, tenant-customizable stage workflows:

```sql
CREATE TABLE tenant_workflow_template (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  vertical            TEXT NOT NULL,                              -- powder_coating, sandblasting, etc.
  name                TEXT NOT NULL,
  stages              JSONB NOT NULL,                             -- [{id, label, order, is_customer_visible, allow_rework_from}]
  version             INTEGER NOT NULL DEFAULT 1,
  is_default          BOOLEAN NOT NULL DEFAULT false,             -- the active template for new jobs in this tenant+vertical
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_by_staff_id  UUID REFERENCES staff(id),
  UNIQUE (tenant_id, name, version)
);
CREATE INDEX ON tenant_workflow_template (tenant_id, vertical);

-- Jobs lock to the template version they were created under (so existing jobs are stable when template edits happen)
ALTER TABLE jobs ADD COLUMN workflow_template_id UUID REFERENCES tenant_workflow_template(id);
ALTER TABLE jobs ADD COLUMN workflow_template_version INTEGER;
```

**`agency_users` table** — agency staff with cross-tenant access (NO `tenant_id` — agency users are cross-tenant by design; access to tenant data requires a valid `agency_consent_token`):

```sql
CREATE TABLE agency_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('agency_super_admin')),  -- Wave 4 ships with one role; expandable to ('agency_implementation','agency_support') later if operational tiers diverge
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**`agency_consent_token` table** — tenant-issued tokens authorizing agency impersonation:

```sql
CREATE TABLE agency_consent_token (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID NOT NULL REFERENCES tenants(id),
  issued_by_tenant_admin_id   UUID NOT NULL REFERENCES staff(id),
  issued_to_agency_user_id    UUID NOT NULL REFERENCES agency_users(id),
  token_hash                  TEXT NOT NULL UNIQUE,                  -- bcrypt hash of opaque token
  scope                       JSONB NOT NULL DEFAULT '{}'::jsonb,    -- {can_read: true, can_write: false, modules: [...]}
  expires_at                  TIMESTAMPTZ NOT NULL,                  -- typically now() + interval '4 hours'
  revoked_at                  TIMESTAMPTZ,
  used_at                     TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON agency_consent_token (tenant_id, expires_at) WHERE revoked_at IS NULL;
```

**`audit_log.acted_as_tenant_id`** — captures impersonation context on every audit entry:

```sql
ALTER TABLE audit_log ADD COLUMN acted_as_tenant_id UUID REFERENCES tenants(id);
-- Populated when audit entries are written during an agency impersonation session.
-- Audit RLS additions allow agency users to SELECT entries where acted_as_tenant_id matches tenants they have valid consent for.
```

**`app.has_consent_for()` SECURITY DEFINER helper** — used by Wave 4 RLS policies that allow cross-tenant agency reads:

```sql
CREATE OR REPLACE FUNCTION app.has_consent_for(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_agency_user_id UUID := app.agency_user_id();  -- helper reading JWT app_metadata.agency_user_id
BEGIN
  IF v_agency_user_id IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM agency_consent_token
    WHERE tenant_id = p_tenant_id
      AND issued_to_agency_user_id = v_agency_user_id
      AND expires_at > now()
      AND revoked_at IS NULL
  );
END $$;
```

**RLS policy highlights (Wave 4)**

- `tenant_domains` (Wave 4 expansion), `tenant_workflow_template`: tenant-scoped read; only `tenant_admin` role can mutate the Wave 4 columns
- `agency_users`: agency users SELECT only their own row; service-role inserts
- `agency_consent_token`:
  - tenant-side: `tenant_admin` can SELECT/INSERT/UPDATE for their own tenant
  - agency-side: agency users SELECT only tokens issued to them with `expires_at > now() AND revoked_at IS NULL`
- Cross-tenant agency reads: every RLS policy that needs to allow agency access adds `OR (app.audience() = 'staff_agency' AND app.has_consent_for(tenant_id))`
- `audit_log`: agency users can SELECT entries where `acted_as_tenant_id` matches a tenant they currently hold consent for

**pgTAP test priorities (Wave 4)** — see §9 for full coverage:

- `test_agency_super_admin_impersonation.sql` — consent token enforcement; audit log writes; session expiry; revocation
- `test_workflow_template_isolation.sql` — cross-tenant template invisibility; version locking on existing jobs after edit
- `test_tenant_domain_uniqueness.sql` — hostname conflicts blocked across tenants
- `test_module_toggle_enforcement.sql` — disabled modules return 403 at the Server Action level

**For full functional requirements**, see [PRD §6.17 (Tenant configuration)](../PRD.md#617-tenant-configuration--whitelabel-wave-4), [§6.18 (Vertical workflow templates)](../PRD.md#618-vertical-workflow-templates-wave-4), [§6.19 (Agency super-admin console)](../PRD.md#619-agency-super-admin-console-wave-4).

---

## 4. Module breakdown

### 4.1 Module map

| # | Module | Wave | Owns tables | Owns routes |
|---|---|---|---|---|
| 1 | `auth` | 1 | (uses `auth.users`; reads staff/customer_users/workstations) | `/sign-in`, `/sign-out`, `/forgot-password`, `/set-password`, `/auth/callback` |
| 2 | `crm` | 1 | `companies`, `contacts`, `activities` | `/(office)/companies/*` |
| 3 | `jobs` | 1 | `jobs` | `/(office)/jobs/*` |
| 4 | `packets` | 1 | (no tables) | `/(office)/jobs/[id]/packet` |
| 5 | `scanning` | 1 | (writes `job_status_history`; updates `workstations`) | `/(scan)/*` |
| 6 | `timeline` | 1 | `job_status_history` (read-mostly) | (UI components only) |
| 7 | `dashboard` | 1 | (reads everything) | `/(office)/` |
| 8 | `settings` | 1 | `shop_settings`, `staff`, `shop_employees`, `workstations`, `tenant_domains` | `/(office)/settings/*` |
| 9 | `portal` | 1 | (reads jobs, history via RLS) | `/(portal)/*` (track domain) |
| 10 | `tags` | 1 | `tags`, `tagged_entities` | embedded in entity pages |
| 11 | `inventory` | 2 | `inventory_items`, `inventory_movements`, `job_inventory_usage`, `color_library` | `/(office)/inventory/*` |
| 12 | `quality` | 2 | `qc_inspections` | `/(office)/jobs/[id]/qc` + scanner |
| 13 | `alerts` | 2 | `alert_rules`, `alerts` | `/(office)/alerts/*` |
| 14 | `notifications` | 2 | `notification_preferences`, `notification_log` | `/(portal)/settings/notifications` |
| 15 | `quotes` | 3 | `quotes`, `quote_line_items` | `/(office)/quotes/*` |
| 16 | `invoices` | 3 | `invoices`, `invoice_line_items`, `payment_records` | `/(office)/invoices/*` |
| 17 | `analytics` | 3 | (reads everything) | `/(office)/reports/*` |
| 18 | `public-tracking` | 3 | `job_public_tokens` | `/track/[token]` |
| 19 | `messaging` | 3 | `message_threads`, `messages` | embedded in job pages |
| 20 | `tenant-config` | 4 | `shop_settings` (Wave 4 cols), `tenant_domains` (Wave 4 cols) | `/(office)/settings/branding`, `/(office)/settings/domain`, `/(office)/settings/modules` |
| 21 | `workflow-templates` | 4 | `tenant_workflow_template` | `/(office)/settings/workflow` |
| 22 | `agency-console` | 4 | `agency_users`, `agency_consent_token` (reads cross-tenant config + audit log) | `/(agency)/*` (super-admin domain) |

### 4.2 Module file structure

```
src/modules/<name>/
├── index.ts              # public API barrel — only file other modules import
├── README.md             # what this module does
├── actions.ts            # Server Actions (writes)
├── queries.ts            # complex reads (server-side)
├── schemas.ts            # Zod validation schemas
├── types.ts              # local types (re-export from generated DB types where possible)
├── components/           # React components (server + client)
│   └── *.tsx
├── hooks/                # client-side hooks
│   └── *.ts
└── lib/                  # internal helpers — NEVER imported by other modules
    └── *.ts
```

### 4.3 Wave 1 module deep-specs

#### Module 1: `auth`

**Public API:**
- `signInStaff({email, password})` — Server Action with rate limit (5/hr per IP+email)
- `signOutStaff()` — Server Action
- `requestCustomerMagicLink({email, redirectTo?})` — Server Action with rate limit + anti-enumeration silent success
- `signOutCustomer()` — Server Action
- `requestPasswordReset(email)` — Server Action wrapping Supabase `resetPasswordForEmail`
- `requireOfficeStaff()` — server-side gate (throws if not authenticated as office)
- `requireShopStaff()` — server-side gate
- `requireCustomer()` — server-side gate
- `getCurrentClaims()` — returns `{ tenant_id, audience, role, company_id?, staff_id?, customer_user_id?, workstation_id? }`
- Components: `<SignInForm>`, `<MagicLinkRequestForm>`, `<SignOutButton>`, `<MagicLinkSentScreen>`, `<MagicLinkExpiredScreen>`, `<AccessRevokedScreen>`

**Critical responsibility — Auth Hook:**

A Postgres function `app.custom_access_token_hook(event jsonb) returns jsonb` runs on every token issuance. It:
1. Reads `event.user_id`
2. Looks up `auth.users` for email
3. Looks up linked staff/customer_users (linked-first by auth_user_id, fallback to email if not yet linked)
4. Returns `{claims: {...with app_metadata...}}` on success
5. Returns `{error: {http_code: 403, message: '...'}}` to reject
6. **Does NOT write to any tables** (causes deadlock per Supabase Issue #29073). The auth_user_id linking is done by a separate trigger.

Auth user → staff/customer linking is done by a synchronous AFTER INSERT trigger on `auth.users` (runs in the same transaction as the INSERT) — it finds the matching pre-provisioned staff/customer_users row by email AND tenant_id (passed via auth user's app_metadata at invite time) and sets auth_user_id. See §5.2 for full trigger code addressing multi-tenant email collisions.

**Required SQL grants** (canonical version — see §5.2 for the actual migration):
```sql
GRANT EXECUTE ON FUNCTION app.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION app.custom_access_token_hook FROM authenticated, anon, public;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON staff, customer_users, workstations TO supabase_auth_admin;
```

**BYPASSRLS dependency:** `supabase_auth_admin` has `BYPASSRLS` by default in Supabase, which is required for the Auth Hook to read staff/customer_users/workstations once those tables have RLS enabled. Do not modify this role's attributes. If you ever migrate off Supabase Auth, this assumption needs to be re-evaluated.

**Sessions:** all use `@supabase/ssr` cookie storage (httpOnly, secure, samesite=lax, scoped to host — separate cookies for `app.*` vs `track.*`). Office: 30-day refresh. Customer: 30-day refresh. Workstation: **1-hour refresh** (short window so a stolen tablet stops working quickly after `device_token` rotation; tablet re-authenticates silently using stored session as long as the synthetic Supabase user is still valid).

**Depends on:** `shared/db`, `shared/auth-helpers`, `shared/audit`, `shared/rate-limit`.

#### Module 2: `crm`

**Public API:**
- Company: `createCompany`, `updateCompany`, `archiveCompany`, `getCompanyById`, `listCompanies({search, archived})`
- Contact: `createContact`, `updateContact`, `setPrimaryContact`, `archiveContact`
- Activity: `logActivity({entity_type, entity_id, type, subject, body, customer_visible})`, `getActivitiesForEntity(type, id)`
- Components: `<CompanyList>`, `<CompanyDetail>`, `<CompanyForm>`, `<ContactPicker>`, `<ContactForm>`, `<ActivityFeed>`

**Owned routes:** `/(office)/companies/*`.

**Wave 2 additions:** bulk CSV import, dedupe warning on create.

**Depends on:** `shared/db`, `shared/storage`, `shared/audit`, `auth`.

#### Module 3: `jobs`

**Public API:**
- Lifecycle: `createJob({company_id, contact_id, ...})` (calls `app.next_job_number`), `updateJob`, `archiveJob`, `cloneJob(source_id)`, `scheduleJob(intake: draft → scheduled)`, `markInProduction(job_id)` (manual override; logs `event_type='manual_transition'`)
- Multi-color: `splitJobForMultiColor(parent_id, child_definitions[])` — only allowed when parent.intake_status IN ('draft','scheduled'); otherwise raises
- Holds: `placeOnHold(job_id, reason)`, `releaseFromHold(job_id)`
- Part counts: `recordPartCounts(job_id, {received?, completed?, damaged?, rework?})`
- Reads: `getJobById`, `getJobsByCompany`, `listJobs({intake?, production?, search?, due_before?, on_hold?, tag?})`
- Components: `<JobList>`, `<JobForm>`, `<JobDetail>` (timeline + parts panel + hold panel + child jobs panel), `<JobHoldDialog>`, `<MultiColorSplitter>`

**Owned routes:** `/(office)/jobs/*`.

**Critical convention:** Direct UPDATE of `jobs.production_status` is **forbidden** except via `record_scan_event()` (defense in depth: column-level grant revoked from staff role; enforced via `REVOKE UPDATE (production_status) ON jobs FROM authenticated`).

**Depends on:** `crm`, `packets`, `timeline`, `tags`, `shared/storage`, `shared/audit`.

#### Module 4: `packets`

**Public API:**
- `generatePacketPdf(job_id) → ReadableStream` — server action returning streamed PDF; caches to Supabase Storage by job_id, returns cached URL when not dirty
- `regenerateQrSvg(job_id) → string` — for inline display
- Components: `<PacketPreview>`, `<QrCodeImage>`, `<PrintablePacketLayout>` (React-PDF document)

**Owned routes:** `/(office)/jobs/[id]/packet`.

**Implementation specifics:**
- `qrcode` package, output **SVG**, error correction level **H** (30%)
- `@react-pdf/renderer` for PDF; lazy-loaded inside route handler (not at module top-level) to keep cold-start fast
- Logo loaded from `shop_settings.logo_storage_path` via Supabase Storage signed URL
- Last 8 chars of `packet_token` printed prominently below QR for manual entry fallback
- Stage checklist printed (Received | Prep | Coating | Curing | QC | Completed | Picked Up — boxes for shop staff to physically check)
- After job edit, sets `jobs.packet_dirty = true`. UI shows "needs reprint" badge. After successful PDF generation: `packet_dirty = false`.

**Depends on:** `jobs`, `shared/storage`.

#### Module 5: `scanning`

**Public API:**
- `enrollWorkstation(device_token)` — called from /(scan)/enroll; signs in as the per-workstation Supabase user
- `claimWorkstation({employee_id, pin})` — calls `app.validate_employee_pin()`; on success, optimistic-concurrency UPDATE on `workstations.current_employee_id` with version check
- `releaseWorkstation()` — clears `current_employee_id`
- `recordWorkstationHeartbeat()` — UPDATEs `workstations.last_activity_at` (called every 30s by tablet)
- `lookupJobByPacketToken(token_or_prefix)` — supports last-8-char prefix matching scoped to current tenant
- `recordScanEvent({packet_token, to_status, notes?, photo?})` — uploads photo if present, calls `record_scan_event()` SQL function; returns updated job state + conflict flag if someone else moved the job concurrently
- Components: `<WorkstationEnroll>`, `<EmployeePicker>` (tile grid + filter input if >12 employees), `<EmployeePinPad>`, `<CameraScanner>`, `<ManualPacketEntry>`, `<ScanResultPanel>`, `<StageTransitionButtons>`, `<HoldDialog>`, `<SwitchUserButton>`, `<OfflineBanner>`

**Owned routes:** `/(scan)/*` (boot, enroll, scanner, recent).

**Browser compatibility:** the scanner page works on **any modern browser** with `getUserMedia` + WebRTC support — iPad Safari (primary target), but also Chrome/Edge/Firefox on Windows/Mac for workstation PCs (per original PRD §12: "Accessible from: shop tablet, workstation computer, receiving desk"). Recommended hardware in §7.1 (operational concerns) is wall-mounted iPads, but a workstation PC with USB camera or a budget Android tablet will also work — anything that runs the PWA. Test matrix: iPad Safari, Chrome on Mac/Windows, Chrome on Android.

**PWA configuration:** `app/manifest.ts` registers PWA with start_url `/scan`, display `standalone`. Service worker scoped to `/scan/*` only (NOT `/(office)/*` or `/(portal)/*`).

**Offline mode:**
- Service worker caches scanner UI shell + last 50 jobs at this workstation + roster of shop_employees + workstation info
- Scan attempts when offline: queued in IndexedDB with tentative timestamps; UI shows "OFFLINE — N SCANS QUEUED" banner
- Photos compressed (canvas → JPEG **quality 0.7, max 1024px** longest edge) before storing — applies BOTH offline-queued and online uploads; max queue size 100 scans / 50MB
- iOS Safari has no Background Sync API → fallback: replay queue on next page load + foreground polling (every 30s while page active)
- Photos uploaded eagerly on reconnect before scan replay
- Conflict resolution UI: modal showing local vs server state, "apply", "discard", or "keep both"

**Critical PIN function:**

```sql
-- SECURITY DEFINER required: function does writes (UPDATE shop_employees) that
-- shop_staff RLS would block. Tenant validation happens via the p_tenant_id parameter,
-- which the calling server action MUST set from the authenticated user's JWT
-- (app.tenant_id()) — never from user input.
CREATE OR REPLACE FUNCTION app.validate_employee_pin(
  p_tenant_id UUID, p_employee_id UUID, p_pin TEXT
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_emp record; v_now TIMESTAMPTZ := now();
BEGIN
  SELECT id, pin_hash, failed_pin_attempts, locked_until, is_active, tenant_id
    INTO v_emp FROM shop_employees WHERE id = p_employee_id FOR UPDATE;

  IF v_emp.tenant_id != p_tenant_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'tenant_mismatch');
  END IF;
  IF NOT v_emp.is_active THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'inactive');
  END IF;
  IF v_emp.locked_until IS NOT NULL AND v_emp.locked_until > v_now THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'locked', 'until', v_emp.locked_until);
  END IF;

  IF crypt(p_pin, v_emp.pin_hash) = v_emp.pin_hash THEN
    UPDATE shop_employees SET failed_pin_attempts = 0, locked_until = NULL
      WHERE id = p_employee_id;
    RETURN jsonb_build_object('ok', true, 'employee_id', p_employee_id);
  ELSE
    UPDATE shop_employees
      SET failed_pin_attempts = v_emp.failed_pin_attempts + 1,
          locked_until = CASE WHEN v_emp.failed_pin_attempts + 1 >= 5
                              THEN v_now + interval '15 minutes' ELSE locked_until END
      WHERE id = p_employee_id;
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_pin',
                              'attempts_remaining', GREATEST(0, 4 - v_emp.failed_pin_attempts));
  END IF;
END;
$$;
```

**Workstation lifecycle wrapper functions** (also SECURITY DEFINER for the same reason):

```sql
-- Claim a workstation for an employee (per-shift mode). Optimistic concurrency via version.
CREATE OR REPLACE FUNCTION app.claim_workstation(
  p_workstation_id UUID, p_employee_id UUID, p_expected_version INT
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_caller_tenant UUID := app.tenant_id();
  v_caller_workstation UUID := app.workstation_id();
  v_emp_tenant UUID; v_ws_tenant UUID; v_new_version INT;
BEGIN
  IF app.audience() != 'staff_shop' THEN
    RAISE EXCEPTION 'access_denied: claim requires shop session';
  END IF;
  IF v_caller_workstation != p_workstation_id THEN
    RAISE EXCEPTION 'access_denied: can only claim own workstation';
  END IF;
  SELECT tenant_id INTO v_ws_tenant FROM workstations WHERE id = p_workstation_id;
  SELECT tenant_id INTO v_emp_tenant FROM shop_employees WHERE id = p_employee_id;
  IF v_ws_tenant IS NULL OR v_emp_tenant IS NULL
     OR v_ws_tenant != v_caller_tenant OR v_emp_tenant != v_caller_tenant THEN
    RAISE EXCEPTION 'access_denied: cross-tenant or missing entity';
  END IF;

  UPDATE workstations
    SET current_employee_id = p_employee_id,
        current_employee_id_set_at = now(),
        last_activity_at = now(),
        version = version + 1
    WHERE id = p_workstation_id
      AND version = p_expected_version
      AND (current_employee_id IS NULL
           OR last_activity_at < now() - make_interval(hours => (
             SELECT tablet_inactivity_hours FROM shop_settings WHERE tenant_id = v_caller_tenant
           )))
    RETURNING version INTO v_new_version;

  IF v_new_version IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'workstation_in_use_or_stale_version');
  END IF;
  RETURN jsonb_build_object('ok', true, 'version', v_new_version);
END;
$$;

-- Heartbeat keeps the workstation session alive (called every 30s by tablet).
CREATE OR REPLACE FUNCTION app.record_workstation_heartbeat() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ws_id UUID := app.workstation_id();
BEGIN
  IF app.audience() != 'staff_shop' OR v_ws_id IS NULL THEN
    RAISE EXCEPTION 'access_denied: heartbeat requires shop session';
  END IF;
  UPDATE workstations SET last_activity_at = now() WHERE id = v_ws_id;
END;
$$;

-- Release: explicit logout or auto-release.
CREATE OR REPLACE FUNCTION app.release_workstation() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ws_id UUID := app.workstation_id();
BEGIN
  IF app.audience() != 'staff_shop' OR v_ws_id IS NULL THEN
    RAISE EXCEPTION 'access_denied: release requires shop session';
  END IF;
  UPDATE workstations
    SET current_employee_id = NULL,
        current_employee_id_set_at = NULL,
        version = version + 1
    WHERE id = v_ws_id;
END;
$$;
```

**Critical scan event function:**

```sql
CREATE OR REPLACE FUNCTION app.record_scan_event(
  p_job_id UUID, p_to_status TEXT,
  p_employee_id UUID, p_workstation_id UUID,
  p_notes TEXT DEFAULT NULL, p_attachment_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID; v_from TEXT; v_tenant_id UUID;
  v_caller_tenant UUID := app.tenant_id();
  v_caller_audience TEXT := app.audience();
  v_emp_tenant UUID; v_ws_tenant UUID;
BEGIN
  IF v_caller_audience NOT IN ('staff_office','staff_shop') THEN
    RAISE EXCEPTION 'access_denied: scan requires staff session';
  END IF;

  SELECT tenant_id, production_status INTO v_tenant_id, v_from
    FROM jobs WHERE id = p_job_id;
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'job_not_found'; END IF;
  IF v_tenant_id != v_caller_tenant THEN
    RAISE EXCEPTION 'access_denied: cross-tenant scan blocked';
  END IF;

  SELECT tenant_id INTO v_emp_tenant FROM shop_employees WHERE id = p_employee_id;
  SELECT tenant_id INTO v_ws_tenant FROM workstations WHERE id = p_workstation_id;
  IF v_emp_tenant IS NULL THEN RAISE EXCEPTION 'employee_not_found'; END IF;
  IF v_ws_tenant IS NULL THEN RAISE EXCEPTION 'workstation_not_found'; END IF;
  IF v_emp_tenant != v_caller_tenant OR v_ws_tenant != v_caller_tenant THEN
    RAISE EXCEPTION 'access_denied: cross-tenant employee/workstation';
  END IF;

  INSERT INTO job_status_history
    (tenant_id, job_id, event_type, from_status, to_status,
     shop_employee_id, workstation_id, attachment_id, notes)
  VALUES
    (v_tenant_id, p_job_id, 'stage_change', v_from, p_to_status,
     p_employee_id, p_workstation_id, p_attachment_id, p_notes)
  RETURNING id INTO v_event_id;

  UPDATE jobs SET production_status = p_to_status,
                  intake_status = CASE WHEN intake_status='scheduled' THEN 'in_production'
                                       ELSE intake_status END,
                  picked_up_at = CASE WHEN p_to_status = 'picked_up' THEN now() ELSE picked_up_at END
    WHERE id = p_job_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Depends on:** `jobs`, `timeline`, `quality` (Wave 2), `shared/storage`.

#### Module 6: `timeline`

**Public API:**
- `getJobTimeline(job_id, {customer_visible_only?})`
- `getCurrentStageInfo(job_id) → {stage, since, duration_in_stage_seconds, last_actor}`
- `getJobsAtStage(stage)` — for kanban
- `getJobsStuckInStage(threshold_seconds)` — for alerts module dependency
- `getRecentActivity({limit, employee_id?, workstation_id?})`
- Components: `<JobTimeline>`, `<StageProgressBar>`, `<DurationBadge>`, `<ReworkBadge>`, `<UnusualTransitionBadge>`

**No owned routes** — pure component/query module.

**Depends on:** `shared/db`.

#### Module 7: `dashboard`

**Public API:**
- `getDashboardSnapshot()` → `{stages: {received: [jobs], prep: [...], ...}, overdue, on_hold, due_today}`
- `getRecentScans(limit=20)`
- Components: `<KanbanByStage>`, `<StatCards>`, `<RecentActivityFeed>`, `<OverdueJobsList>`, `<DueTodayPanel>`, `<DashboardFilters>` (company, due date, tag, priority)

**Realtime:** single shared subscription per browser tab via React Context, distributed to components that need it. Subscribes to `job_status_history` and `jobs` for the tenant.

**Owned route:** `/(office)/`.

**Depends on:** `jobs`, `timeline`, `crm`, `tags`, `shared/realtime`.

#### Module 8: `settings`

**Public API:**
- Shop settings: `updateShopSettings(...)`. Timezone/currency immutable once `is_first_job_created=true` (enforced at action layer).
- Staff: `inviteStaff({email, role, name})` (admin/manager only; pre-creates staff row, calls `auth.admin.inviteUserByEmail`), `updateStaffRole`, `deactivateStaff`, `resetStaffPassword`, `setStaffPin`
- Shop employees: `createShopEmployee({display_name, pin, avatar?})`, `resetShopEmployeePin(employee_id, new_pin)` (manager-only), `deactivateShopEmployee`
- Workstations: `createWorkstation({name, default_stage, location})` — also creates synthetic Supabase user + returns enrollment URL with QR; `regenerateDeviceToken(workstation_id)` (rotates Supabase user password, invalidates sessions); `deactivateWorkstation`
- Tenant domains: `addTenantDomain({host, audience})` (admin only)
- Components: `<SettingsForm>`, `<StaffList>`, `<InviteStaffDialog>`, `<ShopEmployeeRoster>`, `<PinSetDialog>`, `<WorkstationList>`, `<WorkstationEnrollmentQrDialog>`, `<AuditLogViewer>`

**Owned routes:** `/(office)/settings/*` (general, staff, employees, workstations, audit).

**Workstation creation flow:**
```typescript
async function createWorkstation({name, default_stage, location}) {
  await requireOfficeStaff();
  const tenant_id = (await getCurrentClaims()).tenant_id;
  const device_token = generateSecureRandom(48);
  const synthetic_email = `workstation-${crypto.randomUUID()}@workstations.${tenant.slug}.local`;

  // Insert workstation row FIRST (so we have the UUID for app_metadata)
  const { data: ws } = await supabase
    .from('workstations')
    .insert({tenant_id, name, default_stage, physical_location: location,
             device_token})
    .select().single();

  // Now create the synthetic Supabase user with the real workstation_id from the start
  // (Auth Hook reads workstation_id from claims; we don't want a 'pending' placeholder
  //  that could confuse the hook if anyone races to authenticate before the second update.)
  const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
    email: synthetic_email,
    password: device_token,
    email_confirm: true,
    app_metadata: {
      tenant_id,
      audience: 'staff_shop',
      workstation_id: ws.id,
      role: 'shop',
    },
  });

  // Link the synthetic auth user back to the workstation row
  await supabase
    .from('workstations')
    .update({auth_user_id: authUser.user.id})
    .eq('id', ws.id);

  await audit({entity_type: 'workstation', entity_id: ws.id, action: 'create'});
  return {workstation: ws, enrollment_url: `https://app.popsindustrial.com/scan/enroll?token=${device_token}`};
}
```

**Depends on:** `auth`, `shared/storage` (logo + avatars), `shared/audit`.

#### Module 9: `portal`

**Public API:**
- `getCustomerJobs({status_filter?, search?, page?})`
- `getCustomerJobDetail(job_id)`
- `getCustomerJobTimeline(job_id)`
- `inviteCustomer({company_id, email, name, contact_id?})` — office-initiated provisioning
- `sendInitialMagicLink(customer_user_id)` — admin-issued link
- Components: `<CustomerLayout>` (custom branding from shop_settings), `<CustomerJobList>`, `<CustomerJobCard>`, `<CustomerJobDetail>`, `<CustomerProgressTracker>`, `<CustomerTimeline>`, `<MagicLinkSentScreen>`, `<MagicLinkExpiredScreen>`, `<AccessRevokedScreen>`

**Realtime:** subscribes to status changes on customer's company's jobs for live updates.

**Owned routes:** `/(portal)/*` (rendered when host = `track.popsindustrial.com`):
- `/` — sign-in if not signed in, else dashboard
- `/jobs` — job list with filter/search (PRD §31: search by job_number, filter by status, filter by date)
- `/jobs/[id]` — job detail with timeline + visual progress bar (PRD §27 example: `Status: Coating | Progress: [██████░░░░] | Due: April 25`)
- `/account` — Account settings page (PRD §35) — edit name/email, manage notification preferences (Wave 2), download data (Wave 2+, GDPR/CCPA)
- `/auth/callback`

**Visual progress tracker spec** (PRD §28): shows the 7 stages horizontally with the current stage highlighted (Received → Prep → Coating → Curing → QC → Completed → Picked Up). Past stages: filled checkmark. Current: pulsing/highlighted. Future: greyed. Plus a thin progress bar showing % through current stage based on `duration_seconds` vs typical-stage-duration estimate.

**Depends on:** `auth`, `timeline`, `shared/realtime`.

#### Module 10: `tags`

**Public API:**
- `createTag({name, color_hex})`, `updateTag`, `deleteTag`
- `tagEntity(tag_id, entity_type, entity_id)`, `untagEntity(...)`, `getTagsForEntity(entity_type, entity_id)`
- `listTags()`
- Components: `<TagManager>`, `<TagPicker>`, `<TagBadge>`

**Depends on:** `shared/db`.

### 4.4 Shared infrastructure (`src/shared/`)

```
src/shared/
├── audit/
│   ├── index.ts          # withAudit() HOF
│   └── log.ts            # raw audit_log insert (uses service-role)
├── auth-helpers/
│   ├── require.ts        # requireOfficeStaff, etc.
│   └── claims.ts         # getCurrentClaims()
├── db/
│   ├── server.ts         # createClient() — async, cookies
│   ├── client.ts         # createBrowserClient()
│   ├── admin.ts          # createServiceClient() — restricted import
│   └── types.ts          # generated by supabase gen types
├── rate-limit/
│   ├── index.ts          # signInLimiter, magicLinkLimiter, scannerLimiter, publicLimiter
│   └── adapter.ts        # @upstash/ratelimit + Upstash Redis from Marketplace
├── realtime/
│   └── use-subscription.ts  # convenience hook for table subscriptions
├── storage/
│   ├── index.ts          # uploadAttachment, getSignedUrl, deleteAttachment
│   ├── policies.sql      # storage RLS via can_user_access_attachment_path()
│   └── components/       # FileUploadZone, AttachmentList, ImageGallery
└── ui/                   # shadcn components + custom shared
```

### 4.5 Cross-cutting concerns

| Concern | Where | How |
|---|---|---|
| Realtime updates | `shared/realtime` + module subscriptions | Supabase Realtime; one shared subscription per tab via Context |
| PDF generation | `packets`, `quotes`, `invoices` | `@react-pdf/renderer` lazy-loaded; cache to Storage by entity_id |
| QR generation | `packets`, `inventory` (Wave 2) | `qrcode` npm, **SVG** output, error correction **Level H** |
| QR scanning | `scanning` | `@zxing/browser` (works on iOS Safari; no native app needed) |
| Email sending | `notifications` (Wave 2) | Resend via Supabase custom SMTP for auth emails; Resend SDK for app emails |
| PWA manifest | `app/manifest.ts` | Scanner page only |
| Error tracking | All modules | Sentry from Week 1 (dev events tagged separately) |
| Validation | per-module `schemas.ts` | Zod on every Server Action input/output |
| Audit logging | `shared/audit` | `withAudit()` HOF wraps mutations |
| i18n | next-intl from Day 1 | English-only message files in `src/messages/en/*.json`, namespace per file |
| Rate limiting | `shared/rate-limit` + `proxy.ts` | `@upstash/ratelimit`; Upstash Redis via Vercel Marketplace |

### 4.6 Background workers (Supabase Edge Functions)

| Worker | Schedule | Purpose | Wave |
|---|---|---|---|
| `inactivity-sweeper` | hourly | Clear `workstations.current_employee_id` for tablets idle > N hours | 1 |
| `pin-lockout-cleanup` | every 5 min | Clear expired `shop_employees.locked_until` | 1 |
| `alerts-evaluator` | every 5 min | Run each `alert_rules.config`, insert triggered `alerts` | 2 |
| `notification-dispatcher` | every 1 min | Send queued emails from `notification_log` (status='queued') | 2 |
| `stuck-job-pinger` | hourly | Find jobs stuck > N hours, raise alert | 2 |
| `archive-aged-jobs` | daily | Auto-archive jobs `picked_up` > 90 days ago | 2 |

---

## 5. Auth flows

### 5.1 JWT claims (set by Auth Hook)

```json
{
  "iss": "https://abc.supabase.co/auth/v1",
  "sub": "auth-user-uuid",
  "email": "user@example.com",
  "app_metadata": {
    "tenant_id": "uuid",
    "audience": "staff_office | staff_shop | staff_agency | customer",
    "role": "admin | manager | office | shop | tenant_admin | agency_super_admin",  // staff/agency only
    "company_id": "uuid",                         // customer only
    "staff_id": "uuid",                           // staff only
    "customer_user_id": "uuid",                   // customer only
    "workstation_id": "uuid"                      // shop staff (workstation user) only
  },
  "exp": 1234567890,
  // Required claims preserved: iss, aud, exp, iat, sub, role, aal, session_id, email, phone, is_anonymous
}
```

### 5.2 Auth Hook implementation (Postgres function)

```sql
CREATE OR REPLACE FUNCTION app.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_user_id UUID := (event ->> 'user_id')::uuid;
  v_email TEXT;
  v_claims jsonb := event -> 'claims';
  v_app_meta jsonb;
  v_staff record; v_customer record; v_workstation record;
BEGIN
  -- Get email (Auth Hook can SELECT from auth.users; cannot UPDATE without deadlock)
  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  -- Try staff (linked-first, fallback to email-by-unlinked).
  -- ORDER BY ensures linked rows win over unlinked ones; created_at provides a deterministic
  -- tie-breaker if multiple unlinked rows match (multi-tenant email collisions).
  SELECT id, tenant_id, role, is_active INTO v_staff
    FROM staff
    WHERE auth_user_id = v_user_id
       OR (auth_user_id IS NULL AND email = v_email)
    ORDER BY (auth_user_id IS NOT NULL) DESC, created_at ASC
    LIMIT 1;

  IF v_staff.id IS NOT NULL THEN
    IF NOT v_staff.is_active THEN
      RETURN jsonb_build_object('error',
        jsonb_build_object('http_code', 403, 'message', 'Account inactive'));
    END IF;
    v_app_meta := jsonb_build_object(
      'tenant_id', v_staff.tenant_id,
      'audience', CASE WHEN v_staff.role = 'shop' THEN 'staff_shop' ELSE 'staff_office' END,
      'role', v_staff.role,
      'staff_id', v_staff.id
    );
    v_claims := jsonb_set(v_claims, '{app_metadata}',
                          COALESCE(v_claims -> 'app_metadata', '{}'::jsonb) || v_app_meta);
    RETURN jsonb_build_object('claims', v_claims);
  END IF;

  -- Try workstation (synthetic users)
  SELECT id, tenant_id INTO v_workstation
    FROM workstations
    WHERE auth_user_id = v_user_id AND is_active = true
    LIMIT 1;

  IF v_workstation.id IS NOT NULL THEN
    v_app_meta := jsonb_build_object(
      'tenant_id', v_workstation.tenant_id,
      'audience', 'staff_shop',
      'role', 'shop',
      'workstation_id', v_workstation.id
    );
    v_claims := jsonb_set(v_claims, '{app_metadata}',
                          COALESCE(v_claims -> 'app_metadata', '{}'::jsonb) || v_app_meta);
    RETURN jsonb_build_object('claims', v_claims);
  END IF;

  -- Try customer (same ordering rationale as staff)
  SELECT id, tenant_id, company_id, is_active INTO v_customer
    FROM customer_users
    WHERE auth_user_id = v_user_id
       OR (auth_user_id IS NULL AND email = v_email)
    ORDER BY (auth_user_id IS NOT NULL) DESC, created_at ASC
    LIMIT 1;

  IF v_customer.id IS NOT NULL THEN
    IF NOT v_customer.is_active THEN
      RETURN jsonb_build_object('error',
        jsonb_build_object('http_code', 403, 'message', 'Account inactive'));
    END IF;
    v_app_meta := jsonb_build_object(
      'tenant_id', v_customer.tenant_id,
      'audience', 'customer',
      'company_id', v_customer.company_id,
      'customer_user_id', v_customer.id
    );
    v_claims := jsonb_set(v_claims, '{app_metadata}',
                          COALESCE(v_claims -> 'app_metadata', '{}'::jsonb) || v_app_meta);
    RETURN jsonb_build_object('claims', v_claims);
  END IF;

  RETURN jsonb_build_object('error',
    jsonb_build_object('http_code', 403, 'message', 'Account not provisioned'));
END;
$$;

GRANT EXECUTE ON FUNCTION app.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION app.custom_access_token_hook FROM authenticated, anon, public;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON staff, customer_users, workstations TO supabase_auth_admin;
```

**Configuration:** Supabase Dashboard → Authentication → Hooks → Custom Access Token → Postgres function → select `app.custom_access_token_hook`.

**auth_user_id linking** (NOT inside the Auth Hook — synchronous AFTER INSERT trigger).

The naive "match by email" approach has a multi-tenant collision risk: the same email can exist in multiple tenants' `staff` or `customer_users` tables (the `staff` UNIQUE constraint is `(tenant_id, email)`, not just `email`). When auth.users gets a single row created via `inviteUserByEmail`, an unfiltered UPDATE could match multiple rows, then the `auth_user_id UUID UNIQUE` constraint raises a unique violation, the auth.users INSERT rolls back, and the invite fails for everyone with that email.

**Fix: pass `tenant_id` in the auth user's `app_metadata` at invite time, then filter on it in the trigger.** The `inviteStaff` and `inviteCustomer` server actions are the only paths that create new auth.users rows (other than seed) — they always know the target tenant. Set it in `app_metadata` before calling `auth.admin.inviteUserByEmail`.

```sql
CREATE OR REPLACE FUNCTION app.link_auth_user_to_actor()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id UUID := NULLIF(NEW.raw_app_meta_data ->> 'tenant_id', '')::uuid;
  v_intended_actor TEXT := NEW.raw_app_meta_data ->> 'intended_actor'; -- 'staff' | 'customer'
BEGIN
  -- Without tenant_id in metadata we cannot link safely. Fail loudly so the invite
  -- code path is forced to set it (and tests catch any regressions).
  IF v_tenant_id IS NULL THEN
    -- Allow service-role-created users without metadata to skip linking (e.g., workstation
    -- synthetic users that link via auth_user_id directly during createWorkstation, not via email).
    IF NEW.raw_app_meta_data ->> 'audience' = 'staff_shop' THEN RETURN NEW; END IF;
    RAISE EXCEPTION 'auth_user_created_without_tenant_id: invite code path must populate app_metadata.tenant_id';
  END IF;

  -- Linked-target-table approach: only update the table indicated by 'intended_actor'.
  IF v_intended_actor = 'staff' THEN
    UPDATE staff
      SET auth_user_id = NEW.id
      WHERE email = NEW.email AND tenant_id = v_tenant_id AND auth_user_id IS NULL;
  ELSIF v_intended_actor = 'customer' THEN
    UPDATE customer_users
      SET auth_user_id = NEW.id
      WHERE email = NEW.email AND tenant_id = v_tenant_id AND auth_user_id IS NULL;
  ELSE
    -- Neither flag set: try staff then customer, but tenant-scoped (still safe vs collisions).
    UPDATE staff SET auth_user_id = NEW.id
      WHERE email = NEW.email AND tenant_id = v_tenant_id AND auth_user_id IS NULL;
    IF NOT FOUND THEN
      UPDATE customer_users SET auth_user_id = NEW.id
        WHERE email = NEW.email AND tenant_id = v_tenant_id AND auth_user_id IS NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION app.link_auth_user_to_actor();
```

**Invite code paths must populate `app_metadata` with `tenant_id` and `intended_actor`:**

```typescript
// settings.inviteStaff
await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
  data: { name },
  // app_metadata is server-controlled; user can't override
  // (Note: Supabase admin API uses {data} for user_metadata; for app_metadata use the
  //  user-update-after-invite or pre-set in the staff/customer_users row trigger.
  //  In practice the invite path is: pre-create staff row → inviteUserByEmail → after
  //  acceptance, before first sign-in, run admin.updateUserById to stamp app_metadata.
  //  The Auth Hook reads from app_metadata. The link trigger here is the safety net.)
});
```

### 5.3 Office staff flows

**Initial admin onboarding** (one-time per tenant):
1. Run `scripts/seed-tenant.ts` → creates tenant, shop_settings, staff row {role='admin', is_active=true, auth_user_id=NULL}
2. Script calls `supabase.auth.admin.inviteUserByEmail(owner_email)`
3. Owner clicks invite link → sets password → auth.users created
4. Trigger links auth_user_id to staff row
5. Owner signs in → Auth Hook stamps claims → lands on `/(office)/`

**Inviting staff:**
- Admin/manager only (gated by `app.role()`)
- Pre-creates staff row, then `supabase.auth.admin.inviteUserByEmail`
- Cross-table email check (no email collisions with customer_users)

**Sign-in:**
- `/sign-in` page; rate limited 5/hr per (IP, email) via Upstash
- `getUser()` (not `getSession()`) on server side
- Wrong audience attempting wrong domain (e.g., staff JWT on track.* host) → `proxy.ts` redirects to correct domain

**Forgot password:**
- `/forgot-password` page calls `supabase.auth.resetPasswordForEmail(email, {redirectTo: '/set-password'})`

**Role change / deactivation:**
- Admin only; UPDATE staff + audit log + `supabase.auth.admin.signOut(auth_user_id)` to force fresh JWT within ~1hr or immediately

### 5.4 Shop floor flows

**Workstation enrollment** (one-time per tablet):
1. Admin: settings → "Add workstation" → returns `enrollment_url` containing `device_token`
2. Settings UI shows large QR
3. Admin walks tablet to workstation, opens app.popsindustrial.com → `/(scan)/enroll?token=...`
4. Tablet calls `enrollWorkstation(device_token)` → server signs in as the synthetic Supabase user with `password=device_token`
5. Tablet stores Supabase session via `@supabase/ssr` cookies
6. Subsequent boots: tablet has valid Supabase JWT scoped to staff_shop + workstation_id

**Token regeneration:**
- Admin generates new device_token → server updates synthetic user password + revokes existing sessions
- Old tablet's session fails next request → redirected to /enroll

**PIN session (per-shift mode, default):**
1. Tablet boot: shows `<EmployeePicker>` with tile grid (filter input if >12 employees)
2. Employee taps tile → `<EmployeePinPad>` for 4-digit PIN
3. `claimWorkstation({employee_id, pin})` calls `app.validate_employee_pin()` → on success, optimistic-concurrency UPDATE on `workstations.current_employee_id`
4. Employee scans jobs until: explicit logout, idle > `tablet_inactivity_hours` (default 4), or workstation token revoked

**Scan flow:**
1. Camera scanner reads QR → packet_token decoded
2. `lookupJobByPacketToken(token)` returns job snapshot
3. Tablet shows job + valid stage transition buttons
4. If wrong workstation (default_stage doesn't match expected next): warning dialog, requires explicit "yes, override" tap
5. Optional photo capture (canvas → JPEG q=0.7)
6. `recordScanEvent({packet_token, to_status, notes?, photo?})`:
   - Server validates workstation JWT
   - Validates employee active + not locked
   - Uploads photo to Storage if present
   - Calls `app.record_scan_event()` SQL function
   - Re-fetches job state, returns conflict flag if changed
7. Tablet UI: sound beep + green confirmation + new state shown (Vibration API not supported on iOS Safari)

**Offline mode:** see Module 5 Scanner spec above.

**Manual entry fallback:** input field accepts last 8 chars of packet_token; server resolves via prefix match within tenant.

### 5.5 Customer flows

**Provisioning** (office-initiated):
- Office: `inviteCustomer({company_id, email, name, contact_id?})` creates customer_users row
- Office triggers first email: `sendInitialMagicLink(customer_user_id)` calls `supabase.auth.admin.generateLink({type: 'magiclink', email, redirectTo: 'https://track.popsindustrial.com/auth/callback'})`

**Magic link request** (returning customer):
- `/sign-in` on track.popsindustrial.com → enter email
- Rate limit 5/hr per email, 10/hr per IP
- Look up customer_users:
  - Not found OR inactive: silent success (anti-enumeration)
  - Found + active: `supabase.auth.signInWithOtp({email, options: {emailRedirectTo: ..., shouldCreateUser: false}})`
- Show `<MagicLinkSentScreen>`

**Magic link callback:**
- `/auth/callback` exchanges token for session
- Auth Hook fires → claims set
- UPDATE customer_users.last_login_at
- Redirect to `/jobs`

**Magic link TTL: 1 hour** (configured in Supabase Dashboard, override default 24h for security).

**Session: 30-day refresh.**

**Mid-session deactivation:** Auth Hook rejects next refresh (≤1 hr) → forced sign-out + `<AccessRevokedScreen>`.

### 5.6 Cross-cutting

**Session cookies:** `@supabase/ssr` defaults to host-scoped cookies. `app.popsindustrial.com` and `track.popsindustrial.com` have separate cookies = separate auth pools. No `domain` override needed.

**MFA for admin:** deferred to Wave 2.

**Trusted device for customers:** deferred to Wave 2.

**Auth event audit logging:** every sign-in, invite, deactivation, role change, PIN reset, workstation enrollment, token regeneration, magic link request → `audit_log` row.

### 5.7 RLS policy template

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

-- Staff (office or shop) see all in tenant
CREATE POLICY <table>_staff_select ON <table> FOR SELECT
  USING (tenant_id = app.tenant_id()
         AND app.audience() IN ('staff_office', 'staff_shop'));

-- Customer (table-specific filter)
CREATE POLICY <table>_customer_select ON <table> FOR SELECT
  USING (tenant_id = app.tenant_id()
         AND app.audience() = 'customer'
         AND <table-specific customer filter>);

-- Office mutations
CREATE POLICY <table>_office_insert ON <table> FOR INSERT
  WITH CHECK (tenant_id = app.tenant_id()
              AND app.audience() = 'staff_office');

CREATE POLICY <table>_office_update ON <table> FOR UPDATE
  USING (tenant_id = app.tenant_id() AND app.audience() = 'staff_office')
  WITH CHECK (tenant_id = app.tenant_id());
```

**Per-table customer filters:**

| Table | Customer SELECT condition |
|---|---|
| `companies` | `id = app.company_id()` |
| `contacts` | `company_id = app.company_id()` |
| `jobs` | `company_id = app.company_id() AND archived_at IS NULL` |
| `job_status_history` | `customer_visible = true AND company_id = app.company_id()` |
| `attachments` | `customer_visible = true AND <entity-specific check via SQL function>` |
| `quotes` (Wave 3) | `company_id = app.company_id() AND status IN ('sent','approved')` |
| `invoices` (Wave 3) | `company_id = app.company_id()` |
| `messages` (Wave 3) | `tenant_id = app.tenant_id() AND thread_id IN (SELECT id FROM message_threads mt WHERE mt.tenant_id = app.tenant_id() AND job_id IN (SELECT id FROM jobs j WHERE j.tenant_id = app.tenant_id() AND j.company_id = app.company_id()))` (defense-in-depth tenant filter at every level) |

**No DELETE policies:** the RLS template above intentionally omits any DELETE policy. **Hard deletes are forbidden** for all authenticated users. All "delete" UX paths use the `archived_at` soft-delete pattern. The only path that can issue a real `DELETE` is the service-role client, used only by:
- GDPR/CCPA right-to-deletion requests (Wave 2+, manual SQL via `shared/audit/log.ts`)
- Admin-initiated tenant offboarding (Wave 3+, separate runbook)

This is a deliberate design choice: it preserves audit history, simplifies rollback, and prevents accidental data loss.

**Shop staff write access (special cases):**

Shop staff (per-workstation auth) need to UPDATE specific tables but the standard RLS template above only grants UPDATE to `staff_office`. The following operations are wrapped in `SECURITY DEFINER` functions that bypass RLS but enforce equivalent checks internally:

| Operation | Function | What it bypasses |
|---|---|---|
| Update `jobs.production_status` | `app.record_scan_event()` | Forbids direct UPDATE of `jobs.production_status` from any session (revoked at column level) |
| Update `workstations.current_employee_id` (PIN claim) | `app.claim_workstation()` | Lets shop session UPDATE workstation it's authenticated as |
| Update `workstations.last_activity_at` (heartbeat) | `app.record_workstation_heartbeat()` | Same |
| Clear `workstations.current_employee_id` (logout) | `app.release_workstation()` | Same |
| Update `shop_employees.failed_pin_attempts` and `locked_until` | `app.validate_employee_pin()` | Same |
| Increment `shop_settings.job_number_seq` | `app.next_job_number()` | Allows office session to update without granting raw UPDATE on shop_settings |

Each of these functions internally validates: caller's `app.workstation_id()` (or `app.staff_id()`) matches the row being modified, and tenant boundary enforced via `app.tenant_id()`. Pattern matches `record_scan_event` (see §5.2).

### 5.8 Wave 4 auth additions (whitelabel + agency super-admin)

Wave 4 adds a fourth audience and two new roles. Schema in §3.9; this section covers the auth flows and JWT-claim extensions.

**New audience:** `staff_agency` — the agency's Implementation Specialists and support staff. They authenticate via standard email+password against the `agency_users` table (NOT `staff` — `agency_users` has no `tenant_id` because they're cross-tenant by design). See §3.9 for table.

**New roles:**

- **`tenant_admin`** — staff role within a tenant. Same auth flow as office staff (email+password). Elevated permissions: branding, billing, user invites, workflow template editing, module toggles, custom domain, consent-token issuance.
- **`agency_super_admin`** — agency role within `agency_users`. JWT claim `audience: staff_agency`. Cross-tenant by default; `tenant_id` in JWT is NULL until impersonation is active. Read-only by default; consent token grants ephemeral cross-tenant access.

**Auth Hook expansion** (extends §5.2):

When a user signs in:

1. Hook checks `agency_users` first (matched by `auth_user_id`).
2. If found and active: issue JWT with `audience: 'staff_agency'`, `role: <agency_role>`, `agency_user_id: <uuid>`, `tenant_id: NULL`, `impersonating_tenant_id: NULL`.
3. Otherwise fall through to existing staff / customer / workstation flow (§5.2).

**Impersonation flow** (consent-gated cross-tenant access):

1. Agency super-admin requests support session for a tenant via `/(agency)/tenants/<id>/support`.
2. Backend sends in-app notification (and email) to all `tenant_admin`s for that tenant: "Agency support requested — approve to grant 4-hour access?"
3. A `tenant_admin` clicks "Approve" — backend creates an `agency_consent_token` row with `expires_at = now() + interval '4 hours'`.
4. Agency super-admin's session is upgraded — JWT refresh issues new token with `impersonating_tenant_id: <uuid>` claim.
5. RLS policies that allow cross-tenant agency access check `app.has_consent_for(tenant_id)` (SECURITY DEFINER helper, defined in §3.9).
6. Every read/write during the session is audit-logged with `acted_as_tenant_id` populated.
7. At expiry or revocation: impersonation context cleared on next JWT refresh; user sees only their cross-tenant agency view.

**Consent token revocation** — a `tenant_admin` can revoke an active token at any time:

```sql
UPDATE agency_consent_token
   SET revoked_at = now()
 WHERE id = $1 AND tenant_id = app.tenant_id();
```

The next agency JWT refresh checks `app.has_consent_for()` and finds no valid token → impersonation drops. Future enhancement (v1.1): mid-session revocation push via Realtime channel.

**JWT claims** — extension of v1 claims structure (§5.1):

```json
{
  "app_metadata": {
    "tenant_id": "uuid",                      // null for agency users not impersonating
    "audience": "staff_office | staff_shop | staff_agency | customer",
    "role": "admin | manager | office | shop | tenant_admin | agency_super_admin",
    "company_id": "uuid",                     // customer only
    "staff_id": "uuid",                       // staff only
    "customer_user_id": "uuid",               // customer only
    "workstation_id": "uuid",                 // shop staff only
    "agency_user_id": "uuid",                 // agency only (Wave 4)
    "impersonating_tenant_id": "uuid",        // agency users in active session (Wave 4)
    "consent_token_id": "uuid"                // tracks which consent token authorized session (Wave 4)
  }
}
```

**RLS policy pattern for cross-tenant agency reads:**

```sql
-- Example: allow agency super-admin to SELECT companies during an active consent session
CREATE POLICY companies_agency_select ON companies FOR SELECT
  USING (
    -- Existing tenant policy (staff/customer)
    (tenant_id = app.tenant_id())
    OR
    -- Wave 4: agency super-admin with valid consent token
    (app.audience() = 'staff_agency' AND app.has_consent_for(tenant_id))
  );
```

This pattern applies to every table that agency staff need to read for support (companies, contacts, jobs, job_status_history, etc.). It does NOT apply to `audit_log`, which has its own pattern using `acted_as_tenant_id`.

**For full functional requirements** see [PRD §6.19 (Agency super-admin console)](../PRD.md#619-agency-super-admin-console-wave-4); for the schema and helper definition see §3.9.

---

## 6. Phased roadmap

### 6.1 Roadmap overview

```
Wave 1: Internal MVP + Customer Portal     Weeks 1-12   (~12 weeks)
Wave 1 ship gate                            Week 13
Rest week                                   Week 14
Wave 2: Inventory + Alerts + Multi-role    Weeks 15-20  (~6 weeks)
Wave 3: Quotes + Invoices + Analytics      Weeks 21-28  (~8 weeks)
Wave 4: Whitelabel + Tenant 2 onboarding   Weeks 29-36  (~8 weeks)
                                            ─────────────
                                            Total: ~36 weeks (~8.5 months)
                                            Compressed (parallel agents): ~28-32 weeks

Pops uses the system from Week 13 as Tenant 1. Their feedback shapes Waves 2-4.
Tenant 2 (sandblasting) onboards in Wave 4 — first whitelabel install.
```

**Assumptions:** solo, full-time (40 hr/week), no hard deadline, Pops's owner available within 24h Q&A throughout, test iPad in dev's hands by Week 6.

### 6.2 Week 0: Pre-flight (~2-3 days)

- Verify `popsindustrial.com` is available; register or transfer
- Vercel account + Pro plan upfront ($20/mo for serverless function timeouts)
- Supabase account + Pro plan upfront ($25/mo for backups + branch DBs + PITR)
- Resend account + verify sending domain
- Sentry account
- Upstash Redis via Vercel Marketplace (free tier)
- Order test iPad + confirm hardware list with Pops's owner
- Initial brand (logo, colors) — outsource to designer if needed; placeholder OK
- WiFi survey at Pops's shop floor — measure signal at every workstation
- Identify Pops's IT contact; confirm hardware order placement
- DNS records: configure `popsindustrial.com`, `app.popsindustrial.com`, `track.popsindustrial.com` (CNAMEs to Vercel; placeholder allowed)
- Commercial agreement (MSA) with Pops's owner — terms, IP, scope, payment
- Stakeholder check-in cadence agreed: Weeks 5, 8, 10 demos

### 6.3 Wave 1 (Weeks 1-12)

**Week 1: Foundation**
- Days 1-2: Repo setup. Next.js 16 + Tailwind v4 + shadcn/ui + TypeScript strict + ESLint with `no-restricted-imports` + Prettier + lint-staged + Husky + Vercel CLI link + first deploy. `next-intl` from Day 1 (English-only). Spike: camera-based QR scanner on real iPad (proof it works on iOS Safari).
- Days 3-4: Supabase Pro project + branch DB workflow setup. First migrations: tenants, shop_settings, audit_log, app schema with helper functions. `@supabase/ssr` server/client/admin clients. pgtap installed.
- Day 4: `shared/rate-limit/` utility built on `@upstash/ratelimit` + Upstash via Marketplace.
- Day 5: Email infrastructure. Resend SMTP credentials → Supabase Auth. SPF + DKIM + DMARC DNS records. Test invites to Gmail/Outlook/iCloud. `proxy.ts` skeleton with host detection. Sentry integrated (dev events tagged).

**Week 2: Auth foundation**
- Days 1-3: Migrations: staff, shop_employees, workstations, cross-table email triggers. Postgres `app.custom_access_token_hook`. Configure in Dashboard. Auth Hook trigger for auth_user_id linking on auth.users INSERT. pgtap tests for hook behavior.
- Days 4-5: Office sign-in + invite. Server actions: signInStaff, signOutStaff, inviteStaff, requestPasswordReset. Forgot-password flow. `/set-password` page. Cross-domain audience redirect in `proxy.ts`. `withAudit()` HOF for audit log writes.

**Week 3: CRM + Settings**
- Days 1-2: Settings module — shop_settings form, staff list/invite/deactivate, audit log viewer.
- Days 3-5: CRM module — companies, contacts, activities. Bulk import deferred. RLS policies + pgtap tests.

**Week 4: Tags + Jobs core**
- Day 1: Tags module — tags, tagged_entities, basic UI.
- Days 2-5: Jobs module — jobs migration, app.next_job_number function, intake_status lifecycle, splitJobForMultiColor, holds, cloneJob. Job list with filters. Job detail page (read-only timeline placeholder).

**Week 5: Packets + Storage**
- Days 1-3: Packets module. @react-pdf/renderer setup, lazy-loaded. qrcode SVG output, error correction H. packet_token generation (16 chars URL-safe random). PDF caching to Storage by job_id. packet_dirty flag on edit.
- Days 4-5: `shared/storage` module. Polymorphic uploads, size/mime restrictions (25MB max), Storage RLS via `can_user_access_attachment_path()` SQL function. Image transformations via Supabase CDN.

**Week 6: Workstation enrollment + Scanner shell**
- Days 1-2: Workstation enrollment ceremony. settings.createWorkstation creates synthetic Supabase user + returns enrollment QR. Token regeneration flow.
- Days 3-5: Scanner shell. /(scan)/enroll page. EmployeePinPad. app.validate_employee_pin (atomic with row lock). Optimistic concurrency on workstation claim. Switch user button. Inactivity heartbeat (30s).

**Week 7: Camera scanner + Scan event**
- Days 1-2: Migration: job_status_history with denormalized company_id + triggers (set_history_company_id, compute_status_event_metadata). app.record_scan_event SQL function with full tenant validation.
- Days 3-5: @zxing/browser camera integration. ScanResultPanel. StageTransitionButtons. Manual packet token entry (last 8 chars prefix matching). HoldDialog. Wrong-station warning. Concurrent scan handling. Snap-photo-at-scan.

**Week 8: Timeline + Dashboard**
- Days 1-2: Timeline module. getJobTimeline, StageProgressBar, DurationBadge, ReworkBadge.
- Days 3-5: Dashboard module. KanbanByStage, StatCards, filters, RecentActivityFeed. Single shared Realtime subscription per tab via Context.

**Week 9: Customer portal**
- Days 1-2: Multi-domain confirmed in proxy.ts (was scaffolded Week 1). DNS for `track.popsindustrial.com` confirmed live. Vercel domain attached. portal.requestCustomerMagicLink with rate limit + anti-enumeration. portal.inviteCustomer + sendInitialMagicLink.
- Days 3-5: Portal UI. CustomerLayout with brand. CustomerJobList. CustomerJobDetail with progress tracker + customer-visible timeline. Magic link sent/expired/revoked screens. Realtime subscription per tab.

**Week 10: Offline mode**
- Days 1-5: Service worker scoped to /(scan)/. IndexedDB queue. Photo compression. iOS Safari Background Sync API absent → fallback to foreground polling. Conflict resolution UI. Queue size cap. Eager photo upload on reconnect.

**Week 11: Polish + Pre-prod testing**
- Days 1-2: Empty states, loading states, error boundaries everywhere. 404/500 pages with brand. Toast notifications (sonner). Touch target audit on iPad. Dark mode in scanner UI.
- Days 3-5: Test consolidation. pgtap RLS suite (cross-tenant, audience, function authorization, inactive user). Vitest unit tests for server actions. Playwright E2E for critical flows. Backup drill.

**Week 12: Production deploy + Pops onboarding**
- Day 1: Production Supabase project. Production Vercel deploy. Custom SMTP verified in production. Sentry production project. Backup verification.
- Days 2-5: Pops onboarding. Run scripts/seed-tenant.ts. Configure shop_settings (logo, hours, etc.). Create real workstations. Print enrollment QRs, walk to each tablet, enroll. Create real shop_employees with PINs. Train office staff (~0.5 day). Train shop staff per shift (~1 day). Live observation Day 4-5. Fix issues.

**Week 13: Wave 1 ship gate**
- 3 production days minimum (criteria below)
- If gate criteria fail: extend Wave 1, don't start Wave 2 with debt

### 6.4 Wave 1 ship gate criteria

- [ ] Pops has used it for 3 full production days
- [ ] No P0 bugs (data loss, cross-tenant leak, can't scan)
- [ ] At least 1 multi-color job successfully tracked
- [ ] At least 1 rework loop successfully tracked (job back to prep)
- [ ] At least 1 customer has signed in to the portal
- [ ] Backups verified (restore drill executed)
- [ ] <5 Sentry errors over 3 days (excluding known unactionable)
- [ ] Pops's owner says "yes, this is better than what we had"

### 6.4.1 Deferred features from original v1 PRD (post-Wave 4 / future versions)

The original v1 PRD (archived at `docs/archive/original-prd.md`) listed several capabilities as "future" or "optional later" that are intentionally **out of scope through Wave 3** but cataloged here so they're not lost:

| PRD ref | Feature | Status | When |
|---|---|---|---|
| PRD §10 | **Employee badge scanning** (RFID/NFC/printed barcode) — alternative attribution to PIN tap (scan badge + scan QR) | Deferred | v1.1+ enhancement; only if Pops asks. Architecture supports it: add `badge_value` column to `shop_employees`, add badge-scan input mode to scanner UI alongside PIN |
| PRD §20 | **Rack labels** — printable QR labels for racks holding parts in transit | Deferred | Wave 5+ / v2.0+; useful when shop scales to >50 concurrent jobs. Adds `racks` table + label PDF templates. (Note: Wave 4 is whitelabel; rack/bin/pallet labels were renumbered Wave 5+ to avoid confusion.) |
| PRD §20 | **Bin labels** — printable QR labels for bins (small parts batches) | Deferred | Same as racks; bundle together |
| PRD §20 | **Pallet labels** — printable QR labels for outgoing shipments | Deferred | Wave 5+ / v2.0+; pairs with shipping integration |
| PRD §20 | **Inventory QR labels** — printable QR for inventory items | **Already supported** in Wave 2: `inventory_items.qr_value` column exists; just needs a label PDF template (small Wave 2 enhancement) |
| PRD §30 | **SMS notifications** (Twilio) — alternative channel for delay alerts, completion, etc. | Deferred | Wave 3.5 / v1.5; `notification_log.channel` already supports `'sms'`. Add Twilio adapter behind the existing `sendNotification()` interface |
| PRD §30 | **Push notifications** (web push or native app) | Deferred | Requires native mobile app (see below). Web Push API works on Chrome but not iOS Safari without a PWA install + iOS 16.4+ |
| PRD implicit | **Native mobile app** (iOS/Android) — implied by "Push (future app)" | Deferred indefinitely | The PWA already covers most native-app needs. Build native only if iOS Safari limitations (offline, push, camera) become deal-breakers |

These are documented here so they can be:
- Mentioned to Pops if they ask "what's coming next?"
- Added to a `BACKLOG.md` for prioritization conversations
- Architected-around (the data model already supports most of them)

### 6.5 Week 14: Rest week

Intentional decompression. Backlog grooming. Pops feedback intake. No code.

### 6.6 Wave 2 (Weeks 15-20)

- Weeks 15-16: Inventory module (color_library, inventory_items, movements, usage). Integration with scanning (consumption prompt at coating stage).
- Week 17: Quality module (qc_inspections). Scanner integration.
- Weeks 18-19: Alerts module + Notifications module. Resend integration. Edge Functions for cron workers.
- Week 20: Multi-role customer portal. Migration: customer_users.role column. Customer admin invite flow. Permission filters. Wave 2 ship gate.

### 6.7 Wave 3 (Weeks 21-28)

- Weeks 21-22: Quotes module. PDF + line items + send/approve/revise.
- Weeks 23-24: Invoices + Payments. (Stripe deferred unless Pops needs it; if yes, +1 week)
- Week 25: Analytics dashboards. Recharts.
- Week 26: Public tracking module.
- Week 27: Messaging module.
- Week 28: Polish + Wave 3 ship gate (Pops fully migrated; platform proven on a single tenant).

### 6.8 Wave 4 (Weeks 29-36) — Whitelabel + Tenant 2 onboarding

**Goal:** make the platform whitelabel-ready and onboard Tenant 2 (sandblasting). Validates multi-vertical and multi-tenant architecture end-to-end.

**Weeks 29-30: Tenant configuration & whitelabel foundation**
- Migration: `shop_settings` Wave 4 column expansions (accent_color_hex, email_from_name, email_from_address, module_toggles JSONB, tax_settings JSONB, vertical — only NEW columns; existing timezone/currency/business_hours reused from Wave 1). `tenant_domains` Wave 4 column additions (verification_status, ssl_status, ssl_expires_at, verified_at — extends existing Wave 1 table; see §3.9). Audit_log enum additions per §3.3.
- Module 20 `tenant-config` (per module map §4.1) — branding upload, domain registration, module toggle, working-hours edit. CSS-variable-based theming injected at app shell.
- `proxy.ts` generalization — host header → `tenant_domains` lookup → set tenant context. Fallback to `<tenant>.<platform>.com` subdomain when no custom domain. Hardcoded check for `admin.<platform>.com` → agency audience.
- Vercel multi-domain provisioning UX (admin instructions: add CNAME; SSL auto-issues; surface verification state).
- Email-from per tenant: SPF/DKIM/DMARC verification UI; Resend domain attachment via API.
- pgTAP tests: cross-tenant config isolation; `tenant_domains` uniqueness across tenants; theming scoping.

**Weeks 31-32: Vertical workflow templates**
- Migration: `tenant_workflow_template` table (id, tenant_id, vertical, name, stages JSONB[], version, is_default, created_at, edited_by). Default templates seeded for: powder_coating, sandblasting, media_blasting, galvanizing, plating, other.
- Module 21 `workflow-templates` (per module map §4.1) — clone-default, edit-stages (rename/reorder/add/remove), set-default-for-tenant. Stage JSON schema: `{ id, label, order, is_customer_visible, allow_rework_from }`.
- Workflow versioning: each edit increments version. Existing jobs lock to original `workflow_template_version`; new jobs use latest.
- Stage-rename: display label changes; internal stage codes stable for analytics consistency.
- Job creation UI: tenants pick a stage from their tenant-customized workflow.
- pgTAP tests: cross-tenant template isolation; jobs locked to old version after template edit; default template seeded correctly per vertical.

**Weeks 33-34: Agency super-admin console**
- Migration: `agency_consent_token` table (id, tenant_id, issued_by_tenant_admin_id, agency_user_id, expires_at, revoked_at, created_at). `agency_users` table (separate from `staff` because cross-tenant). Audit_log expansion: `acted_as_tenant_id` field.
- Module 22 `agency-console` (per module map §4.1) — cross-tenant view (config + health, no data without impersonation), impersonation session start/end (consent-token-gated), audit-log query (cross-tenant), bulk feature flag rollouts, billing overview.
- Auth: new `audience: staff_agency` + `role: agency_super_admin`. Auth Hook detects agency users; sets impersonation context if consent token valid + non-expired + non-revoked.
- Tenant impersonation flow: tenant_admin issues a consent token via UI → 4-hour session → all reads/writes audit-logged with `acted_as_tenant_id`.
- Tenant lifecycle states UI: Healthy / At-risk / Stale / Off-platform (per PRD Appendix D.3).
- pgTAP tests: agency role access without consent token blocked; consent token enforcement at DB level; impersonation audit-log entries written; session expiry; revocation respected.

**Weeks 35-36: Tenant 2 (sandblasting) onboarding + Wave 4 polish**
- Run `scripts/seed-tenant.ts` for Tenant 2.
- Configure Tenant 2: brand, logo, custom domain, sandblasting workflow template (clone default), email-from identity.
- Workstation enrollment ceremony at Tenant 2's shop (in person or remote).
- Office + shop staff training; pilot run weeks 5-6 of Tenant 2's onboarding playbook (PRD Appendix D.1).
- Cutover: paper tracking → platform.
- Whitelabel checklist (PRD Appendix E) signed off.
- Wave 4 ship gate (criteria below).

### 6.9 Wave 4 ship gate criteria

- [ ] Tenant 2 (sandblasting shop) successfully onboarded and using the platform
- [ ] Tenant 2 running 14+ days with daily scans
- [ ] Tenant 2's custom domain green (SSL valid, DNS verified, transactional email deliverable to Gmail / Outlook / iCloud)
- [ ] Tenant 2's workflow template successfully clones from sandblasting default + tenant-specific tweaks
- [ ] Cross-tenant RLS verified end-to-end — Tenant 2 cannot see any of Pops's data; Pops cannot see any of Tenant 2's data
- [ ] Super-admin console used to support at least 1 ticket without breaking RLS (consent token + audit log entry verified)
- [ ] Onboarding playbook (PRD Appendix D.1) executed end-to-end and refined based on Tenant 2 friction points
- [ ] No P0 bugs (data loss, cross-tenant leak, can't scan) for either tenant
- [ ] Tenant 2 admin says "yes, this is better than what we had"

---

## 7. Operational Concerns

This section captures the operational realities that surround the codebase: hardware procurement, IT setup at Pops's facility, legal/IP considerations, disaster recovery, on-call coverage, backup strategy, bus factor mitigation, training, and maintenance windows. Each of these is load-bearing — a missed step here can sink a launch even if the code is perfect.

### 7.1 Hardware Procurement Plan

The shop floor experience depends entirely on physical iPads being where they need to be, mounted, charged, and on the network. Procurement must start early because lead times stack: order iPads, wait for delivery, order brackets, wait, install brackets, wire power/network, mount tablets, validate.

**iPad inventory**

Five production tablets are required for Wave 1, one per workstation:

- **Receiving** — used for initial intake QR generation and first scan
- **Prep** — sandblasting, masking, surface treatment
- **Coating Booth 1** — powder application
- **Curing Oven** — load/unload tracking
- **QC Inspection** — final inspection, snap photos, pass/fail

Plus **one spare** kept boxed in the office for immediate failure replacement, bringing the total to **six iPads**.

Recommended model: standard 10th-generation iPad (A14 Bionic, 64 GB, WiFi only). Cellular is unnecessary because the shop has WiFi (see §7.2). Purchase from Apple Business directly to enroll in Apple Business Manager from day one, or B&H Photo as a backup if Apple direct lead times are unacceptable. Unit cost: $400–500 each. Lead time: 1–3 business days from Apple Business, 1–2 days from B&H.

**Wall mounts and brackets**

Each tablet must be mounted in a lockable, theft-resistant bracket with a cable pass-through for power. Recommended brands:

- **Heckler Design** — premium, secure, cable management built in. ~$120 each.
- **Maclocks (Compulocks)** — solid mid-range, screw-locked enclosures. ~$80 each.
- **Generic Amazon brands** — avoid for production; use only as a temporary fallback.

Budget **$80 per mount** as the minimum viable spend; spec Heckler if Pops wants the more polished install. Lead time: 3–7 business days from Amazon, 5–10 days direct from Heckler.

**Cable runs (power and optional Ethernet)**

Each workstation needs:

- A nearby 110V outlet on a circuit that won't be killed by the booth's fan motors or oven contactors
- A USB-C power supply (use Apple's 20W minimum) wired through the bracket pass-through
- Optional: hardwired Ethernet via Lightning/USB-C-to-Ethernet adapter if WiFi survey results are marginal at any workstation

Pops's electrician handles outlet additions and conduit runs. Lead time variable — schedule during Week 1–4 so installation is complete by Week 8. Budget conservatively: **$500–1,500** depending on how many new outlets are needed.

**Procurement timeline**

| Week | Action |
| --- | --- |
| 0 | Confirm with Pops which workstations need tablets; finalize bracket selection |
| 1 | Order one development iPad (in dev's hands by Week 2) |
| 4 | Order remaining 5 production iPads + 6 brackets + cables |
| 5 | Schedule electrician work for any new outlets |
| 6 | Dev tests dev iPad with kiosk mode and PWA install — validate before bulk order works |
| 8 | Brackets and tablets on-site at Pops; electrician finishes any outlet work |
| 9–10 | Mount tablets, wire power, enroll in MDM, install PWA |
| 11 | All five production stations live for QA week |

**Procurement risks**

- Apple iPad supply can spike during product transition cycles (typically September–November). Order early.
- Brackets occasionally back-order. Have a fallback brand identified.
- If electrician is booked out, schedule the visit by Week 1 even if the work isn't until Week 8.

### 7.2 Pops's IT Setup (Hidden Dependencies)

These are not coding tasks, but they will block the launch if missed. Treat them as Week 0 deliverables.

**Identify the IT contact**

Pops likely has no dedicated IT staff. The owner is probably the de facto IT contact, possibly with an external consultant on retainer. Identify this person in **Week 0**, get them in writing as the point of contact for:

- WiFi credentials and router admin access
- DNS records (for `popsindustrial.com`)
- Apple ID / Apple Business Manager organizational account
- Email infrastructure decisions
- Future MDM enrollment

If the owner is the contact and is non-technical, schedule a 30-minute setup call during Week 0 to walk through what credentials we'll need.

**WiFi survey at the shop**

Coating shops are radio-hostile environments: large metal ovens, metal racks, fans, exhaust ductwork, and concrete walls all degrade 2.4 GHz and 5 GHz signal. Conduct a survey in **Week 0**:

- Walk every planned workstation with an iPhone or iPad running a WiFi analyzer (e.g., Airport Utility's scan mode, NetSpot)
- Measure RSSI; anything weaker than **-67 dBm** is marginal for sustained use
- Note dead zones; these are candidates for a wired drop or a mesh node

If signal is poor, plan a WiFi upgrade alongside the project. **Recommended: Ubiquiti UniFi** (U6-Lite or U6-Pro access points, $99–199 each) with a UDM-SE or USG router. Deploy 2–3 APs depending on shop layout. Total budget: **$500–1,200** for hardware plus a half-day install.

**iPad management (MDM)**

Production tablets must be locked down to a single PWA — they cannot be allowed to browse the open web, install apps, or be repurposed by a curious employee.

- Enroll in **Apple Business Manager** (free, requires a D-U-N-S number for the business — get it now if Pops doesn't have one)
- Choose an MDM:
  - **Apple Configurator** — free, manual, fine for 5 devices but tedious
  - **Jamf School** (free for under 100 devices) — overkill for a powder shop but offers proper Single App Mode (kiosk mode), guided access, restricted Safari
  - **Mosyle Manager** — free tier available, well-suited for small deployments
- Configure each iPad:
  - Single App Mode pinned to Safari with an allow-list for `app.popsindustrial.com` and `track.popsindustrial.com`
  - Auto-rejoin on WiFi disconnect
  - Disable AirDrop, AirPlay, screenshot sharing
  - Disable App Store, Settings access, Control Center
  - Set screen lock to "Never" while charging (iPads are perpetually plugged in)
  - Auto-launch the PWA on wake

**Email infrastructure**

Pops's owner likely uses a personal email (Comcast, Yahoo, Gmail). A `noreply@popsindustrial.com` sender will be flagged as phishing if the domain has no SPF/DKIM/DMARC records.

- Recommend **Google Workspace** ($6/user/mo, Business Starter) for Pops's owner and any office staff who need authoritative `@popsindustrial.com` addresses
- Configure SPF, DKIM, DMARC records when DNS is set up
- Resend will use the same domain for transactional sends (see 10.1 for cost)

Budget: **$12/mo** for two seats (owner + bookkeeper).

**Power management**

iPads default to sleeping after 2 minutes. In Single App Mode with Auto-Lock disabled via MDM profile, they will stay awake indefinitely as long as they're charging. Verify this works during dev iPad testing in Week 6.

Charging: leaving an iPad plugged in 24/7 is fine; iOS manages charge cycles intelligently. Battery wear over 2–3 years is acceptable for the cost.

### 7.3 Domain & Legal/IP

**Domain ownership**

In **Week 0**, verify `popsindustrial.com` is available or already owned by Pops. If owned by a third party (parked, cybersquatter), negotiate or pivot to an alternative (`popscoatings.com`, `popsindustrialcoatings.com`).

Subdomains:
- `app.popsindustrial.com` — internal staff
- `track.popsindustrial.com` — customer portal
- `www.popsindustrial.com` — marketing (out of scope)

Registrar recommendation: **Cloudflare Registrar** (at-cost pricing, ~$10/yr for `.com`, free WHOIS privacy, integrated DNS). Avoid GoDaddy.

**Ownership transfer at Wave 1 ship gate**

When Wave 1 ships, transfer:

- Domain registration → **Pops's account**
- Cloudflare DNS zone → Pops's account (or shared account with dev as collaborator)
- Apple Business Manager → **Pops's account**
- Supabase project → owned by Pops, dev added as admin collaborator
- Vercel project → owned by Pops, dev added as admin
- Resend account → Pops's account, dev added
- 1Password vault → shared between Pops and dev

This protects both sides. If the developer relationship ends, Pops keeps the system. If Pops fails to pay, the developer's leverage is the source code, not the production credentials.

**Code IP ownership (decide before Wave 1 starts)**

Three options, must be agreed in writing:

1. **Owned by Pops** — work-for-hire arrangement. Pops owns all code. Developer keeps no rights. Common for pure agency work.
2. **Owned by developer with usage license to Pops** — developer retains the code (potentially to license to other shops later) and grants Pops a perpetual, royalty-free license to use it. Most flexible if the SaaS dream is real.
3. **Open source** — released under MIT or Apache 2.0. Both parties can use freely; neither has exclusive rights.

**Recommendation**: Option 2 (developer-owned with perpetual license to Pops) if the multi-tenant SaaS path is being seriously pursued. Option 1 if Pops is paying full rate and wants exclusivity.

Document in the Master Service Agreement (MSA) — see 10.3.

**Privacy policy**

Required for the customer portal. Even at one shop, customers entering personal contact info on a website triggers privacy disclosure obligations.

- **CCPA** applies if any California residents are customers (very likely — annual revenue threshold is now low)
- **GDPR** applies if any EU customers — Pops is a single-state shop, so likely N/A, but verify
- Use a generic template (Termly, Iubenda, or a $300 lawyer review) for Wave 1
- Update for Wave 3 when payments and analytics expand the data collected

**Terms of Service**

Only required for Wave 3 if Pops will charge customers via the portal (online payment, deposits). Wave 1 has no commercial transactions through the portal, so a ToS is optional but a one-pager is still good practice.

**Customer data ownership**

The MSA must explicitly state: **all customer data entered into the system is owned by Pops, not by the developer.** The developer has no right to use, sell, or share customer data. This is non-negotiable for trust and is also the answer to any future tenant's first question when SaaS launches.

### 7.4 Disaster Recovery Runbook

A 1-page document committed to the repo at `docs/runbooks/disaster-recovery.md`. Updated after every incident or twice yearly, whichever comes first. Practiced in Week 11 dry-run before launch.

**Scenarios covered**

1. **Production database corruption or accidental destructive query**
   - Detect: Sentry alert on query failures, or Pops reporting "I can't see anything"
   - Action: Open Supabase dashboard → Database → Backups → PITR. Restore to a timestamp 5 minutes before the corruption event.
   - PITR is a Pro plan feature; window is 7 days on the base Pro tier.
   - Communicate to Pops: "Restoring database to <timestamp>. ETA: 15 minutes." After restore, verify recent jobs are intact; manually re-enter anything lost.

2. **Bad Vercel deploy (broken build, runtime errors in production)**
   - Detect: Sentry error spike, or Pops reporting "site is down"
   - Action: Vercel dashboard → Deployments → previous good deploy → "Promote to Production". Instant rollback, ~5 seconds to propagate.
   - Then debug the broken deploy in a preview branch.

3. **Resend account suspended or API key compromised**
   - Detect: emails not arriving (Sentry alert on `mail.send` failures), or Resend support email
   - Action: Switch `MAIL_PROVIDER` env var to `postmark` (pre-configured backup); rotate the Resend key in 1Password and the Vercel env. Document the suspension cause and resolve with Resend support.
   - Postmark is the recommended fallback (similar pricing, similar deliverability, fast signup).

4. **Supabase outage (regional)**
   - Detect: Supabase status page, Sentry errors on database calls
   - Action: Display global banner ("Temporary system outage — scans will be queued offline"). Tablets continue to function in offline mode (built in Wave 1, Week 10). Office staff cannot create new jobs until restored.
   - Outages are typically <1 hour. Communicate ETA from Supabase status to Pops.

5. **Compromised admin credential**
   - Detect: unfamiliar login email from Supabase, suspicious activity in audit log
   - Action: Supabase dashboard → Authentication → revoke session for the user, force password reset. Rotate any related service-role keys. Audit recent activity. Notify all staff to re-authenticate.

6. **Lost workstation tablet**
   - Detect: Pops reports a tablet missing/stolen
   - Action: Settings → Workstations → invalidate the device's `device_token`. Create a new workstation entry for the replacement tablet. The lost device's residual session expires at next refresh (configure short refresh window for shop tokens — recommend 1 hour).
   - If theft is suspected, Apple Business Manager can issue a remote lock/wipe.

**Runbook discipline**

- Print the runbook and tape it inside Pops's office
- Rehearse each scenario in Week 11 (use test Supabase project for #1, separate Vercel branch for #2)
- After every real incident: update the runbook with what actually happened, what worked, what didn't

### 7.5 On-Call / Support Model

**Solo dev is on-call.** No way around this for the foreseeable future. Define expectations clearly to protect both sides.

**Defined hours**

- **Primary support**: 8 AM – 8 PM Eastern Time, Monday through Friday
- **Best-effort weekend coverage**: response within 4 hours during daylight hours
- **After-hours emergency**: only for "system completely down, shop cannot operate" events. Pops's owner has a "break-glass" contact (mobile number + email).

Document this in the MSA. Reset expectations: "I am one person. If you need 24/7 coverage, we need to discuss a multi-person retainer model."

**Alert routing**

- Sentry → Pushover (mobile push notifications, $5 one-time per platform) for P1 alerts
- Sentry → email for P2/P3
- Define P1: error rate spike >10x baseline, scan failure rate >5%, auth completely failing, database unavailable
- Pushover lets the dev see alerts on the watch and triage in 30 seconds

**Status page**

Not needed for Wave 1 (one shop). For Wave 2+, set up `status.popsindustrial.com` via a free service (BetterStack, Uptime Robot's status page). Display Supabase, Vercel, and Resend status alongside the app's own uptime.

### 7.6 Backup Strategy (Operational)

Defense in depth: never rely on a single backup mechanism.

**Layer 1: Supabase Pro automated backups**

- Daily snapshots, 7-day retention (Pro plan)
- Point-in-Time Recovery (PITR) within the 7-day window — restore to any second
- Stored in Supabase's infrastructure (us-east-2 by default)

**Layer 2: Weekly offsite backup**

- A GitHub Actions cron runs every Sunday at 03:00 UTC
- Calls `pg_dump` against the production database (using a read-only role)
- Encrypts the dump with `age` or `gpg` using a key stored in 1Password
- Uploads to **Backblaze B2** (cheaper than S3: ~$0.005/GB/mo) or **AWS S3** with lifecycle policy (Glacier after 30 days)
- Retention: 12 weekly backups + 12 monthly backups + 7 yearly backups
- Estimated storage: 50 GB at scale = ~$0.25/mo on B2

**Layer 3: Monthly restore drill**

- First Monday of each month, restore the most recent offsite backup to a temporary Supabase project
- Run a smoke-test SQL script that checks: row counts roughly correct, latest jobs present, no schema drift
- If restore fails, escalate immediately
- This catches silent backup corruption before it matters

**Layer 4: Storage backups**

- Supabase Storage holds job photos and PDFs
- Daily sync via `rclone` from Supabase Storage S3-compatible API → Backblaze B2
- Retain 90 days
- Cost: negligible at expected volume

### 7.7 Bus Factor Mitigation

Bus factor of 1 is the single largest risk in this project. Mitigations are imperfect but mandatory:

**Documentation discipline**

- This spec lives in the repo and is updated as decisions change
- Per-module READMEs in `apps/web/`, `apps/portal/`, `packages/db/`
- Disaster recovery runbook (§7.4)
- Incident postmortems committed under `docs/incidents/`
- Architecture Decision Records (ADRs) committed under `docs/adr/` for any major design choice

**Shared credential vault**

- 1Password Family or Business plan ($8/mo)
- Shared vault between Pops's owner and the developer
- Contains: Supabase project credentials, Vercel team access, Resend API keys, registrar login, AWS/B2 credentials, MDM credentials, all third-party service logins
- Pops's owner has emergency access — can recover the vault even if dev disappears

**Successor-friendly code**

- TypeScript strict mode
- ESLint + Prettier enforced in CI
- Conventional commits for searchable history
- No clever tricks — boring, readable code

**Rotation drills**

- Every quarter, deliberately rotate one credential (e.g., the Resend API key) using the runbook
- Validates the runbook actually works and no hardcoded keys exist

**Open source dependencies**

- Avoid niche or unmaintained packages
- Quarterly `npm audit` and dependency upgrade pass

### 7.8 Pops-Side Training & Onboarding

**Office staff training**

- **Duration**: half day, hands-on, in Pops's office, with the actual production system
- **Audience**: owner + any office staff (likely 1–2 people total)
- **Curriculum**:
  - Logging in, password reset
  - Creating a company, contact, and job
  - Generating and printing the job packet
  - Marking a job scheduled, putting it on hold, releasing it
  - Reviewing job photos and QC notes
  - Inviting another staff member
  - Customer portal preview (so they understand what customers see)
- **Deliverable**: signed sheet acknowledging training completion

**Shop staff training**

- **Duration**: half to full day per shift
- **Audience**: every shop floor worker who will scan
- **Format**: hands-on at the actual workstations once tablets are mounted (Week 11)
- **Curriculum**:
  - PIN tap to identify yourself
  - Switching users mid-shift
  - Scanning a job from a workstation
  - Snapping a photo (when required)
  - Marking a job on hold
  - QC fail flow
  - What to do when the camera won't read a QR (manual entry fallback)
  - What to do when WiFi drops (tablet shows offline indicator; scans queue)
  - Who to call when stuck

**Cheat sheets**

- One-page laminated reference, posted at every workstation
- Covers the 5 most common actions and the troubleshooting tree
- Includes the dev's break-glass phone number

**Training video**

- Record a single 5-minute screencast during Week 11 covering the shop workflow
- Host on YouTube as unlisted; link in the cheat sheet via QR code
- Use as onboarding for future hires

### 7.9 Maintenance Windows

**Postgres migrations**

- Run after **6 PM Eastern Time on weekdays** (Pops typically closed)
- Migrations are tested on Supabase branch databases and against the staging environment first
- Use `supabase db push` with the `--include-roles=false` flag for safe production migrations
- Long-running migrations (large data backfills) scheduled for Saturday mornings
- Always notify Pops's owner 24 hours before any migration that requires downtime

**Vercel deploys**

- Zero-downtime, can happen any time
- Preview deploys on every PR, production deploy on merge to `main`
- Feature flags via env vars or LaunchDarkly's free tier let risky changes ship dark

**Breaking changes**

- Coordinated with Pops's owner
- 7-day notice for any UI change that affects daily workflow
- Provide a side-by-side comparison screenshot before deploying

---

## 8. Risk Register

The risk register below is exhaustive but not paranoid: each entry has a realistic probability, realistic impact, concrete mitigation, and a trigger condition that should escalate the risk to a re-plan or slip the timeline. Probability and impact are scored Low / Medium / High.

| # | Risk | Probability | Impact | Mitigation | Trigger to escalate |
| --- | --- | --- | --- | --- | --- |
| 1 | iOS Safari camera permission UX broken or revokes between sessions | Medium | High | Prototype the camera flow in Week 2 on a real iPad in Single App Mode; design a permission-prompt screen with a "what to do if you don't see a prompt" fallback; document MDM camera-permission profile | If after Week 6 the dev iPad still requires manual permission re-grant per session, escalate: re-evaluate native shell (Capacitor) wrapping the PWA |
| 2 | Offline mode harder than estimated — iOS Safari has no Background Sync API | High | Medium | Implement a simple in-page queue with IndexedDB + foreground replay on visibility change; ship Wave 1 without Background Sync; document the limitation and the "tap to sync" pattern for shop staff | If two consecutive shop floor sessions lose scan data due to backgrounding, escalate: explore Capacitor wrapper or service worker periodic sync fallback |
| 3 | Per-workstation Supabase auth has unexpected quirks (token refresh, multi-tab) | Medium | High | Build the workstation auth flow in Week 3; test refresh behavior across long sessions (8+ hours); use a custom JWT claim for `workstation_id`; have a clear "tablet stale, re-enroll" recovery flow | If refresh fails silently in production after Week 11, escalate: shorten refresh window and add explicit re-enroll banner |
| 4 | Custom SMTP delivery flagged as spam by Gmail/Outlook | Medium | High | Use Resend with verified domain, full SPF + DKIM + DMARC records; warm up sending volume gradually; monitor bounce rate via Resend dashboard; have Postmark as warm backup | If bounce rate >5% in any week, escalate: rotate provider, audit content for spam-trigger phrases |
| 5 | PDF generation slow on Vercel cold starts | Medium | Medium | Use `@react-pdf/renderer` or `pdf-lib` (lighter than Puppeteer); precompile templates; consider a separate Vercel function with `runtime: 'nodejs'` and warm-up pings; cache generated PDFs in Storage | If P95 packet generation latency >5s in production, escalate: move to background job with email-when-ready |
| 6 | Pops's actual workflow differs significantly from the PRD | Medium | High | Schedule shadowing day in Week 1 — dev spends a full shift at the shop observing actual workflow; weekly check-ins with owner during Wave 1; flexible stage transitions in DB schema reduce risk of being wrong about the workflow | If shadowing reveals >2 stages we didn't model, escalate: pause feature work, rework the schema before continuing |
| 7 | Real-time subscription costs/limits at scale | Low | Medium | Wave 1 has 1 shop; Supabase Realtime free tier covers thousands of concurrent subscribers; design with channel scoping (per-tenant, per-job) to avoid fan-out; budget for Realtime add-on at Wave 3 | If Wave 2 exceeds free tier limits, escalate: upgrade Realtime add-on, audit subscription patterns for over-fetching |
| 8 | Scope creep from Pops feedback during Wave 1 | High | High | Strict change-control process: any feature request goes into a backlog, prioritized at end-of-wave reviews; written agreement that Wave 1 scope is frozen at signing; demo working software every 2 weeks to absorb feedback in small chunks | If three consecutive weeks slip due to in-flight scope additions, escalate: stop new features, ship what works, push remainder to Wave 2 |
| 9 | Solo dev burnout (24+ weeks of full-time solo work) | High | High | Build in 2-week buffer between waves; deliberately work 40-hour weeks, not 60; one full day off per week minimum; quarterly week-long break; have a "designated griper" friend who is not Pops to vent to | If energy drops noticeably in any 2-week window or sleep quality drops, escalate: take a week off, re-baseline timeline with Pops |
| 10 | Wave 1 ship gate fails (multiple criteria miss) | Medium | High | Define exit criteria clearly upfront (this spec); weekly self-grading against criteria starting Week 8; have a "minimum acceptable" version of each gate that can be shipped if "ideal" version slips | If 3+ gates miss in Week 11 review, escalate: extend by 2 weeks, communicate honestly to Pops, do not ship broken |
| 11 | Pops's owner doesn't actually use the system after launch | Medium | High | Owner involvement during all of Wave 1 — daily 15-minute syncs, weekly 1-hour walkthrough; design office UX with owner's specific habits in mind; provide cheat sheet pinned at desk | If owner skips 3+ scheduled walkthroughs, escalate: have a hard conversation about commitment, possibly pause development |
| 12 | WiFi unreliable on shop floor (offline mode burden increases) | Medium | High | WiFi survey in Week 0; plan WiFi upgrade if signal poor; implement offline mode early in Wave 1, not late; instrument scan-failure metrics from day 1 | If scan failure rate >2% in any week post-launch, escalate: deploy additional APs or hardwire workstations |
| 13 | DST transition causes timestamp bugs | Low | Medium | Use `TIMESTAMPTZ` everywhere in Postgres; never store local time; format on the client using `Intl.DateTimeFormat` with explicit timezone; add tests around DST boundary dates | If any user reports "the time is wrong" within a week of a DST change, escalate: audit all date-handling code paths |
| 14 | Domain registrar issues (typo, slow transfer, expiration) | Low | High | Use Cloudflare Registrar (reliable, transparent); enable auto-renew with backup payment method; set calendar reminder 60 days before expiration; share registrar credentials with Pops in 1Password | If domain expires or registrar suspends, escalate: emergency restoration, communicate downtime to all parties |
| 15 | Upstash deprecation or rebrand (Vercel KV → Upstash already happened in 2024) | Low | Medium | Wrap rate-limit calls in `src/shared/rate-limit/` abstraction so we can swap providers; monitor Vercel/Upstash changelogs; have a Postgres-based rate-limit fallback designed (using Supabase) | If Upstash deprecates with <90 days notice, escalate: migrate to Postgres-based rate limiting (already designed as fallback) |
| 16 | Supabase Auth Hook has undocumented quirks (custom JWT claims) | Medium | High | Test the Auth Hook in Week 2 with concrete claim shapes; have RLS policies that fail closed if claims are missing; monitor Auth Hook latency (it's in the critical path for every login) | If Auth Hook latency P95 >500ms, escalate: refactor to lighter-weight implementation |
| 17 | Resend account suspended (deliverability issues or ToS violation) | Low | High | Use clean transactional content (no marketing); monitor deliverability dashboard; have Postmark configured as warm backup; respond quickly to abuse reports | If Resend suspends account, escalate: switch to Postmark within 1 hour, file appeal with Resend |
| 18 | Hardware procurement delays (iPads back-ordered, brackets out of stock) | Medium | Medium | Order iPads in Week 4 with 8-week buffer; have alternative bracket vendor identified; B&H as Apple Store backup | If iPads not on-site by Week 8, escalate: borrow tablets from Pops's existing inventory or rent for QA week |
| 19 | iPad falls or breaks at workstation | Medium | Medium | Lockable bracket reduces risk; spare iPad in office for immediate swap; AppleCare+ on each device ($30/yr) for accidental damage | If 2+ tablets break in 6 months, escalate: re-evaluate bracket design, consider impact-resistant cases |
| 20 | Camera lens gets coated with overspray or scratched | Medium | Medium | Clear protective lens covers ($5 each, replaceable monthly); manual job-number entry as fallback (always available in UI); train staff to clean lens daily | If camera failure rate >5%, escalate: schedule lens cover replacement weekly; reposition tablets away from spray |
| 21 | Employee forgets PIN repeatedly (lockout becomes operational pain) | Medium | Low | PIN reset flow is one tap by office staff; document the flow on the cheat sheet; PIN policy is "just memorable enough" — 4 digits, no complexity rules | If >10% of employees lock out weekly, escalate: revisit PIN length or add NFC fob option |
| 22 | Customer portal performance degrades under subscription scaling | Low | Medium | Index foreign keys aggressively; paginate customer portal job list (default 25); use Supabase Realtime selectively (one channel per active job, not all jobs) | If portal P95 >2s, escalate: profile queries, add caching layer for read-heavy paths |
| 23 | Cross-tenant data leak via service-role bug | Low | High | Per-workstation auth is the primary mitigation (RLS enforces tenant boundary on every query); strict ban on service-role usage in routes; quarterly security audit; pgtap RLS test suite (see Section 9) | If any cross-tenant data appears in logs/output, escalate: stop the deploy, root-cause within 4 hours, full incident report |
| 24 | Vendor lock-in becomes painful (need to migrate off Supabase or Vercel) | Low | High | Standard Postgres schema (no Supabase-specific extensions for core data); Vercel-agnostic Next.js code (no Vercel-only APIs); document the migration playbook in `docs/runbooks/migration.md` | If pricing or features push us off, escalate: 90-day migration plan to Railway+self-hosted Postgres or AWS+RDS |
| 25 | Solo dev gets sick mid-Wave (no bus factor) | Medium | High | 1Password vault is shared; documentation is current; preview deploys mean Pops can see what's in flight; 2-week buffer between waves absorbs short illnesses | If illness exceeds 5 working days, escalate: notify Pops, slip the timeline by the duration, no heroics |
| 26 | Compliance demand from a customer (CCPA data export, GDPR right to deletion) | Low | Medium | Build a self-service "download my data" feature in Wave 3; have a manual SQL-based delete process for Wave 1–2; ensure backups have a known retention so deletion can propagate | If a request arrives in Wave 1, escalate: handle manually within statutory deadline (45 days CCPA, 30 days GDPR) |
| 27 | Integration request from Pops (QuickBooks, etc.) — out of Wave 1 scope | High | Medium | Defer to Wave 3 backlog; document the request; never start implementation without scope agreement | If Pops insists during Wave 1, escalate: change order with explicit cost and timeline impact |
| 28 | Power outage at Pops kills tablets mid-shift | Low | Medium | Tablets have 4–6 hours of battery if unplugged; offline mode queues scans; unplug brackets are an option for portable use during outage | If multi-hour outage during peak production, escalate: communicate to customers about delays |
| 29 | Pops's ISP outage = entire system down (offline mode helps but isn't perfect) | Low | High | Offline mode covers shop scans; office work pauses (no job creation, no email); WiFi cellular failover via a small modem ($50/mo backup) is an option for Wave 2 | If outages exceed 4 hours twice in a quarter, escalate: deploy cellular failover |
| 30 | Owner-developer relationship friction over scope/cost/timeline | Medium | High | Weekly written status updates with what shipped, what slipped, what's next; transparent burn-down; pre-agreed change-control process; quarterly relationship retrospective | If trust erodes (owner stops attending walkthroughs, payments slow), escalate: pause work, have a frank in-person conversation |
| 31 | Magic link emails arrive too slowly to be usable | Low | Medium | Resend P95 send latency is <2s; monitor via Sentry; have a fallback "request another link" flow with rate limiting | If link arrival latency >30s consistently, escalate: switch provider |
| 32 | Print packet QR code unscannable (low ink, smudged, wrong size) | Medium | Medium | Generate QR at high error-correction level (H, 30%); minimum print size 1.5" square; test with the actual printer at Pops in Week 11; provide alternate manual entry path | If scan failure on printed packets >2%, escalate: increase QR size, reformat packet template |
| 33 | New employee added during shift, can't be onboarded fast | Low | Low | Office staff can create employee + PIN in <1 minute; document this flow on the cheat sheet | n/a — operational, not technical |
| 34 | Job photo storage costs unexpectedly high | Low | Medium | Compress photos client-side before upload (max **1024px**, JPEG quality **0.7** — matches Module 5 spec); cap photos per job at 10 (configurable); estimate ~50KB per photo | If Storage usage exceeds 10 GB in first quarter, escalate: lower compression quality or add cleanup policy for completed jobs >90 days old |
| 35 | Tenant 2 onboarding reveals Pops-specific assumptions baked into the platform | High | Medium | Wave 4 includes a "platformization audit" before Tenant 2 install; refactor any hardcoded Pops references; Tenant 2 onboarded as pilot with friction tolerance + rapid-fix turnaround | If >5 Pops-specific bugs found in Tenant 2's first week, escalate: pause Tenant 3+ pipeline, fix systemic platformization gaps |
| 36 | Sandblasting workflow doesn't generalize cleanly from powder coating template | Medium | Medium | Wave 4 spike includes a sandblasting workflow validation week before committing the template; on-site or video shadowing of an active sandblasting shop early in Wave 4 | If Tenant 2 needs >30% custom workflow stages outside the sandblasting default, escalate: rework workflow template engine, consider per-vertical builders |
| 37 | Workflow template versioning leaks across tenants | Low | High | All template edits scoped to `tenant_id` at DB level; pgTAP tests verify cross-tenant template isolation; version field locks existing jobs to original template | If any cross-tenant template visibility appears, escalate: stop deploys, root-cause within 4 hours, full incident report |
| 38 | Custom-domain SSL provisioning fails or expires silently | Medium | Medium | Vercel auto-renews; admin UI surfaces SSL status with alerts at 14/7/1 days before expiry; weekly cron checks all tenant domain health | If a tenant's custom domain serves invalid SSL, escalate: immediate fallback to platform subdomain, root-cause SSL provisioning |
| 39 | Agency super-admin console becomes a backdoor (consent flow bypassed, audit gaps) | Low | High | pgTAP test suite specifically covers super-admin paths; quarterly external security review; consent tokens + audit log entries enforced at DB level not just app level | If any cross-tenant read happens without a consent token + audit entry, escalate: stop deploys, full audit, security review |

---

## 9. Testing Strategy

The testing strategy is pragmatic, not aspirational. Two areas demand high rigor: **RLS policies** (cross-tenant isolation is unforgiving) and **critical user flows** (a broken scan or print flow stops production at Pops). Everything else gets reasonable coverage with no apologies for not chasing 100%.

### 9.1 Test Infrastructure

**Tooling**

- **pgTAP** — installed in Supabase Postgres for SQL-level unit tests of functions and RLS policies. Available as a Supabase extension; enable via the dashboard.
- **Vitest** — unit tests for Server Actions, helpers, validators. Fast, ESM-native, TypeScript-friendly.
- **Playwright** — end-to-end tests against a live Supabase + Next.js stack. Lives in repo as `e2e/`.
- **GitHub Actions CI** — runs on every PR: `lint` + `typecheck` + pgTAP + Vitest. Playwright runs nightly + on `main` branch deploys (slower, expensive to run on every PR).
- **Supabase branch databases** (Pro feature) — every PR gets an isolated branch DB with the schema migrations applied. Tests run against this rather than a shared dev DB.
- **Local development** — `supabase start` runs the full stack locally (Postgres, Auth, Realtime, Storage) via Docker. All tests can run against local before PR.

**Test data isolation**

- pgTAP tests run inside transactions that roll back automatically. No test pollutes the database.
- Vitest unit tests are pure (no DB dependency) where possible; when DB needed, use the local Supabase + per-test fixtures.
- Playwright uses a dedicated test tenant with a known fixture set; cleaned and re-seeded before each run.

### 9.2 RLS Test Suite (Load-Bearing Security)

The RLS test suite is non-negotiable. Every policy must be covered by at least one test that proves it denies what it should deny. Organized by file under `supabase/tests/rls/`.

**`supabase/tests/rls/test_cross_tenant_isolation.sql`**

Setup: tenant A has 3 companies, 5 contacts, 4 jobs. Tenant B has 2 companies, 3 contacts, 2 jobs. Distinct staff users for each.

```sql
BEGIN;
SELECT plan(6);

-- Test 1: staff JWT for tenant A cannot SELECT tenant B's companies
SELECT set_jwt_for_staff('tenant_a_staff_id');
SELECT is(
    (SELECT count(*)::int FROM companies WHERE tenant_id = 'tenant_b_id'),
    0,
    'Tenant A staff cannot see Tenant B companies'
);

-- Test 2: staff JWT for tenant A cannot UPDATE tenant B's jobs
SELECT throws_ok(
    $$ UPDATE jobs SET production_status = 'completed' WHERE tenant_id = 'tenant_b_id' $$,
    NULL,
    'Tenant A staff cannot UPDATE Tenant B jobs'
);

-- Test 3: customer JWT for tenant A's company X cannot SELECT tenant B's data
SELECT set_jwt_for_customer('tenant_a_company_x_customer');
SELECT is(
    (SELECT count(*)::int FROM jobs WHERE tenant_id = 'tenant_b_id'),
    0,
    'Tenant A customer cannot see Tenant B jobs'
);

-- Test 4: customer JWT for tenant A's company X cannot SELECT tenant A's company Y
SELECT is(
    (SELECT count(*)::int FROM jobs WHERE company_id = 'tenant_a_company_y_id'),
    0,
    'Tenant A customer X cannot see Tenant A company Y jobs'
);

-- Test 5: anonymous JWT cannot SELECT any tenant data
SELECT set_jwt_anon();
SELECT is(
    (SELECT count(*)::int FROM jobs),
    0,
    'Anonymous JWT cannot read any jobs'
);

-- Test 6: forged JWT with arbitrary tenant_id is rejected by Auth Hook
SELECT throws_ok(
    $$ SELECT auth.set_forged_jwt_with_tenant('arbitrary_tenant_id') $$,
    NULL,
    'Forged JWT with non-existent tenant_id is rejected'
);

SELECT * FROM finish();
ROLLBACK;
```

**`supabase/tests/rls/test_audience_isolation.sql`**

Tests that customer/shop/staff audiences cannot bleed across role boundaries.

- Test 1: customer JWT cannot SELECT from `staff` table
- Test 2: customer JWT cannot SELECT contacts from another company at the same tenant
- Test 3: customer JWT cannot UPDATE jobs (only SELECT customer-visible columns)
- Test 4: shop JWT cannot UPDATE companies (read-only for shop)
- Test 5: shop JWT can SELECT jobs but not staff records
- Test 6: shop JWT cannot SELECT pricing or quote data (Wave 3)

**`supabase/tests/rls/test_function_authorization.sql`**

Tests that SECURITY DEFINER functions enforce their own authorization (don't trust the caller).

- Test 1: `app.record_scan_event(p_job_id, p_to_status, p_employee_id, p_workstation_id, p_notes, p_attachment_id)` refuses cross-tenant inputs (job belongs to tenant A, employee belongs to tenant B)
- Test 2: `record_scan_event` refuses non-staff JWT (e.g., customer trying to scan)
- Test 3: `app.validate_employee_pin(p_tenant_id, p_employee_id, p_pin)` enforces row lock (concurrent attempts handled atomically with `FOR UPDATE`)
- Test 4: `validate_employee_pin` lockout activates after 5 consecutive failures within 15 minutes
- Test 5: `get_public_job_view(token)` (Wave 3) refuses invalid or expired tokens
- Test 6: `get_public_job_view` is rate-limited per token (≤10 calls/min) — uses a counter table
- Test 7: `app.claim_workstation(p_workstation_id, p_employee_id, p_expected_version)` enforces optimistic concurrency (rejects stale version)

**`supabase/tests/rls/test_inactive_user.sql`**

Tests the `is_active` flag is enforced at multiple layers.

- Test 1: staff with `is_active = false` — Auth Hook rejects token issuance
- Test 2: customer with `is_active = false` — Auth Hook rejects token
- Test 3: user is active during sign-in but deactivated mid-session → next refresh token request fails
- Test 4: deactivating an employee invalidates any in-flight PIN session for that employee within 60 seconds (configurable)

**`supabase/tests/rls/test_polymorphic_attachments.sql`**

Photos and PDFs can attach to multiple parent types (jobs, quotes, invoices). RLS must walk the polymorphic FK to enforce the parent's permissions.

- Test 1: customer can SELECT photos attached to their own jobs
- Test 2: customer cannot SELECT photos attached to another customer's jobs
- Test 3: shop staff can SELECT all photos at their tenant
- Test 4: signed Storage URL respects RLS (test by attempting direct fetch)

### 9.3 Vitest Unit Test Priorities

Vitest covers TypeScript code: Server Actions, helpers, validators. Priority order is by blast radius.

**Every Server Action**

For each action, test:
1. Happy path with valid input
2. Validation failure (Zod schema rejects bad input)
3. Auth gate (action refuses unauthenticated calls)
4. Audience gate (e.g., customer Action refuses staff JWT and vice versa)
5. Database error path (mock DB throws)
6. Idempotency where applicable (e.g., scan replay should not double-record)

**Auth helpers**

- `requireOfficeStaff(req)` — passes for staff, throws for customer/shop/anon
- `requireShopStaff(req)` — passes for shop session, throws for staff/customer/anon
- `requireCustomer(req)` — passes for customer, throws for staff/shop/anon
- `requireWorkstationContext(req)` — passes when `workstation_id` claim present, throws otherwise

**PIN handling**

- PIN hashing uses `bcrypt` with cost factor 10 (or `argon2id`)
- Test: same PIN hashed twice produces different hashes (salt is random)
- Test: comparing correct PIN against hash returns true
- Test: comparing wrong PIN returns false
- Test: timing of comparison is constant within tolerance (no early exit)

**Job number format generator**

- `app.next_job_number()` produces `PREFIX-YYYY-NNNNN` format (e.g. `JOB-2026-00001`); reads tenant_id from JWT, not a parameter
- Test: monotonic across many calls (no duplicates)
- Test: zero-padded correctly
- Test: rolls over at end of year
- Test: tenant scoped (tenant A's `JOB-2026-00001` does not collide with tenant B's `JOB-2026-00001`)

**Polymorphic attachment access checker**

- `canAccessAttachment(attachment_id, user_id)` — walks parent_type / parent_id and applies parent's RLS logic
- Test for each parent type (job, quote, invoice)
- Test denial for cross-tenant
- Test denial for cross-customer

**Validators**

- Every Zod schema gets a happy-path test and 2–3 failure-path tests
- Email, phone, address normalizers tested with edge cases (international phone, multi-line address)

### 9.4 Playwright E2E Critical Flows

E2E tests cover the flows that, if broken, stop Pops's business. Each flow is a single test file.

**Flow 1: Office onboarding and job creation**
- Sign in as staff
- Invite a new staff member (assert email sent)
- Create a new company
- Add a contact to that company
- Create a new job for that company
- Print the job packet PDF (assert it downloads, contains a QR code)

**Flow 2: Shop floor scan workflow**
- Enroll a workstation (one-time setup, generates `device_token`)
- Tap an employee PIN (assert correct employee in session)
- Scan a job QR code via simulated camera input
- Walk the job through 7 stages (Received → Prep → Coating → Curing → QC → Completed → Picked Up)
- Snap a photo at QC
- Mark a job on hold
- Release the hold
- Switch users mid-session

**Flow 3: Customer portal**
- Customer requests magic link
- Customer clicks magic link in email (Playwright intercepts)
- Customer sees their job list
- Customer drills into a job
- Stage transition occurs in another tab; customer view updates within 5 seconds (Realtime)

**Flow 4: Multi-color (parent/child jobs)**
- Create a parent job
- Split into two child jobs (each with its own color spec)
- Scan child A through Coating without affecting child B
- Both children visible under parent in office view

**Flow 5: Concurrent scan conflict**
- Tablet A scans job X at Coating
- Within 5 seconds, tablet B scans the same job X
- Tablet B sees a "moved by" warning showing tablet A's recent action
- Both scan events are recorded for audit, but only one stage transition occurs

**Flow 6: Offline scan replay (Wave 1, Week 10)**
- Take tablet offline (intercept network)
- Scan 5 jobs through different stages
- Bring tablet online
- All 5 events replay in order, all visible in audit log
- No duplicates (idempotency key prevents double-write)

### 9.5 Manual QA Checklist (Week 11)

Before production launch, a one-week manual QA pass at Pops's actual shop. Cannot be skipped.

**On-site iPad testing**

- Scan a printed packet under typical shop lighting (fluorescent, dusty)
- Scan with work gloves on (capacitive screens through nitrile gloves)
- Scan from 6", 12", and 24" distance — note minimum reliable QR size
- Scan a packet that's been on the floor for 30 minutes (smudges, dust)
- Test near the curing oven (heat doesn't kill the tablet)

**Network testing**

- Use Charles Proxy or Network Link Conditioner to throttle WiFi to 3G speeds
- Simulate intermittent disconnect (drop WiFi for 30s mid-scan)
- Verify offline mode kicks in correctly
- Verify replay on reconnect

**Print testing**

- Print 10 packets on Pops's actual printer
- Scan all 10 with the actual production tablet
- Verify 10/10 scan success on first attempt
- If any fail, increase QR size or error correction level

**Owner sign-off**

- Owner walks through the office workflow on a laptop while dev observes silently
- Owner walks through a shop scan on a tablet while dev observes
- Document any "wait, how do I…?" moments — these are UX bugs

**Full production day shadow**

- Dev on-site for one full production day in Week 11 or Week 12
- Observation only — no fixes, no coaching
- Note every workflow gap, edge case, weird question
- Triage post-shift; fix critical issues before launch, defer rest to Wave 2

### 9.6 Test Data Seeding

Reproducible test data is essential for both automated tests and manual QA.

**`scripts/seed-tenant.ts`**

Programmatic seed for new tenant:
- Creates a tenant
- Creates 3 staff users with different roles (owner, office, manager)
- Creates 5 employees with PINs
- Creates 5 workstations with device tokens
- Creates 10 customer companies, each with 1–3 contacts and 1–5 jobs in various stages
- Used for E2E tests, manual demos, and initial production tenant bootstrap

**`supabase/seed.sql`**

Local dev seed: smaller fixture set for fast local development. Sample companies, jobs, packets that demonstrate every feature.

**`supabase/tests/fixtures/*.sql`**

Per-test fixtures for pgTAP. Each test that needs specific data has a `setup_<test_name>.sql` file.

**Fake scanner endpoint**

A `/api/dev/simulate-scan` endpoint (dev environment only) that accepts a job number and station ID and triggers the scan flow without requiring a physical camera. Critical for Playwright E2E and for testing without an iPad.

### 9.7 Coverage Targets (Modest, Not Dogmatic)

Coverage as a metric is misleading; coverage as a backstop is useful. Targets reflect what we care about most.

| Area | Target | Rationale |
| --- | --- | --- |
| pgTAP | 100% of RLS policies | Cross-tenant isolation is unforgiving |
| pgTAP | 100% of SECURITY DEFINER functions | These bypass RLS by design; must be airtight |
| Vitest | 80% of Server Actions | Primary write path; high blast radius |
| Vitest | 60% overall | Catches regressions without chasing trivia |
| Playwright | All critical flows pass | Required for production deploy gate |
| Playwright | Run nightly + on `main` | Too slow for every PR |
| Manual QA | Full Week 11 pass | No coverage substitute for human eyes |

**Coverage is monitored but not gated.** A PR that drops Vitest coverage from 81% to 80% does not block merge. A PR that breaks an RLS test does. Pragmatism over cargo-culting.

---

## 10. Cost & operational economics

This section covers platform infrastructure costs, per-tenant hardware, tenant pricing, cost of goods sold at scale, and tenant ROI. All numbers are estimates as of 2026-04-27 — pricing changes; verify against vendor sites at procurement time.

This section aligns with and provides additional technical context to [PRD §13 (Operational costs)](../PRD.md#13-operational-costs).

### 10.1 Platform infrastructure costs (fixed, scales gracefully)

These are the irreducible infrastructure costs to run the platform. The platform is one stack serving all tenants via `tenant_id` + RLS, so most costs are fixed regardless of tenant count, with step-ups at scale milestones.

| Service | Plan | Cost | Required from | Notes |
| --- | --- | --- | --- | --- |
| Supabase | Pro | $25/mo | Week 1 | Required for daily backups, PITR, branch DBs, higher quotas. Free tier insufficient for production. |
| Vercel | Pro | $20/mo | Week 1 | Required for serverless function timeout extension, custom domains with team features, analytics |
| Resend | Pro | $20/mo for 50,000 emails | Wave 1 | Free tier (3k emails/mo) likely sufficient initially; upgrade when transactional volume grows |
| Upstash Redis (via Vercel Marketplace) | Free → Pay-as-you-go | $0 → $10–15/mo | Wave 1 | Rate limiting magic links, scan throttling. Free tier (500K commands/mo) covers Wave 1 with ~60% headroom. Note: Vercel KV was deprecated in late 2024 and auto-migrated to Upstash. |
| Sentry | Free → Team | $0 → $26/mo | Wave 1 → Wave 2 | Free tier covers 5k events/mo. Upgrade when error volume grows or team grows |
| Domain (primary) | Cloudflare Registrar | $10/yr ≈ $0.85/mo | Week 0 | At-cost pricing; per registered domain |
| Google Workspace | Business Starter | $6/user/mo × 2 = $12/mo | Week 1 | For operator email infrastructure (founder + bookkeeper) |
| Backup storage (B2) | Pay-as-you-go | $2–5/mo | Week 8 | Offsite backup retention; cheaper than S3 |
| 1Password Business | Business plan | $8/mo | Week 0 | Shared credential vault for the operator team |
| AppleCare+ for iPad | Per device, prorated | tenant-paid (see §10.2) | per tenant onboarding | Tracked under per-tenant hardware costs, not platform-side recurring |

**Total fixed (Wave 1)**: approximately **$80–130/mo**

**Total fixed (Wave 3, single-tenant)**: approximately **$150–200/mo** as Sentry upgrades, Resend volume increases, and Realtime usage grows

**Total fixed (Wave 4 + ~5 tenants)**: approximately **$150–250/mo** — single-stack platform serves all tenants, so most costs stay flat with tenant count; modest growth in Resend/Storage volume drives the upper bound

This aligns with [PRD §13.1](../PRD.md#13-operational-costs). Affordable for the platform operator at any scale through Tenant 10+ and is dwarfed by per-tenant labor savings (see §10.6).

### 10.2 Per-tenant one-time hardware costs (tenant-paid)

| Item | Quantity | Unit cost | Subtotal |
| --- | --- | --- | --- |
| iPad (10th gen, 64 GB, WiFi) | 5 | $450 | $2,250 |
| Spare iPad | 1 | $450 | $450 |
| Heckler / Maclocks bracket | 6 | $80 | $480 |
| USB-C power supplies (20W, Apple) | 6 | $20 | $120 |
| USB-C cables (3m, MFi-certified) | 6 | $20 | $120 |
| Lens protector covers | 12 (2/iPad initial stock) | $5 | $60 |
| AppleCare+ for iPads | 6 | ~$40/yr | ~$240/yr |
| Surge protectors (per workstation) | 5 | $25 | $125 |
| Misc cables, zip ties, mounting hardware | — | — | $200 |
| Optional: WiFi upgrade (UniFi U6-Lite × 3 + UDM-SE) | 1 set | — | $800 |
| Optional: electrician for new outlets | 1 visit | — | $1,000 |

**Total per tenant (without WiFi/electrician)**: ~**$3,300** (rounds to PRD §13.2's ~$3,000-$5,000 range)

**Total per tenant (with WiFi upgrade and electrician)**: ~**$5,100**

These are paid by the tenant directly, not the platform operator. Procurement spans Weeks 1–6 of each tenant's onboarding playbook (PRD Appendix D.1). The operator may optionally resell as a "turnkey hardware kit" with ~15-20% markup as a future revenue line (see §10.4).

### 10.3 Tenant 1 (Pops) service terms

Pops Industrial Coatings is **Tenant 1 — a paying customer on standard service terms**. There is no separate design-partner / MSA / IP carve-out / revenue-share arrangement. Pops is treated identically to Tenant 2+ commercially.

The service agreement covers:
- Standard SaaS subscription (see §10.4 for pricing)
- Customer data ownership (always the tenant's, not the platform operator's)
- Termination clause with 90-day notice and full data export
- Confidentiality (mutual NDA)
- Liability cap (operator's liability limited to fees paid in the prior 12 months)
- Payment terms (Net 15 or Net 30)

### 10.4 Standard tenant pricing

| Item | Price | Notes |
|---|---|---|
| **Onboarding fee (one-time)** | **$2,500** | Domain setup, branding intake, workflow configuration, training, hardware procurement guidance, Week 1-6 hand-holding (per PRD Appendix D.1) |
| **Monthly subscription (Standard tier)** | **$499/mo** | Up to 5 workstations, 500 jobs/mo, 5 office staff seats, 25 active employees, 90-day photo retention, email support |
| **Hardware kit (optional resell)** | **+$3,500** | Operator-procured turnkey hardware kit; ~15-20% markup on cost (see §10.2) |
| **Premium tier** (deferred) | **$899/mo** | Unlimited workstations/jobs/staff, priority support, advanced analytics, SLA |

Add-ons available on Standard tier:
- Extra workstation: $30/mo each
- Extra 500 jobs/mo: $50/mo
- Advanced analytics: $50/mo
- 1-year photo retention: $30/mo
- Phone support: $200/mo

Pricing assumes high-touch onboarding via Implementation Specialist. Self-serve signup deferred until Tenant 10+. Pricing should be transparent on a public marketing site.

### 10.5 Cost of Goods Sold Considerations (At Scale)

If $299/mo per shop, what does it cost to serve one shop? Per-shop COGS estimate:

| Cost component | Per-shop monthly |
| --- | --- |
| Supabase compute and storage | $25–35 |
| Vercel bandwidth and functions | $5–10 |
| Resend transactional email | $5–10 |
| Sentry and observability | $5 |
| Backups (B2/S3) | $1–3 |
| Support labor (amortized) | $10–20 |
| Payment processing (Stripe ~3%) | $9 |
| **Total COGS** | **~$60–90/shop/mo** |

At $299/mo revenue and ~$75 COGS, gross margin is **~75%**. Still attractive after support and operations overhead.

At scale (>50 shops), Supabase costs drop per-shop because of more efficient resource usage on a single project, possibly approaching $20/shop/mo. Margin trends upward over time.

### 10.6 Tenant ROI (Pops as example)

The system pays for itself many times over. Conservative estimate of weekly time saved per shop (Pops example, generalizes to all tenants):

| Activity | Hours/wk saved |
| --- | --- |
| Phone calls answered ("where is my job?") | 5 |
| Manual paperwork tracking and filing | 3 |
| Looking up job status from physical traveler | 2 |
| Communicating job status to customers | 1.5 |
| Reconciling QC notes from paper | 0.5 |
| **Total** | **12 hr/wk** |

At a loaded labor cost of **$50/hr** (wages + payroll tax + benefits + overhead):

- **12 hr/wk × $50/hr = $600/wk = ~$2,400/mo saved**

Compare to monthly system cost (~$130/mo Wave 1): **ROI of ~18x**.

Plus intangibles:

- Fewer dropped balls (jobs lost in the shuffle, customers forgotten)
- Faster customer trust (real-time visibility = professional brand)
- Reduced anxiety (the owner stops being the single source of truth in their own head)
- Foundation for growth (adding a second shift or second location is a software change, not a paperwork explosion)

The hardware payback period is roughly **1.5 months** of saved labor. The recurring monthly cost is recovered in **~2 days** of saved labor each month. Net, this is one of the highest-ROI investments Pops can make for the operational health of the business.

---

## 11. Verification log

Technical assumptions in this spec were independently verified by parallel research agents on 2026-04-26 against current vendor documentation. Findings baked into the spec above.

### 11.1 Supabase Auth Hook (Postgres function variant)

**Verified:**
- Function signature is `(event jsonb) returns jsonb`
- `app_metadata` claims set via `jsonb_set(claims, '{app_metadata}', ...)`
- Required claims that must be preserved: `iss, aud, exp, iat, sub, role, aal, session_id, email, phone, is_anonymous`
- Configured via Supabase Dashboard → Authentication → Hooks → Custom Access Token (Postgres function)
- Timeout budget: **2 seconds** (transaction-bound, non-retryable)
- Payload cap: 20 KB

**Critical finding (changed our design):**
- **Cannot perform writes inside the hook to `auth.*` tables** — causes deadlock per Supabase Issue #29073, surfaces as 5s timeout / HTTP 400 sign-in failure. **Our design defers `auth_user_id` linking to a separate `AFTER INSERT ON auth.users` trigger** instead of doing it inside the hook.
- Required grants: `GRANT EXECUTE ... TO supabase_auth_admin; REVOKE ... FROM authenticated, anon, public; GRANT SELECT ON staff, customer_users, workstations TO supabase_auth_admin`.

**Sources:**
- https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
- https://supabase.com/docs/guides/auth/auth-hooks
- https://github.com/supabase/supabase/issues/29073
- https://github.com/supabase/auth/issues/2038
- https://github.com/supabase/auth/issues/1561

### 11.2 Next.js 16 + @supabase/ssr

**Critical finding (changed our design):**
- **Next.js 16 renamed `middleware.ts` → `proxy.ts`** (function `middleware` → `proxy`). Edge runtime no longer supported for proxy — runs on Node only. Codemod available via `npx @next/codemod`.
- **`cookies()` from `next/headers` is fully async** in Next.js 16. Sync access removed.
- @supabase/ssr requires `getAll`/`setAll` cookie pattern (not deprecated `get`/`set`/`remove`).

**Verified:**
- Use `supabase.auth.getUser()` (not `getSession()`) on the server — validates with auth server.
- Cookies scope to exact host by default — `app.popsindustrial.com` cookies are NOT readable from `track.popsindustrial.com`. No domain override needed for our multi-domain isolation.
- Local dev: `*.localhost` reserved TLD resolves automatically (no `/etc/hosts` edits). Use `app.localhost:3000` and `track.localhost:3000`.
- Realtime subscriptions live ONLY in Client Components (Server Components can't hold long-lived sockets). Pass JWT via `supabase.realtime.setAuth(accessToken)` for RLS-aware channels.
- Service-role client for back-office only, with explicit caller authorization check before invoking.

**Sources:**
- https://nextjs.org/blog/next-16
- https://nextjs.org/docs/messages/middleware-to-proxy
- https://nextjs.org/docs/app/guides/upgrading/version-16
- https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- https://nextjs.org/docs/app/api-reference/functions/cookies
- https://supabase.com/docs/guides/auth/server-side/nextjs
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/guides/realtime/authorization
- https://supabase.com/docs/guides/realtime/realtime-with-nextjs

### 11.3 Rate limiting on Vercel (2026)

**Critical finding (changed our design):**
- **Vercel KV is gone** — auto-migrated to Upstash Redis via Vercel Marketplace in late 2024. Use `@upstash/ratelimit` + Upstash Redis from the Marketplace (unified billing, env vars auto-injected).
- Free tier (500K commands/month + 256 MB) covers our projected usage (~150-200K commands/month) with 60% headroom. **Total monthly cost: $0** for Wave 1.

**Verified:**
- `@upstash/ratelimit` library is current industry standard.
- Sliding window algorithm recommended for sign-in/magic-link rate limits.
- IP-based limits in `proxy.ts`; per-email/per-tenant limits in route handlers (need request body, can't do in proxy cheaply).
- Backup option: Postgres-based rate limiting via Supabase if Marketplace unavailable.

**Sources:**
- https://vercel.com/docs/marketplace-storage
- https://vercel.com/changelog/upstash-joins-the-vercel-marketplace
- https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
- https://github.com/upstash/ratelimit-js
- https://upstash.com/blog/edge-rate-limiting

### 11.4 PDF + QR for serverless

**Critical finding (changed our design):**
- **Vercel Pro plan REQUIRED** for PDF generation. Hobby's 10s timeout is risky (cold start + render). Pro gives 60s timeout, 3008 MB memory, 250 MB bundle, Fluid Compute (zero cold starts for 99.37% of requests per Vercel).

**Verified:**
- `@react-pdf/renderer` (v4.5.1, 290K weekly downloads) is appropriate for our use case (logo + QR + 10 text fields). Skip Puppeteer/Chromium — overkill.
- `qrcode` npm package, **SVG output** (vector — crisp at any DPI), error correction **Level H (30%)** required for shop floor packets that get coated/scratched.
- Cache PDFs in Supabase Storage by `job_id` (cuts function invocations ~95% since job data is stable post-creation).
- Stream responses with `renderToStream()` (not buffer) — lower memory, faster TTFB.
- Lazy-load `@react-pdf/renderer` inside route handler, not at module top — keeps it out of cold-start critical path for unrelated routes.

**Sources:**
- https://www.npmjs.com/package/@react-pdf/renderer
- https://www.npmjs.com/package/qrcode
- https://www.qrcode.com/en/about/error_correction.html
- https://vercel.com/blog/scale-to-one-how-fluid-solves-cold-starts
- https://vercel.com/blog/introducing-bytecode-caching-for-vercel-functions

---

## 12. Spec change log

| Date | Author | Version | Changes |
|---|---|---|---|
| 2026-04-26 | David K. | 1.0 | Initial spec consolidating brainstorming sessions. Audits 1-4 corrections baked in. Verified against current vendor docs. |
| 2026-04-26 | David K. (with audit agent) | 1.1 | Deep self-audit + independent agent audit. 14 critical fixes: SECURITY DEFINER on validate_employee_pin/next_job_number; defined missing wrapper functions (claim_workstation, record_workstation_heartbeat, release_workstation); audit_log RLS policies; multi-tenant fix for link_auth_user_to_actor trigger; route group URLs corrected (`/scan/enroll` not `/(scan)/enroll`); workstation refresh = 1 hour (not 90 days); BYPASSRLS dependency documented; pgcrypto extension explicitly enabled; cross-table email trigger migration ordering; messaging RLS typo (job → job_id); record_scan_event NULL-tenant checks; can_user_access_attachment_path defined; createWorkstation flow corrected (no 'pending' UUID placeholder); shop staff write access table added to RLS section. Plus ~12 important fixes (set_updated_at trigger; document overview numbers; section cross-refs; pgTAP test signatures; jobs_with_latest_event LATERAL join; photo compression standardized; is_first_job_created enforcement note; messages RLS tenant filter; Wave 1 entity_type CHECK tightened; etc.). |
| 2026-04-27 | David K. | 2.0 | **Multi-tenant whitelabel pivot.** Reframed product as multi-tenant vertical SaaS for industrial finishing (was single-tenant Pops CRM). Pops is now Tenant 1 — a customer like any other; no partnership/MSA/rev-share terms. Added Wave 4 (whitelabel + Tenant 2 sandblasting onboarding) extending timeline to 36 weeks (28-32 with parallel agents). New Decisions #14 (whitelabel + workflow templates), #15 (super-admin console with consent-gated impersonation). New roles: `tenant_admin`, `agency_super_admin`. New audience: `staff_agency`. New module-map entries: §4.1 Module 20 (`tenant-config`), Module 21 (`workflow-templates`), Module 22 (`agency-console`). Schema additions: §3.9 (Wave 4 — `tenant_workflow_template` new table, `tenant_domains` Wave 4 column additions extending Wave 1 table, `agency_consent_token` new table, `agency_users` new table, `shop_settings` Wave 4 column expansions, `audit_log` enum additions, `app.has_consent_for()` helper). New auth flows: §5.8 (Wave 4 — agency super-admin sign-in, consent-token impersonation, JWT claim extensions). New roadmap §6.8 (Wave 4 detailed plan) + §6.9 (Wave 4 ship gate). New risks §8 #35-39 (tenant 2 surfacing Pops-specific assumptions, sandblasting workflow generalization, template versioning leaks, custom-domain SSL, super-admin backdoor). Generalized §1 Decision #1, #7, #11 (multi-tenant + multi-vertical + per-tenant domains). §2.2 audience list expanded to four audiences (added `staff_agency`). §6.4.1 deferred features renumbered "Wave 4" → "Wave 5+" to avoid confusion with new Wave 4 (whitelabel). §7-§10 references to Pops generalized where they apply to all tenants; Pops-specific Wave-1 references kept where appropriate. §10 Cost & Commercial: removed design-partner / MSA / revenue-share / pricing-speculation content (Pops is a customer paying standard rates); kept platform infrastructure costs and per-tenant hardware. §13 Sign-off: removed MSA dependency in favor of standard service agreement. |

Future revisions to this document should add a row here describing what changed and why.

---

## 13. Sign-off

This spec is the contract for what gets built. Before code is written:

- [ ] **Owner (David K.)** has read the full spec and agrees with all decisions
- [ ] **Pops's owner** (Tenant 1 admin) has read sections 0, 1, 6 (roadmap), 7 (operational), 9 (testing), 10 (cost) and confirmed scope
- [ ] **Pops's IT contact** has read section 7 (operational) and confirmed hardware/network plan
- [ ] **WiFi survey** completed at the shop floor (Week 0 task)
- [ ] **Domain `popsindustrial.com`** verified available or owned (Wave 1 launch domain)
- [ ] **Vercel Pro + Supabase Pro** subscriptions activated
- [ ] **Hardware orders** placed (or scheduled to be placed in Week 4)
- [ ] **Service agreement** with Tenant 1 (Pops) signed (standard SaaS terms — no design-partner / MSA carve-outs needed)

When all checkboxes are filled, proceed to `superpowers:writing-plans` to break this spec into an executable implementation plan, starting with Wave 1 Week 1.

