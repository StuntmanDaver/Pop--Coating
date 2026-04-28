# Requirements: Pops Industrial Coatings — Operations Platform (Wave 1)

**Defined:** 2026-04-28
**Core Value:** Replace paper-based job tracking with a QR scan loop that gives shop owners live production visibility and eliminates "where is my job?" calls — both for office staff and customers.

## v1 Requirements

### Infrastructure & Scaffold

- [ ] **INFRA-01**: Next.js 16 App Router repo initialized with TypeScript strict, Tailwind v4, shadcn/ui, and pnpm as package manager
- [ ] **INFRA-02**: Supabase project created and connected; Vercel project configured with `app.popscoating.com` (office) and `track.popscoating.com` (portal) domains
- [ ] **INFRA-03**: `tenants` table exists; every business table has `tenant_id uuid not null references public.tenants(id)`; `app.tenant_id()` SECURITY DEFINER helper reads JWT `app_metadata.tenant_id`; RLS policies use `tenant_id = app.tenant_id()`
- [ ] **INFRA-04**: Resend configured with SPF/DKIM/DMARC for `popscoating.com`; Upstash Redis wired for rate limiting (`@upstash/ratelimit` sliding-window); Sentry initialized and tagging every event with `tenant_id`
- [ ] **INFRA-05**: `src/proxy.ts` (renamed from middleware.ts in Next.js 16) handles multi-domain routing: `app.*` routes to `(office)`, `track.*` routes to `(portal)`
- [ ] **INFRA-06**: All required SQL SECURITY DEFINER helpers created: `app.tenant_id()`, `app.audience()`, `app.role()`, `app.staff_id()`, `app.workstation_id()`, `app.company_id()`, `app.set_updated_at()`
- [ ] **INFRA-07**: ESLint rules enforce module boundaries (`no-restricted-imports`, `madge --circular`) and service-role gating; CI pipeline runs type check, lint, and test on every PR

### Auth

- [ ] **AUTH-01**: Office staff can sign in with email and password; session uses `@supabase/ssr` httpOnly cookie scoped to `app.popscoating.com`; session TTL is 30 days; auth decisions always use `supabase.auth.getUser()` (never `getSession()`)
- [ ] **AUTH-02**: Workstation tablet is enrolled as a synthetic Supabase user via admin-generated QR code ceremony; workstation session TTL is 1 hour (stolen-tablet mitigation); tablet re-authenticates silently
- [ ] **AUTH-03**: Customer portal uses magic-link auth scoped to `track.popscoating.com`; customer session is read-only and scoped to their company's jobs; session TTL is 30 days
- [ ] **AUTH-04**: JWT `app_metadata` carries `tenant_id`, `audience` (office/shop/customer), and `role`; `custom_access_token_hook` populates claims; hook must not write to any tables (Supabase deadlock constraint)
- [ ] **AUTH-05**: `requireOfficeStaff()`, `requireShopStaff()`, `requireCustomer()` helpers in `src/shared/auth-helpers/require.ts` enforce audience at the Server Action / route level; `getCurrentClaims()` in `claims.ts` reads JWT claims

### CRM

- [ ] **CRM-01**: Office staff can create, view, edit, and archive company records (name, shipping/billing addresses, phone, email, tax ID, payment terms, customer-since date)
- [ ] **CRM-02**: Office staff can create, view, edit, and archive contact records associated with a company (name, email, phone, role title, primary-contact flag — one per company)
- [ ] **CRM-03**: Staff can log activities against a company, contact, or job (type: call/email/meeting/note; subject, body, occurred-at timestamp, customer-visible flag, staff attribution)
- [ ] **CRM-04**: Staff can create tenant-scoped tags with a name and color, and apply them to jobs, companies, and contacts

### Jobs & QR Packets

- [ ] **JOB-01**: Office staff can create a job and move it through `intake_status`: draft → scheduled → in_production → archived; job number auto-generates in format `JOB-YYYY-NNNNN`, atomic across concurrent inserts, resets yearly
- [ ] **JOB-02**: Every job has a `production_status` with 7 stages (Received → Prep → Coating → Curing → QC → Completed → Picked Up); transitions are any-to-any (flexible); backward transitions are flagged `is_rework=true` in history; `on_hold` flag is orthogonal to status and requires a reason
- [ ] **JOB-03**: Direct UPDATE of `production_status` is forbidden at the database level (column-level REVOKE on `authenticated`); all transitions go only through `app.record_scan_event()` SECURITY DEFINER function
- [ ] **JOB-04**: A job can be split into multi-color children using `parent_job_id`; split is only allowed when `intake_status` is `draft` or `scheduled`
- [ ] **JOB-05**: Every job auto-generates a 16-char URL-safe `packet_token`; office staff can print a PDF job packet containing: shop logo, job number, customer name, contact, due date, part count, weight, dimensions, color/coating spec, special instructions, QR code (SVG, ECC level H), manual-entry fallback (last 8 chars of token), and stage checklist with checkbox boxes
- [ ] **JOB-06**: `packet_dirty` flag is set true on any job edit and false on print; UI displays a "needs reprint" badge when true

### Scanner

- [ ] **SCAN-01**: Shop floor staff can scan a job packet QR code using the tablet camera (`@zxing/browser`); manual token entry is available as fallback when camera is unavailable
- [ ] **SCAN-02**: Shop floor staff tap their PIN at the workstation before scanning to attribute the scan to their identity; the workstation validates the PIN via `app.validate_employee_pin()` SECURITY DEFINER function
- [ ] **SCAN-03**: Admin can initiate the workstation enrollment ceremony: admin generates a one-time enrollment QR code; tablet scans it; tablet is registered as a synthetic Supabase user via `app.claim_workstation()`
- [ ] **SCAN-04**: Scanner operates offline when WiFi is degraded: scan events queue in IndexedDB and sync to the server when connectivity is restored
- [ ] **SCAN-05**: Scanner can capture a photo at scan time (damage documentation at Receiving); photo is compressed via canvas to JPEG quality 0.7, max 1024px longest edge, before upload

### Office Dashboard

- [ ] **DASH-01**: Office staff see a kanban board showing all active jobs grouped by `production_status` stage, with real-time updates via Supabase Realtime
- [ ] **DASH-02**: Dashboard supports filters: by stage, by company, by date range, and by on-hold status
- [ ] **DASH-03**: Dashboard displays stat cards: jobs currently in flight, throughput (completed this week), and overdue jobs

### Customer Portal

- [ ] **PORTAL-01**: Customer accesses the portal via a magic link delivered to their email; portal is scoped to only their company's jobs (RLS enforced)
- [ ] **PORTAL-02**: Customer can view a filterable, searchable list of their jobs showing current status and due date
- [ ] **PORTAL-03**: Customer can open a job detail page showing a visual progress tracker (current stage highlighted) and the full scan timeline (who, what, when)
- [ ] **PORTAL-04**: Customer can update their account settings (name, email)

### Observability & Ops

- [ ] **OPS-01**: An audit log records sensitive operations: staff invites, deactivations, role changes, and other security-relevant actions; each entry is immutable and tagged with `tenant_id` and actor
- [ ] **OPS-02**: A comprehensive pgTAP RLS test suite covers: cross-tenant data isolation, audience isolation (office/shop/customer cannot access each other's routes), and authorization of SECURITY DEFINER functions
- [ ] **OPS-03**: Supabase PITR (point-in-time recovery) is enabled; weekly offsite backup to Backblaze B2 is configured and verified

---

## v2 Requirements (Wave 2 — deferred)

- Inventory tracking (raw materials, job parts received/completed/damaged/rework)
- Color library (RAL/Pantone references)
- QC inspections (defect tracking, severity, photos, requires-rework flag)
- Alerts engine (stuck jobs, low inventory, overdue, stage skipped, duplicate scans)
- Email notifications via Resend (received, completed, delay, picked_up, digests)
- Multi-role customer portal (admin / viewer / accounting)
- Customer admins can invite peers within their company
- MFA for admin role (Supabase MFA built-in)
- Spanish UI (i18n infrastructure in place from Day 1 via `next-intl`)

## Out of Scope (Wave 1)

| Feature | Reason |
|---------|--------|
| Custom domains / per-tenant theming | Wave 4 — whitelabel layer |
| Tenant-config UI / agency super-admin console | Wave 4 |
| Stripe billing | Wave 4 |
| Quotes / invoices / analytics | Wave 3 |
| Customer ↔ shop messaging | Wave 3 |
| Employee badge scanning (RFID/NFC) | v1.1+ if requested; PIN ships faster |
| Rack / bin / pallet label printing | Useful at >50 concurrent jobs |
| SMS / push notifications | Wave 3+ |
| Native mobile app | PWA covers needs; high build cost |
| Multi-shop support (tenant 2+) | Wave 4 |

## Traceability

*Updated: 2026-04-28 (roadmap creation — 4 phases, coarse granularity)*

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| INFRA-05 | Phase 1 | Pending |
| INFRA-06 | Phase 1 | Pending |
| INFRA-07 | Phase 1 | Pending |
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| CRM-01 | Phase 2 | Pending |
| CRM-02 | Phase 2 | Pending |
| CRM-03 | Phase 2 | Pending |
| CRM-04 | Phase 2 | Pending |
| JOB-01 | Phase 2 | Pending |
| JOB-02 | Phase 2 | Pending |
| JOB-03 | Phase 2 | Pending |
| JOB-04 | Phase 2 | Pending |
| JOB-05 | Phase 2 | Pending |
| JOB-06 | Phase 2 | Pending |
| SCAN-01 | Phase 3 | Pending |
| SCAN-02 | Phase 3 | Pending |
| SCAN-03 | Phase 3 | Pending |
| SCAN-04 | Phase 3 | Pending |
| SCAN-05 | Phase 3 | Pending |
| DASH-01 | Phase 3 | Pending |
| DASH-02 | Phase 3 | Pending |
| DASH-03 | Phase 3 | Pending |
| PORTAL-01 | Phase 4 | Pending |
| PORTAL-02 | Phase 4 | Pending |
| PORTAL-03 | Phase 4 | Pending |
| PORTAL-04 | Phase 4 | Pending |
| OPS-01 | Phase 4 | Pending |
| OPS-02 | Phase 4 | Pending |
| OPS-03 | Phase 4 | Pending |
