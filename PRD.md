# Product Requirements Document

## [Platform TBD] — Industrial Finishing Operations Platform

**Built by:** [Agency TBD] · **Launch tenant:** Pops Industrial Coatings  
**Document version:** 3.0 (multi-tenant whitelabel pivot)
**Date:** 2026-04-27
**Status:** Active — source of truth for product requirements
**Owner:** David K.
**Companion docs:** [Design spec](docs/DESIGN.md) · [Parallel execution plan](docs/EXECUTION.md) · [README](README.md)

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Vision & goals](#2-vision--goals)
3. [Problem statement](#3-problem-statement)
4. [Target users & personas](#4-target-users--personas)
5. [Scope](#5-scope)
6. [Functional requirements](#6-functional-requirements)
7. [Non-functional requirements](#7-non-functional-requirements)
8. [Hardware & environment](#8-hardware--environment)
9. [Architecture overview](#9-architecture-overview)
10. [Roadmap](#10-roadmap)
11. [Success metrics](#11-success-metrics)
12. [Risks](#12-risks)
13. [Operational costs](#13-operational-costs)
14. [Document index](#14-document-index)
15. [Glossary](#15-glossary)
16. [Change log](#16-change-log)

---

## 1. Executive summary

**Product:** A **multi-tenant vertical SaaS for industrial finishing shops** — powder coating, sandblasting, media blasting, galvanizing, plating, and adjacent verticals. Whitelabel from day 1: per-tenant branding, custom domains, configurable workflow templates per vertical. Pops Industrial Coatings is the launch tenant (Tenant 1).

**Core innovation:** **QR-tracked job packets**. Every job gets a printed packet with a unique QR code. Shop floor employees scan the packet at each workstation to advance the job through production stages. Every scan creates a timestamped, employee-attributed record. Customers see real-time status via a magic-link portal — branded as the tenant's own.

**Primary outcome:** Replace paper-based job tracking with digital, real-time visibility for shop owners and customers across the industrial finishing industry. Reduce "where is my job?" phone calls. Surface bottlenecks. Enable data-driven decisions. Deliver as a turnkey platform that an agency operator (us) installs, configures, and supports per tenant.

**Build approach:** Phased rollout in **four waves over ~36 weeks**. Waves 1-3 build the platform with Pops as launch tenant (Wave 1 ships internal MVP + customer portal at Week 13; Waves 2-3 expand inventory, alerts, quotes, and analytics by Week 28). **Wave 4 (Weeks 29-36)** adds the whitelabel layer — custom domains, theming, vertical workflow templates, tenant-config UI, agency super-admin console — required to onboard Tenant 2+ (typically a sandblasting shop).

**Two faces, one codebase:** The system has two faces — an internal operations platform (CRM + production tracking + inventory + accountability) and an external customer experience portal (live status, timeline, notifications). Both run from one codebase, deployed under per-tenant domains.

---

## 2. Vision & goals

### 2.1 Product vision

Become the **operational backbone for industrial finishing shops** across powder coating, sandblasting, media blasting, galvanizing, plating, and adjacent verticals. Start with one shop (Pops, powder coating). Productize. Whitelabel. Sell to the industry.

**Strategic differentiator:** Most industrial finishing shops have nothing customer-facing — they run on phone calls, hand-written travelers, and spreadsheets. This system is not just a CRM or shop tracker — it's a **customer experience platform that competitors lack**. The portal is the wedge: shops adopt the platform because it gives their customers something rivals can't offer. That advantage compounds — once a shop's customers expect live tracking, switching coating vendors means losing it.

### 2.2 Operational model

The platform is delivered through a high-touch services layer:

- **Installs** — domain setup, branding intake, workflow template configuration, hardware procurement guidance, on-site or remote training
- **Supports** — ongoing maintenance, feature requests, hardware troubleshooting, escalations from tenant customer-portal issues
- **Builds** — one platform, one codebase, configured per tenant; **no per-client custom code**

Founder + 1 Implementation Specialist (added at ~Tenant 3) handle onboarding and Tier-2 support. This shape informs the architecture: a super-admin console (§6.19) is required because the Implementation Specialist needs cross-tenant access for support without violating tenant data isolation.

### 2.3 Wave-by-wave goals

| Wave | Weeks | Goal | Ships |
|---|---|---|---|
| **Wave 1** | 1-13 | Replace Pops's paper/spreadsheet tracking with the QR scan loop + customer portal | Internal MVP (jobs, packets, scanner, dashboard) + read-only customer portal |
| **Wave 2** | 15-20 | Capture material costs and deliver proactive alerts; expand customer-side features | Inventory tracking, QC inspections, alerts, email notifications, multi-role customer portal |
| **Wave 3** | 21-28 | Close the commercial loop and deliver insights for Pops | Quotes, invoices, payments, analytics dashboards, public tracking links, customer↔shop messaging |
| **Wave 4** | 29-36 | **Make the platform whitelabel-ready and onboard Tenant 2** (sandblasting) | Custom domains, per-tenant theming, vertical workflow templates, tenant-config UI, agency super-admin console, onboarding playbook, Tenant 2 live |

### 2.4 Strategic goals (post-Wave 4)

- **Tenant 2 onboarded** (sandblasting shop) on the same codebase, validating multi-vertical and whitelabel architecture end-to-end
- **Tenants 3-5 onboarded** within 6 months of Wave 4 ship — mix of powder coating, sandblasting, and one adjacent vertical
- **First operational hire**: Implementation Specialist at ~Tenant 3 (offloads onboarding and Tier-2 support)
- **Vertical horizon (24 months)**: powder coating ✓ → sandblasting → 2-3 adjacent verticals (galvanizing, plating, media blasting, ceramic coating) based on demand and workflow fit

---

## 3. Problem statement

Industrial finishing shops — powder coating, sandblasting, media blasting, galvanizing, plating — typically struggle with:

- **Lost jobs on the floor** — paper travelers fall off pallets, get coated, get misfiled
- **Poor communication between office and shop** — phone tag, "I think it's in coating?", missed handoffs
- **No accurate timing data** — owners can't answer "how long does a job actually take?"
- **No employee accountability for movement** — when a job goes wrong, no one knows who touched it last
- **Manual paperwork with no digital record** — hard to search, easy to lose, no analytics
- **Inventory usage not tied to jobs** — powder costs invisible to job-cost analysis
- **No visibility into bottlenecks** — can't tell if curing oven is the constraint or if prep is

This system solves those by creating:

- **QR-tracked job packets** — every job has a unique scannable identity from intake to delivery
- **Scan-based job movement** — every stage transition is a deliberate, recorded event
- **Employee-linked activity logs** — every scan is attributed to a real person via PIN tap
- **Real production timing data** — duration in every stage, computed from scan timestamps
- **Customer self-service** — magic-link portal eliminates "where is my job?" calls

---

## 4. Target users & personas

### 4.1 Front office staff

**Day-in-life:** answers customer calls, takes orders, generates quotes, creates jobs in the system, prints packets, hands packets to receiving when parts arrive.

**Key tasks:**
- Create company + contact records (CRM)
- Create job records with description, parts, color, due date
- Print job packet PDFs with QR codes
- Mark jobs scheduled when approved
- Field calls from customers and check status
- Manage customer portal access (invite, deactivate)

**Permissions:** office role — full CRM, full job intake, can invite staff and customers.

### 4.2 Shop floor staff

**Day-in-life:** receives parts, masks/preps, sprays powder, loads ovens, inspects finished work, hands off for pickup. Wears gloves, gets dusty.

**Key tasks:**
- Tap PIN at workstation tablet to identify themselves
- Scan job packet QR code with tablet camera
- Tap a button to advance the job to the next stage
- Snap a photo of damage at receiving
- Mark a job on hold if something's wrong
- Record QC results (Wave 2)

**Permissions:** shop role — scanner access only; no CRM, no settings.

**Constraints:** noisy environment, gloves on, occasional dust on screens, sometimes WiFi degrades. UI must be glove-friendly (large touch targets), high-contrast, and queue scans offline if connectivity drops.

### 4.3 Shop managers / owners

**Day-in-life:** monitors active jobs, talks to customers, makes scheduling decisions, troubleshoots when things go wrong, looks at performance over time.

**Key tasks:**
- View kanban dashboard ("where is every job right now")
- Investigate stuck jobs (alerts in Wave 2)
- Review employee output and stage durations (Wave 3 analytics)
- Approve quotes and convert to jobs (Wave 3)
- Run reports for billing and decisions (Wave 3)

**Permissions:** office or admin role.

### 4.4 Customers (companies that send work to Pops)

**Day-in-life:** sends a PO, drops off parts, waits for finished work, picks up. Wants to know status without making a phone call.

**Key tasks:**
- Click a magic link from email and see their jobs
- Drill into a specific job for current status + timeline
- Filter/search their job history
- (Wave 2) receive email notifications on key events
- (Wave 3) message shop directly within the portal
- (Wave 3) approve quotes online

**Permissions:** customer role — read-only on their own company's jobs and timeline. Multi-role within a company added in Wave 2 (admin / viewer / accounting).

### 4.5 Tenant admin (shop owner managing their own platform)

**Day-in-life:** signs up via the agency; works with the Implementation Specialist to configure their tenant; thereafter manages tenant-level settings (branding, billing, user invites, workflow tweaks). Often the same person as Shop Manager / Owner in small shops.

**Key tasks:**
- Configure tenant branding (logo, brand color, accent color, secondary email logo)
- Configure custom domain (e.g., `crm.acmecoatings.com`) — done with Implementation Specialist initially, self-serve once stable
- Manage billing (review invoices, update payment method)
- Invite/deactivate office staff, shop staff, and customer users
- Tweak workflow stages within their vertical's template (e.g., split "Coating" into "Spray + Cure" if their process needs it)
- Toggle modules (e.g., disable color library if not powder coating)
- Submit feature requests to the agency

**Permissions:** `tenant_admin` role — full access within their tenant; cannot affect other tenants. Wave 4 introduces this role.

### 4.6 Agency implementation specialist

**Day-in-life:** the agency's customer-facing operator. Takes new tenants from sale to live in 4-6 weeks. Onboards, trains, configures, supports.

**Key tasks:**
- Onboard new tenants: domain setup, branding intake, hardware procurement guidance, workflow template selection
- Lead workstation enrollment ceremony at the tenant's shop (in person or remote)
- Train tenant's office staff and shop staff
- Handle ongoing support tickets (Tier 2; Tier 1 handled by self-serve docs)
- Coordinate hardware orders, installation, and replacements
- Escalate platform bugs and feature requests to the founder/dev

**Permissions:** `agency_super_admin` role — cross-tenant access for support purposes; all actions logged in the audit trail; tenant-scoped data viewing requires explicit "support session" with tenant consent. Wave 4 introduces this role.

---

## 5. Scope

### 5.1 Wave 1 — In scope (Weeks 1-13, ships Week 13)

- Multi-tenant database (`tenant_id` on every table; RLS at DB level)
- Three audiences in Wave 1: office staff, shop staff (per-workstation Supabase auth + PIN tap), customers (magic link). Wave 4 adds a fourth: agency super-admin (cross-tenant, consent-token-gated).
- Two domains in Wave 1: `app.popsindustrial.com` (internal) + `track.popsindustrial.com` (customer portal). Wave 4 generalizes to per-tenant domains (`app.<tenant>.com`, `track.<tenant>.com`) plus `admin.<platform>.com` for the agency console.
- CRM: companies, contacts, activities, tags
- Jobs with intake_status (draft → scheduled → in_production → archived) + production_status (Received → Prep → Coating → Curing → QC → Completed → Picked Up) with **flexible (any-to-any) transitions** + `on_hold` flag with reason
- Multi-color jobs via parent/child (`parent_job_id`)
- QR job packets (PDF with logo, job info, QR code, manual-entry token, stage checklist) — caching, reprint detection
- Scanner page (camera-based via @zxing/browser, manual entry fallback, snap-photo-at-scan, offline mode with IndexedDB queue)
- Workstation enrollment ceremony (admin generates QR, tablet scans, becomes a synthetic Supabase user)
- Office dashboard (kanban by stage, filters, stat cards, realtime updates)
- Customer portal (job list with filter/search, job detail with visual progress tracker + timeline, account settings)
- Audit log (sensitive operations: invites, deactivations, role changes, etc.)
- Comprehensive RLS test suite (cross-tenant, audience-isolation, function authorization)
- Backups (Supabase PITR + weekly offsite to Backblaze B2)
- Sentry observability from Day 1
- Email infrastructure (Resend with SPF/DKIM/DMARC)

### 5.2 Wave 2 — Planned (Weeks 15-20)

- Inventory tracking (raw materials: powder, masking, chemicals; job-related: parts received/completed/damaged/rework)
- Color library (RAL/Pantone references)
- QC inspections (defect tracking, severity, photos, requires-rework flag)
- Alerts engine (job stuck in stage, low inventory, overdue jobs, stage skipped, duplicate scans, wrong workstation, missing paperwork)
- Email notifications (Resend templates: received, completed, delay, picked_up, daily/weekly digest)
- Multi-role customer portal (admin / viewer / accounting)
- Customer admins can invite peers within their company

### 5.3 Wave 3 — Planned (Weeks 21-28)

- Quotes (line items, send PDF, approve/reject/revise, convert to job)
- Invoices (generation from job, send, payment recording, aging report)
- Optional: Stripe online payments (+1 week if scoped)
- Analytics dashboards (production metrics, stage bottlenecks, employee output, inventory usage)
- Public job tracking links (no-login tokenized URLs)
- Customer ↔ shop messaging (per-job threads with realtime)

### 5.4 Wave 4 — Planned (Weeks 29-36)

**Goal:** Make the platform whitelabel-ready. Onboard Tenant 2 (sandblasting shop).

- **Custom-domain support** — Vercel multi-domain config; per-tenant DNS verification; auto-SSL; tenant-side instructions for adding a CNAME or A record
- **Per-tenant theming** — logo, brand color, accent color, optional secondary email logo; CSS-variable-based theming engine; live preview in tenant admin UI
- **Vertical workflow templates** — predefined stage sets per vertical (powder coating: 7 stages; sandblasting: 5-6 stages; media blasting: 5 stages; galvanizing: 6 stages); custom variant for "other"
- **Workflow template editor** — tenant admins can clone the default template for their vertical and tweak stage names, count (3-12), order; existing jobs locked to their original template version
- **Module on/off toggles** — color library, QC inspections, public tracking, messaging, quotes/invoices togglable per tenant (defaults set by vertical template)
- **Tenant-config UI** — admin dashboard for `tenant_admin` role to manage branding, domain, workflow, modules, billing, users
- **Agency super-admin console** — cross-tenant view for the Implementation Specialist (with audit logging on every read); tenant-impersonation flow with explicit consent token
- **Tenant onboarding playbook** — operational doc the agency uses to take a tenant from signed contract to live in 4-6 weeks (see Appendix D)
- **Whitelabel checklist** — per-tenant configuration checklist verifying brand, domain, workflow, hardware, training (see Appendix E)
- **Stripe billing integration** — monthly subscriptions + onboarding fees; invoice generation; failed-payment handling
- **Tenant 2 (sandblasting) onboarding** — first whitelabel install; validates the playbook end-to-end and uncovers what was Pops-specific vs. truly platform-level

### 5.5 Out of scope (deferred features — see design spec §6.4.1)

| Feature | Why deferred | When (estimate) |
|---|---|---|
| Employee badge scanning (RFID/NFC alternative to PIN) | PIN ships faster; data model already supports adding `badge_value` later | v1.1+ if requested |
| Rack / bin / pallet label printing | Useful at >50 concurrent jobs scale | Wave 4 / v2.0 |
| SMS notifications (Twilio) | Email covers 95% of customer-comms need | Wave 3.5 / v1.5 |
| Push notifications (web push) | iOS Safari requires PWA install + iOS 16.4+; complexity vs. value | Indefinite |
| Native mobile app (iOS/Android) | PWA covers most needs; native adds significant build cost | Indefinite |
| Multi-shop support for tenant 2+ | Architecture supports it; UX (tenant switcher, billing) needs work | When tenant 2 signs |
| Spanish UI (i18n complete) | English-only Wave 1; `t()` infrastructure in place from Day 1 | Wave 2 |
| MFA for admin role | Supabase MFA built-in; not blocking Wave 1 launch | Wave 2 |

---

## 6. Functional requirements

### 6.1 CRM module (Wave 1)

**Companies** must support: name, separate shipping/billing addresses, phone, email, tax ID, payment terms, customer-since date, archive (soft delete).

**Contacts** must support: company association, name, email, phone, role title, primary-contact flag (one per company), archive.

**Activities** must support: polymorphic association (company / contact / job), type (call / email / meeting / note / sms), subject, body, customer-visible flag, occurred-at timestamp, attributable to staff member.

**Tags** must support: tenant-scoped name, color, polymorphic application to jobs / companies / contacts / inventory items.

### 6.2 QR job packet system (Wave 1)

Every job must:
- Auto-generate a unique job number on creation in format `PREFIX-YYYY-NNNNN` (e.g., `JOB-2026-00124`), atomic across concurrent inserts, year-reset
- Auto-generate a 16-char URL-safe random `packet_token` for QR encoding
- Be printable as a PDF packet containing: shop logo, job number, customer name, contact, due date, part count, weight, dimensions, color/coating spec, special instructions, QR code (SVG, error-correction level H), manual-entry fallback (last 8 chars of token printed in large readable text), stage checklist with checkbox boxes
- Track `packet_dirty` flag — set true on any job edit, false on print, surfaces "needs reprint" UI badge

### 6.3 Production workflow (Wave 1)

Production stages: **Received → Prep → Coating → Curing → QC → Completed → Picked Up**

- Transitions are **flexible** (any-to-any) to support rework, multi-color back-passes, and corrections
- Backward transitions automatically flagged `is_rework=true` in history for analytics
- `on_hold` flag is **orthogonal** to status — any stage can be paused with a required reason
- Multi-color jobs use parent/child pattern (parent has children with `parent_job_id`)
- Multi-color split allowed only when `intake_status` is `draft` or `scheduled`
- Direct UPDATE of `production_status` is **forbidden** at the DB level — all transitions go through the `record_scan_event` SECURITY DEFINER function

### 6.4 Scanner interface (Wave 1)

The scanner page must:
1. Accept workstation enrollment via `device_token` (one-time setup creates a synthetic Supabase user per tablet)
2. Display employee picker (tile grid, with filter input if >12 employees)
3. Validate 4-digit PIN with bcrypt hash, atomic row lock, lockout after 5 failures for 15 minutes
4. Activate camera and decode QR codes (via @zxing/browser)
5. Support manual entry fallback (input accepts last 8 chars of packet_token, prefix-matches within tenant)
6. Identify the job on scan, identify the employee (PIN session), identify the workstation (device_token)
7. Record timestamp on scan
8. Show current job status
9. Allow next-stage selection with valid stage buttons
10. Warn explicitly when scanning to an unusual stage given the workstation's `default_stage` (require override tap)
11. Support optional photo capture (canvas → JPEG quality 0.7, max 1024px) attached to the scan event
12. Provide sound feedback + visual confirmation on success (Vibration API not supported on iOS Safari — silent fallback)
13. Operate **offline** with IndexedDB queue, foreground replay on reconnect, conflict resolution UI
14. Auto-release after 4 hours of inactivity (configurable in `shop_settings.tablet_inactivity_hours`)

The scanner page **must work in any modern browser** with `getUserMedia` support — not exclusively iPads. Recommended hardware: wall-mounted iPads (5 production + 1 spare). Workstation PCs with USB cameras or Android tablets are supported alternatives.

### 6.5 Inventory module (Wave 2)

**Raw materials** must track: name, SKU, category (powder / masking / chemicals / consumables / other), unit type, quantity on hand, reorder level, unit cost, supplier, location, optional QR value.

**Inventory movements** (immutable audit trail) must record: item, optional job, employee, movement type (consumption / restock / adjustment / damage / transfer), signed quantity, unit cost at time of movement, reference (PO, invoice), notes.

**Job-related inventory** must track per job: parts received, parts completed, parts damaged, parts rework, materials consumed (with cost rollup).

**Color library** must store RAL/Pantone references with hex preview, manufacturer, SKU; jobs can reference a color library entry instead of free-text color.

### 6.6 Alerts engine (Wave 2)

Must support these alert types:
- Stage duration exceeds threshold (e.g., job in curing >5 hours)
- Low inventory (item below reorder level)
- Overdue job (past due_date, not yet completed)
- Stage skipped (jumped multiple stages without intermediate scan)
- Duplicate scan (same job scanned twice in <1 minute)
- Wrong workstation scan (workstation's default_stage doesn't match the scan target)
- Missing paperwork (job marked in_production without packet_token — should be impossible by design)

Alerts must:
- Be evaluated by a Supabase Edge Function on a 5-minute cron
- Be acknowledgeable by staff with attribution
- Optionally send email notifications based on rule config

### 6.7 Customer portal (Wave 1, expanded in Waves 2-3)

**Wave 1:**
- Magic-link sign-in (no passwords)
- Anti-enumeration (silent success on unknown email; rate-limited)
- Job list with filter (status) + search (job_number) + filter by date range
- Job detail with visual progress tracker (7 stages, current highlighted) + timeline (only `customer_visible=true` events)
- Account settings page (edit name, email — Wave 2 adds notification prefs, Wave 2+ adds data export for CCPA/GDPR)
- Realtime updates (status changes appear without page refresh)
- Custom branding (shop logo + brand color from `shop_settings`)
- Hosted at `track.popsindustrial.com` for Tenant 1 (separate cookie pool from `app.popsindustrial.com`); Wave 4 generalizes to per-tenant `track.<tenant>.com` domains via `tenant_domains`

**Wave 2:**
- Customer roles within a company (admin / viewer / accounting)
- Customer admins can invite peers
- Notification preferences UI (email on received, completed, delayed, picked up; daily/weekly digest)

**Wave 3:**
- Quote viewing and approval
- Invoice viewing and (optional) online payment
- Public no-login tracking links (tokenized URLs with rate-limit protection)
- Per-job messaging thread with the shop

### 6.8 Notifications (Wave 2)

Must send transactional emails (via Resend) for:
- Job received (parts arrived at shop)
- Job completed (ready for pickup)
- Delay alert (job past due date)
- Job picked up (confirmation)
- Daily digest (optional, per-customer preference)
- Weekly digest (optional, per-customer preference)

Bounce/complaint webhooks must update `notification_log.status` for deliverability monitoring. Customer can manage preferences in account settings.

### 6.9 Analytics & reporting (Wave 3)

Must compute and visualize:
- Average turnaround time per stage (and overall)
- Stage duration histograms (p50, p95)
- Bottleneck detection (which stage has highest p95 duration)
- Employee output (jobs scanned per employee per day/week)
- Workstation throughput
- Inventory usage per job (cost rollup)
- Low-stock trends
- Customer-facing job history (Wave 3 enhancement: customers see their own historical metrics)

Charts via Recharts. Materialized views added if any dashboard exceeds 2-second load time.

### 6.10 Public job tracking (Wave 3)

Generate per-job tokenized URLs for sharing without authentication:
- Format: `https://track.popsindustrial.com/track/{token}` (32-char URL-safe random)
- Rate-limited per token + per IP
- Tokens can have expiry
- Read-only view; no sensitive customer data exposed
- Office staff create from job detail page

### 6.11 Quotes & invoices (Wave 3)

**Quotes:**
- Line items with description, quantity, unit, unit price, line total (computed)
- Subtotal, tax rate, tax amount, total
- Status lifecycle: draft → sent → approved/rejected/expired/revised
- Revisions linked via `revision_of_quote_id`
- PDF generation + email send via Resend
- Conversion to draft job on approval

**Invoices:**
- Generated from completed jobs or approved quotes
- Same line-item structure
- Status: draft → sent → paid/partial/overdue/void
- Payment records (check / card / ACH / cash / other) with reference and received_at
- Outstanding balance calculation
- Aging report (30 / 60 / 90 day buckets)
- Optional: Stripe integration for online payments (+1 week if in scope)

### 6.12 Messaging (Wave 3)

- Per-job message thread between shop and customer
- Realtime delivery via Supabase Realtime
- Email notification on new message (uses notifications module)
- Read receipts via `read_at`
- Customer side: embedded in job detail page
- Office side: thread list per job

### 6.13 Office / Manager dashboard (Wave 1)

The office homepage at `app.popsindustrial.com/` shows a live operational view of the shop. Original PRD §17 ("Manager Dashboard") covered most of this; this section makes it explicit.

**Must show (Wave 1):**
- **Kanban by stage** — every active job, grouped by `production_status` (Received | Prep | Coating | Curing | QC | Completed | Picked Up). Drag-disabled (status changes only via scan). Click a card to drill into job detail.
- **Stat cards** — counts of: Active jobs, On Hold, Overdue (past `due_date`, not completed), Due Today.
- **Recent activity feed** — last 20 scan events across all jobs with employee + workstation + timestamp.
- **Filters** — by company, due date range, tag, priority.
- **Realtime updates** — new scan events appear without page refresh, via a single shared Supabase Realtime subscription per browser tab.

**Must answer at a glance:**
- Where is each job right now?
- Which jobs are at risk (overdue or stuck)?
- What's been happening in the last hour?
- Who scanned what?

**Wave 2 enhancements:**
- Active alerts panel (acknowledged/unacknowledged)
- Low-stock indicator
- Stuck-job-pinger results

**Wave 3 enhancements:**
- Drill-through to analytics dashboards
- Outstanding invoice balance summary

### 6.14 Employee dashboard / per-shift view (Wave 1, scoped scope)

Original PRD §17 split dashboards into "Employee" and "Manager" views. In this design, the **scanner page itself IS the employee dashboard** — that's where shop floor staff spend their entire shift. The scanner UI shows:
- Currently logged-in employee name
- Current workstation
- Recent scans at this workstation (last 10)
- Number of jobs scanned today by this employee

**Why merged with the scanner instead of a separate dashboard:** shop floor employees don't open second pages — they're at a fixed kiosk doing one task. Adding a dashboard tab that nobody opens creates UI debt.

**Future "shop manager" walking view (Wave 2 enhancement, deferred):**
A separate `/scan/recent` route shows recent activity across all workstations — useful for a shop manager doing a walk-around to see live status without going back to the office. Wave 2 only if Pops asks.

### 6.15 Receiving workflow (Wave 1, explicit flow)

Original PRD §15 described receiving as an explicit workflow. Spelled out here:

```
Trigger: Parts physically arrive at Pops's shop.

Flow:
  1. Office staff (or recipient) finds the matching job in the system
     (job was previously created with intake_status='scheduled')
  2. Receiving staff (often the same person) walks to the Receiving
     workstation tablet
  3. Receiving employee PIN-taps to identify themselves
  4. They scan the job packet QR code (already printed by office)
  5. Scanner UI shows the job; receiving employee taps "Mark received"
  6. System records:
     - production_status: NULL → 'received'
     - intake_status: 'scheduled' → 'in_production'
     - scanned_at: now()
     - shop_employee_id: the receiving person
     - workstation_id: 'Receiving'
  7. Optional: receiving employee snaps a photo of any damage at intake
     (uploaded to Supabase Storage; attached via attachment_id on the
      scan event)
  8. Optional: receiving employee enters parts_received_count if
     different from job.part_count (handles short-shipped batches)
  9. Optional: receiving employee adds notes ("Box 2 of 3 missing",
     "Powder color confirmed: RAL 9005", etc.)

Failure modes & handling:
  - Scanner can't find the job (mistyped or wrong packet):
    Manual entry fallback (last 8 chars of packet_token)
    OR office creates the job if it wasn't already scheduled
  - Damage discovered:
    Photo + notes captured; job placed on hold with reason "intake damage"
    Office is alerted (Wave 2 alerts) or flagged on dashboard
  - Wrong shop / wrong workspace tenant:
    Cross-tenant scans blocked at DB level (record_scan_event refuses)
```

Customer is implicitly notified once Wave 2 notifications ship (`email_on_received` preference, default true).

### 6.16 API conventions (architectural divergence from original PRD)

Original PRD §36 specified REST endpoints (`POST /api/customer/login`, `GET /api/customer/jobs`, `GET /api/customer/jobs/:id`, `GET /api/customer/jobs/:id/history`).

**This implementation uses Next.js Server Actions instead of REST API routes.** Rationale:
- Server Actions are typed end-to-end (no manual TS types or fetch wrappers)
- They run on the same Vercel function as the page, lower cold-start cost
- Built-in CSRF protection via Next.js
- Direct call from React components — no client-side fetch boilerplate
- No URL routes to maintain, version, or document

**REST API routes (`/api/*`) exist only for webhooks** that must receive HTTP from external services:
- `/api/webhooks/resend` — email bounce/complaint events (Wave 2)
- `/api/webhooks/stripe` — payment events (Wave 3 if Stripe in scope)

Functional equivalents to PRD §36's REST endpoints, all implemented as Server Actions:

| PRD §36 REST endpoint | Implementation | Module |
|---|---|---|
| `POST /api/customer/login` | `portal.requestCustomerMagicLink({email})` | `modules/portal` |
| `GET /api/customer/me` | `auth.getCurrentClaims()` (reads JWT, no server call) | `modules/auth` |
| `GET /api/customer/jobs` | `portal.getCustomerJobs({filter})` | `modules/portal` |
| `GET /api/customer/jobs/:id` | `portal.getCustomerJobDetail(job_id)` | `modules/portal` |
| `GET /api/customer/jobs/:id/history` | `portal.getCustomerJobTimeline(job_id)` | `modules/portal` |

Customer-side: no client-side API surface at all. The portal is pure Next.js Server Components + Server Actions. RLS at the database level enforces customer-can-only-see-their-data. No additional API auth layer needed.

### 6.17 Tenant configuration & whitelabel (Wave 4)

Each tenant must be able to configure (via the `tenant_admin` role):

- **Branding**: shop logo (uploaded to Supabase Storage), primary brand color (hex), accent color (hex), optional secondary logo for email headers
- **Custom domain**: tenant adds their domain (e.g., `crm.acmecoatings.com`); platform auto-issues SSL via Vercel; tenant adds CNAME pointing to Vercel; verification status surfaced in admin UI
- **Email-from identity**: tenant's "From" address for transactional emails (e.g., `noreply@acmecoatings.com`); requires SPF/DKIM/DMARC verification UI with copy-paste DNS instructions
- **Module toggles**: enable/disable QC inspections, color library, public tracking links, customer messaging, quotes/invoices on a per-tenant basis (defaults set by vertical template)
- **Working hours**: shop operational hours used for "stuck job" alert thresholds and SLA calculations
- **Currency + tax settings**: for quotes and invoices

All branding tokens delivered via CSS custom properties; **no per-tenant compiled CSS**. Theme changes apply within seconds across the tenant's app and portal domains without redeploy.

### 6.18 Vertical workflow templates (Wave 4)

Each tenant is associated with a **vertical** (`powder_coating` | `sandblasting` | `media_blasting` | `galvanizing` | `plating` | `other`). Each vertical ships with a default **workflow template** defining production stages.

**Stage templates (Wave 4 launch):**

| Vertical | Default stages |
|---|---|
| Powder coating | Received → Prep → Coating → Curing → QC → Completed → Picked Up |
| Sandblasting | Received → Strip/Mask → Blast → Inspect → Completed → Picked Up |
| Media blasting | Received → Setup → Blast → Inspect → Completed → Picked Up |
| Galvanizing | Received → Strip → Pre-treat → Galvanize → QC → Completed → Picked Up |
| Other (custom) | Tenant defines from scratch (3-12 stages enforced) |

**Editor capabilities** (`tenant_admin` only):
- Clone the default template for the tenant's vertical and customize
- Rename stages (display label only — internal codes stable for analytics consistency)
- Reorder stages
- Add/remove stages (3-12 enforced)
- Mark stages as customer-visible (default: yes for all stages)

**Versioning**: customizations stored as JSON in `tenant_workflow_template` with a version field. Existing jobs are not retroactively re-mapped — they remain locked to their original `workflow_template_version`. New jobs use the latest version.

**Module defaults per vertical**: color library on for `powder_coating`; off for `sandblasting` / `media_blasting`. QC inspections on for all. Tenant admins can override.

### 6.19 Agency super-admin console (Wave 4)

The agency's Implementation Specialists need cross-tenant visibility for support without violating tenant data privacy.

**Must support:**
- Tenant list with health metrics (active jobs, error rates, last-active timestamp, MRR status, onboarding stage)
- Per-tenant impersonation — "support session" requires an explicit consent token issued by a `tenant_admin`; all actions during the session logged in the audit log with `acted_as_tenant_id` field; session auto-expires after 4 hours
- Per-tenant config inspection (theme, custom domain, module flags, workflow template) **without** seeing job/customer data unless impersonation is active
- Bulk feature flag rollouts across tenants (e.g., enable a new module for all `powder_coating` tenants)
- Platform-level health dashboard (cross-tenant errors via Sentry; cost monitoring; quota usage)
- Onboarding pipeline tracking (prospect → contracted → installing → live → stuck) per tenant for the agency's sales/ops view
- Billing overview (MRR by tenant, overdue invoices, churn signals)

**Must not:**
- Allow agency staff to read tenant data without explicit consent + audit log entry
- Persist any cross-tenant queries beyond what's needed for the operational view
- Bypass tenant RLS at the application layer (enforcement remains DB-side)

This module ships with its own pgTAP test suite verifying that consent tokens are required, that audit log entries are written on every cross-tenant read, and that no agency-side query can short-circuit tenant isolation.

---

## 7. Non-functional requirements

### 7.1 Performance

| Metric | Target | Measured by |
|---|---|---|
| Scanner end-to-end latency (scan → status update) | <200ms warm, <500ms cold | Playwright timing |
| Office dashboard load | <2s with 1,000 jobs | Lighthouse + manual |
| Customer portal page load | <1s (low-bandwidth simulation) | Lighthouse |
| Job packet PDF generation | <3s warm, <8s cold | Vercel function timing |
| Auth Hook | <500ms p95 | Supabase logs |
| Realtime subscription delivery | <2s end-to-end | Manual + Playwright |

### 7.2 Security

- Multi-tenant isolation enforced at DB level via Postgres RLS (defense in depth)
- All customer auth via magic link (no passwords on customer side)
- Office staff: email + password with rate limiting (5/hr per IP+email) and forgot-password flow
- Shop staff: per-workstation Supabase auth (synthetic user per tablet, device_token as password)
- PIN attribution with bcrypt hashing, atomic row lock, lockout after 5 failures
- Magic link TTL: 1 hour (override of Supabase default 24h)
- Session refresh: office 30 days, customer 30 days, workstation 1 hour
- Audit log on every sensitive operation
- Cross-table email uniqueness (an email can be staff OR customer, not both)
- Service-role client restricted via ESLint to specific modules
- All Server Actions wrap mutations with Zod validation and `withAudit()` HOF
- Cookies scoped to exact host (no cross-subdomain bleed)
- CSRF protection via Next.js built-in
- Comprehensive pgTAP RLS test suite (target: 100% policy coverage)

### 7.3 Availability

- Supabase Pro: daily backups, 7-day retention, PITR within window
- Weekly offsite backup to Backblaze B2 (encrypted)
- Monthly restore drill (non-negotiable)
- Sentry alerts on error spikes
- Vercel Pro: zero-downtime deploys, instant rollback
- Disaster recovery runbook (1 page) covering 6 scenarios — committed to repo
- Storage: image transformations via Supabase CDN, signed URLs (1 hour customer-visible, 5 min internal)

### 7.4 Compliance

- **CCPA** (California customers): right to access + delete + portability — manual SQL paths Wave 1, self-service in Wave 2
- **GDPR** (EU customers, if any): same as CCPA + right to be forgotten — same approach
- **Customer data ownership**: explicitly Pops's, not the developer's (per MSA)
- **PCI-DSS**: not applicable in Wave 1 (no card data); applicable if Stripe integration in Wave 3 (handled by Stripe)
- **Audit log retention**: minimum 1 year for compliance defense

### 7.5 Accessibility

- WCAG 2.1 AA compliance target across all pages
- Color is never the only indicator (icon + text + color)
- Keyboard navigation for all office workflows
- Touch targets ≥ 44×44pt on iPad scanner UI (gloves-friendly)
- Screen-reader compatible labels on all interactive elements
- High-contrast mode in scanner UI for dim shop lighting

### 7.6 Internationalization

- `next-intl` infrastructure in place from Day 1
- All user-facing strings via `t()` from English-only message files in Wave 1
- Spanish UI (Wave 2 enhancement) — translate strings, no architectural change needed

### 7.7 Observability

- Sentry on Next.js client + server + Edge Functions
- Structured logging (Pino) on server actions
- Vercel Analytics for Web Vitals
- Supabase Dashboard for DB metrics
- Resend deliverability dashboard
- Cost monitoring (alert if Vercel/Supabase usage anomalous)
- (Wave 2+) PostHog or similar for product analytics

---

## 8. Hardware & environment

### 8.1 Hardware (Pops, Wave 1)

- **5 production iPads** (10th gen, 64 GB, WiFi only) wall-mounted at workstations: Receiving, Prep, Coating Booth 1, Curing Oven, QC Inspection
- **1 spare iPad** kept in office for immediate replacement
- **6 lockable wall mounts** with cable pass-through (Heckler Design ~$120 or Maclocks ~$80)
- **6 USB-C 20W power supplies + 3m MFi cables**
- **2 lens protectors per iPad** (replaceable monthly to handle overspray)
- Optional: 1 set of UniFi WiFi APs ($500-1,200) if WiFi survey reveals dead zones
- Optional: electrician work for new outlets at workstations ($500-1,500)

**Total hardware spend:** ~$3,300 baseline, ~$5,100 with WiFi upgrade.

### 8.2 Environment requirements

- Pops's WiFi reaches every workstation at -67 dBm or stronger (verified Week 0 by site survey)
- Each workstation has reliable 110V power on a circuit not shared with booth fans/oven contactors
- Apple Business Manager enrolled (D-U-N-S number required)
- MDM (Jamf School free or Mosyle free) for iPad kiosk mode
- Single App Mode pinned to Safari with allow-list for `app.popsindustrial.com` and `track.popsindustrial.com`
- Google Workspace ($6/user/mo) for Pops's owner + bookkeeper email infrastructure

### 8.3 Browser support

- **Primary:** iPad Safari (workstations)
- **Supported:** Chrome / Edge / Firefox on macOS, Windows, Linux (workstation PCs as alternative)
- **Customer portal:** any modern browser including mobile Chrome/Safari (customers access from phones)

---

## 9. Architecture overview

**One Next.js 16 app, Supabase backend, deployed to Vercel. Multi-tenant from day 1.**

```
                 ┌─────────────────────────────────────────┐
                 │          Vercel (Next.js 16 app)        │
                 │  ┌───────────────────────────────────┐  │
                 │  │  proxy.ts (host detection)        │  │
                 │  └───────────────────────────────────┘  │
                 │       │              │           │      │
                 │  (office)        scan          (portal) │
                 │   route group   regular folder route gp │
                 └───────┼──────────────┼───────────┼──────┘
                         │              │           │
       ┌─────────────────▼──────────────▼───────────▼──────────────┐
       │                    Supabase (Pro plan)                     │
       │   Postgres + Auth + Realtime + Storage                     │
       │   Single DB, multi-tenant via tenant_id + RLS policies     │
       └────────────────────────────────────────────────────────────┘
```

- `app.popsindustrial.com` → office (CRM, jobs, dashboard) + scanner (workstations)
- `track.popsindustrial.com` → customer portal

**Stack:**
- Next.js 16 (App Router, Server Actions, `proxy.ts` not `middleware.ts`)
- TypeScript strict
- Tailwind v4 + shadcn/ui
- Supabase (Postgres + Auth Hooks + Realtime + Storage)
- Vercel Pro (60s timeout, custom domains, Fluid compute)
- Resend (transactional email)
- Upstash Redis via Vercel Marketplace (rate limiting)
- Sentry (error tracking)
- @react-pdf/renderer + qrcode (packet generation)
- @zxing/browser (camera QR scanning)
- next-intl (i18n)
- `@upstash/ratelimit` (sliding window rate limits)

**Module structure:** `src/modules/<name>/` with strict imports (only via `index.ts` barrel files). Shared infrastructure in `src/shared/`.

**Full architecture details:** see [Design spec §2](docs/DESIGN.md).

---

## 10. Roadmap

### Solo timeline (no agents)

| Phase | Weeks | Description |
|---|---|---|
| Week 0 | Pre-flight (~3 days) | DNS, hardware order, MSA, WiFi survey, account setup |
| **Wave 1** | 1-12 | Foundation, auth, CRM, jobs, packets, scanner, dashboard, customer portal, offline, polish, prod deploy + Pops onboarding |
| Wave 1 ship gate | 13 | 3 production days, owner sign-off |
| Rest | 14 | Decompression, backlog grooming |
| **Wave 2** | 15-20 | Inventory, quality, alerts, notifications, multi-role portal |
| **Wave 3** | 21-28 | Quotes, invoices, analytics, public tracking, messaging |
| Wave 3 ship gate | 28 | Pops fully migrated; platform proven on a single tenant |
| **Wave 4** | 29-36 | **Whitelabel layer + Tenant 2 onboarding** — custom domains, theming, vertical workflow templates, tenant-config UI, super-admin console, agency playbook, Tenant 2 (sandblasting) live |
| **Total** | **36 weeks (~8.5 months)** | |

### Compressed timeline (with parallel-agent execution)

Per parallel execution plan (see companion doc), realistic compression is ~20-30% on coding time, bounded by reviewer throughput (~6-8 PRs/day):

| Phase | Compressed weeks |
|---|---|
| Wave 1 | 9-11 weeks (vs 12 solo) |
| Wave 2 | 5 weeks (vs 6) |
| Wave 3 | 6-7 weeks (vs 8) |
| Wave 4 | 6-7 weeks (vs 8) |
| **Total** | **28-32 weeks (~7-8 months)** |

Full week-by-week details: [Design spec §6](docs/DESIGN.md). Parallel-agent batching: [Parallel execution plan](docs/EXECUTION.md).

---

## 11. Success metrics

### 11.1 Wave 1 ship gate criteria

Before declaring Wave 1 done:

- [ ] Pops has used the system for 3 full production days
- [ ] No P0 bugs (data loss, cross-tenant leak, can't scan)
- [ ] At least 1 multi-color job successfully tracked
- [ ] At least 1 rework loop successfully tracked (job back to prep)
- [ ] At least 1 customer has signed in to the portal
- [ ] Backups verified (restore drill executed in Week 11)
- [ ] <5 Sentry errors over 3 days (excluding known unactionable)
- [ ] Pops's owner says "yes, this is better than what we had"

### 11.2 Operational success metrics (post-launch)

| Metric | Target | When to measure |
|---|---|---|
| % jobs scanned at every stage | >95% | Weekly post-launch |
| Average customer "where is my job?" calls | -80% vs pre-system | 1 month post-launch |
| Job lookup time (owner) | <30s vs ~5min pre-system | Manual self-report |
| On-time delivery rate | Established baseline → improvement target | Quarterly |
| Powder cost per job (Wave 2+) | Established baseline | Quarterly |
| Customer portal sign-ins per active customer | >1 per active job | Weekly |

### 11.3 Wave 2 ship gate

- 2 weeks of inventory tracking with accurate powder usage
- 5+ QC inspections recorded with photos
- 3+ alerts triggered and resolved
- Customer notifications not in spam (verified across Gmail / Outlook / iCloud)
- 1+ customer admin invited a peer

### 11.4 Wave 3 ship gate

- 3+ quotes sent → 1+ approved → 1+ invoice paid
- 1+ customer-shop messaging exchange
- Analytics dashboard <2s load
- Public tracking link tested against rate-limit abuse

### 11.5 Wave 4 ship gate

- [ ] Tenant 2 (sandblasting shop) successfully onboarded and using the platform
- [ ] Tenant 2 successfully running on platform for 14+ days with daily scans
- [ ] Tenant 2's custom domain green (SSL valid, DNS verified, email deliverable to Gmail / Outlook / iCloud)
- [ ] Tenant 2's workflow template successfully clones from sandblasting default + tenant-specific tweaks
- [ ] Cross-tenant RLS verified end-to-end — Tenant 2 cannot see any of Pops's data; Pops cannot see any of Tenant 2's data
- [ ] Super-admin console used to support at least 1 ticket without breaking RLS (consent token + audit log entry verified)
- [ ] Onboarding playbook (Appendix D.1) executed end-to-end and refined based on Tenant 2 friction points
- [ ] No P0 bugs (data loss, cross-tenant leak, can't scan) for either tenant
- [ ] Tenant 2 admin says "yes, this is better than what we had"

### 11.6 Operational success metrics (multi-tenant, post-Wave 4)

| Metric | Target | When to measure |
|---|---|---|
| Tenant onboarding cycle (kickoff → live) | ≤6 weeks | Per-tenant |
| Tenant churn (rolling 12 months) | ≤10% annualized | Quarterly |
| Cross-tenant data leak incidents | 0 (zero tolerance) | Always |
| Tenant config self-service success rate | ≥80% (tenants change branding/workflow without a support ticket) | Quarterly |
| Support tickets per tenant per week | ≤3 (steady state) | Monthly |
| Time from feature request to ship | ≤45 days for "yes" requests | Quarterly |
| % platform uptime | ≥99.9% | Monthly |

---

## 12. Risks

Top risks (full register in [Design spec §8](docs/DESIGN.md)):

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| 1 | iOS Safari camera permission UX broken | Medium | High | Spike Week 1 on real iPad; manual entry fallback always available |
| 2 | Offline mode harder than estimated | High | Medium | iOS Safari has no Background Sync API → foreground replay; built into 5-day Week 10 budget |
| 3 | Pops's actual workflow differs from spec | Medium | High | Shadowing day Week 1; weekly check-ins with owner |
| 4 | Scope creep from Pops feedback during Wave 1 | High | High | Strict change-control; backlog for non-blocking requests |
| 5 | Solo dev burnout | High | High | 40-hr weeks; one full day off; quarterly week off; agent assistance reduces typing burden |
| 6 | Wave 1 ship gate fails | Medium | High | Defined exit criteria upfront; weekly self-grading from Week 8 |
| 7 | WiFi unreliable on shop floor | Medium | High | Survey Week 0; offline mode mandatory; instrument scan-failure metrics |
| 8 | Custom SMTP delivery to spam | Medium | High | SPF/DKIM/DMARC Week 1; multi-provider deliverability test; Postmark as warm backup |
| 9 | Hardware procurement delays | Medium | Medium | Order iPads Week 1 with 8-week buffer; alternative bracket vendor identified |
| 10 | Cross-tenant data leak | Low | High | Per-workstation Supabase auth + RLS at every layer; pgTAP RLS test suite; quarterly security audit |
| 11 | Tenant 2 onboarding reveals Pops-specific assumptions baked into the platform | High | Medium | Wave 4 includes a "platformization audit" before Tenant 2 install; refactor any hardcoded Pops references; Tenant 2 onboarded as pilot with friction tolerance and rapid-fix turnaround |
| 12 | Sandblasting workflow doesn't generalize cleanly from powder coating template | Medium | Medium | Wave 4 spike includes a sandblasting workflow validation week before committing the template; on-site or video shadowing of an active sandblasting shop early in Wave 4 |
| 13 | Super-admin console becomes a backdoor (consent flow bypassed, audit gaps) | Low | High | pgTAP test suite specifically covers super-admin paths; quarterly external security review; consent tokens + audit log entries enforced at DB level not just app level |
| 14 | Workflow template versioning leaks across tenants (e.g., editing one tenant's template affects another) | Low | High | All template edits scoped to `tenant_id` at DB level; pgTAP tests verify cross-tenant template isolation; version field locks existing jobs to original template |
| 15 | Custom-domain SSL provisioning fails or expires silently | Medium | Medium | Vercel auto-renews; admin UI surfaces SSL status with alerts at 14/7/1 days before expiry; weekly cron checks all tenant domain health |

---

## 13. Operational costs

### 13.1 Platform infrastructure (fixed, scales gracefully)

These costs are largely fixed regardless of tenant count, with step-ups at scale milestones. The platform is one stack serving all tenants via `tenant_id` + RLS.

| Service | Cost | Notes |
|---|---|---|
| Supabase Pro | $25/mo | Single instance handles all tenants; upgrades to Team ($599/mo) at ~50+ tenants if compute requires |
| Vercel Pro | $20/mo | Single project; multi-domain support included |
| Resend | $0-$50/mo | Free tier covers Wave 1; volume-based at scale |
| Upstash Redis | $0/mo | Free tier (rate limiting) |
| Sentry | $0-$26/mo | Free tier through Wave 1, Team plan in Wave 2+ |
| Domain (primary) | $0.85/mo | Per registered domain |
| Backblaze B2 | $2-$5/mo | Encrypted offsite backups |
| 1Password Business | $8/mo | Credential management |
| Google Workspace × 2 | $12/mo | Operator email |
| **Total fixed (Wave 1)** | **~$80-130/mo** | |
| **Total fixed (Wave 4 + 5 tenants)** | **~$150-250/mo** | |

Per-tenant variable costs (email volume, storage) remain a small percentage of fixed cost until ~10+ tenants.

### 13.2 Per-tenant one-time hardware costs (tenant-paid)

Each tenant is responsible for their own hardware. Operator provides procurement guidance; tenant orders directly. Optional: operator may resell as a "turnkey hardware kit" as a future revenue line.

| Item | Cost |
|---|---|
| 5 production iPads (10th gen, 64 GB, WiFi) | ~$1,750 |
| 1 spare iPad | ~$350 |
| 6 lockable wall mounts + cables + power | ~$700 |
| 2 lens protectors per iPad | ~$60 |
| AppleCare+ for 6 iPads | ~$240/yr |
| Optional: WiFi APs (UniFi) | $500-$1,200 |
| Optional: electrician for outlets | $500-$1,500 |
| **Total per tenant** | **~$3,000-$5,000** |

### 13.3 ROI for tenants

Conservative weekly time savings per shop:

- Phone calls about job status: 5 hr/wk
- Manual paperwork tracking: 3 hr/wk
- Looking up status from physical traveler: 2 hr/wk
- Customer status communication: 1.5 hr/wk
- QC paper reconciliation: 0.5 hr/wk
- **Total: 12 hr/wk × $50/hr loaded labor = ~$2,400/mo saved**

**Beyond hours saved**, the system delivers qualitative gains that compound over time:

- **Professionalism** — the shop looks like a modern operation, not a clipboard-and-spreadsheet shop
- **Transparency** — customers always know where their work is, removing trust friction
- **Customer trust** — visibility builds confidence; confidence drives repeat business
- **Retention** — switching coating vendors means losing this visibility, raising the cost of churn for the shop's customers
- **Competitive differentiation** — most industrial finishing shops offer no visibility; this is a moat in the shop's own market

---

## 14. Document index

| Document | Path | Purpose |
|---|---|---|
| **PRD** (this doc) | `PRD.md` | What we're building and why |
| **Design spec** | `docs/DESIGN.md` | How we're building it (architecture, data model, modules, auth, roadmap, ops, risks, testing, costs) |
| **Execution plan** | `docs/EXECUTION.md` | How parallel sub-agents accelerate the build |
| **Original PRD** (archived) | `docs/archive/original-prd.md` | The pre-pivot v1 PRD; preserved for traceability |
| **README** | `README.md` | Project overview, status, quick start |
| **Disaster recovery runbook** | `docs/runbooks/disaster-recovery.md` (Week 11) | What to do when things break |
| **Architecture Decision Records** | `docs/adr/*.md` (created as decisions are made) | Specific architectural choices and rationale |
| **Per-module READMEs** | `src/modules/<name>/README.md` (created with each module) | Module-specific docs |

---

## 15. Glossary

| Term | Definition |
|---|---|
| **Wave** | A scoped delivery phase. Wave 1 ships internal MVP + customer portal. Wave 2 adds inventory + alerts. Wave 3 adds quotes + analytics. |
| **Tenant** | A customer of the platform (an industrial finishing shop — powder coating, sandblasting, media blasting, galvanizing, plating, or other). Pops is Tenant 1. Multi-tenant from day 1. |
| **Audience** | One of four user contexts: `staff_office`, `staff_shop`, `customer`, and (Wave 4) `staff_agency`. Determines RLS access and UI surface. |
| **Job packet** | The printed PDF that travels with a job through production. Contains QR code + key info + stage checklist. |
| **packet_token** | The 16-character random identifier embedded in a job's QR code. Unique per job. |
| **device_token** | The 48-character random identifier identifying a workstation tablet. Stored in localStorage; also used as the synthetic Supabase user's password. |
| **PIN tap** | Employee identification at workstation. 4-digit PIN with bcrypt hash + lockout. |
| **Stage** | One of 7 production phases. Transitions are flexible (any-to-any) to support rework. |
| **Hold** | Orthogonal flag to status. Any stage can be on hold with a required reason. |
| **Multi-color job** | A job with multiple coating colors. Modeled as parent + child jobs via `parent_job_id`. |
| **Scan event** | A row in `job_status_history` recording a stage transition with employee, workstation, timestamp, and optional photo. |
| **Magic link** | Passwordless customer auth. Email contains a one-click link valid for 1 hour. |
| **RLS** | Row-Level Security. Postgres feature enforcing tenant isolation at the DB level. |
| **PWA** | Progressive Web App. Scanner page is installable on iPad home screen with offline support. |
| **Ship gate** | Criteria that must be met before a wave is declared complete. |
| **Vertical** | A category of industrial finishing (powder coating, sandblasting, media blasting, galvanizing, plating, other). Each vertical has a default workflow template; tenants can customize. |
| **Workflow template** | A pre-defined set of production stages for a vertical. Tenants clone and customize within their tenant. Existing jobs lock to their original template version. |
| **Tenant admin** | The shop owner or operator who manages tenant-level settings (branding, billing, users, workflow, modules). Wave 4. |
| **Implementation specialist** | The agency's customer-facing operator. Onboards, trains, configures, and supports tenants. Wave 4 hire (typically at Tenant 3). |
| **Whitelabel** | The platform deployed under the tenant's own brand, domain, and email identity. Wave 4. |
| **Super-admin console** | Agency-side cross-tenant view for support and operations. Tenant data access requires explicit consent tokens; all reads audit-logged. Wave 4. |
| **Tenant 1** | Pops Industrial Coatings — the launch tenant of the platform. |

---

## 16. Change log

| Date | Version | Changes |
|---|---|---|
| 2026-04-26 | 1.0 | Original PRD (40 sections). Initial product specification. |
| 2026-04-26 | 2.0 | **Official rewrite** as the canonical PRD. Reorganized into standard PRD format (16 sections). Aligned with design spec v1.1 (multi-tenant from day 1, Next.js 16 + Supabase + Vercel stack, 7 production stages with flexible transitions, magic link customer auth, three-wave roadmap, deferred-features catalog, hardware and environment specifications, success metrics, risks, commercial terms). Original PRD content fully captured in §6 (functional requirements) — nothing dropped, several items moved to deferred catalog with explicit rationale. |
| 2026-04-26 | 2.1 | **Partner-review prep additions**: explicit Office Dashboard (§6.13), Employee Dashboard rationale (§6.14), Receiving Workflow (§6.15), API Conventions divergence note (§6.16). Added Appendix A (Original PRD section traceability — every section of v1 mapped to where it lives in v2.1), Appendix B (Open Questions for partner review), Appendix C (Assumptions). |
| 2026-04-27 | 3.0 | **Multi-tenant whitelabel pivot.** Reframed product as a multi-tenant vertical SaaS for industrial finishing (powder coating + sandblasting + adjacent verticals). Pops Industrial Coatings is Tenant 1 (launch tenant — a customer like any other, no partnership terms). Added Wave 4 (whitelabel layer: custom domains, theming, vertical workflow templates, super-admin console, tenant-config UI, onboarding playbook, Tenant 2 onboarding) extending timeline to 36 weeks. New: operational model (§2.2), four-wave roadmap (§§2.3, 5.4, 10), Tenant Admin persona (§4.5), Implementation Specialist persona (§4.6), tenant config & whitelabel module (§6.17), vertical workflow templates module (§6.18), super-admin console module (§6.19). Refocused §13 to operational costs (infra + per-tenant hardware + tenant ROI). New Appendix D (operational playbook — onboarding flow, support tiers, lifecycle states, team scaling). New Appendix E (whitelabel checklist — per-tenant config verification). Glossary expanded with vertical, workflow template, tenant admin, implementation specialist, whitelabel, super-admin console, Tenant 1. Appendix B.6 added with architecture/functionality decisions. Title placeholders `[Platform TBD]` and `[Agency TBD]` pending naming decisions. |

Future revisions: append a row here describing what changed and why.

---

## Appendix A — Original PRD section traceability

This table proves nothing from the original 40-section PRD has been dropped. Every section maps to one or more locations in the current PRD or the design spec. Items intentionally deferred have explicit deferral rationale.

| Original §  | Section title | Where it lives now | Status |
|---|---|---|---|
| 1 | Product Overview | PRD §1 (Executive summary) | ✓ |
| 2 | Problems This System Solves | PRD §3 (Problem statement) — all 7 bullets preserved | ✓ |
| 3 | Target Users | PRD §4 (Target users & personas) — expanded to 4 personas | ✓ enhanced |
| 4 | Core System Architecture | PRD §9 + Design spec §2 | ✓ |
| 5 | Core Modules (CRM + Production) | PRD §6 + Design spec §4 (22 modules across 4 waves) | ✓ enhanced |
| 6 | CRM Module Requirements (Companies, Contacts, Jobs, Quotes, Activities, Users) | PRD §6.1 + Design spec §3.3 (full schema) | ✓ |
| 7 | QR Job Packet System | PRD §6.2 + Design spec §4.3 Module 4 | ✓ |
| 8 | Production Workflow (7 stages) | PRD §6.3 + Design spec §3.6 (status state matrix) | ✓ enhanced (any-to-any transitions, on_hold flag) |
| 9 | QR Scan Behavior (6 must-do steps) | PRD §6.4 (all 6 steps preserved) | ✓ |
| 10 | Employee Scan Flow (PIN; badge as future) | PRD §6.4 + Design spec §6.4.1 deferred catalog (badge scanning) | ✓ |
| 11 | Job Status History | Design spec §3.3 (`job_status_history` table + triggers) | ✓ |
| 12 | Web Scanner Interface (works on tablet/PC/desk) | PRD §6.4 (browser compatibility note) | ✓ |
| 13 | Workstations | PRD §6.4 + Design spec §3.3 (`workstations` table) | ✓ |
| 14 | Inventory System (Raw Materials + Job-Related) | PRD §6.5 (Wave 2) + Design spec §3.4 | ✓ deferred to Wave 2 |
| 15 | Receiving Workflow | PRD §6.15 (explicit flow added in v2.1) | ✓ explicit |
| 16 | Production Analytics | PRD §6.9 (Wave 3) + Design spec §4.3 Module 17 | ✓ deferred to Wave 3 |
| 17 | Employee Dashboard / Manager Dashboard | PRD §6.13 (Office/Manager dashboard, Wave 1) + §6.14 (Employee dashboard rationale — merged with scanner UI) | ✓ explicit |
| 18 | Alerts System (6 alert types) | PRD §6.6 (Wave 2) — all 6 types preserved + 1 added (pin_attempts) | ✓ enhanced |
| 19 | Reporting (Production / Employee / Inventory) | PRD §6.9 (Wave 3) | ✓ deferred to Wave 3 |
| 20 | Printing System (logo, job#, etc + future labels) | PRD §6.2 (packet contents) + Deferred catalog (rack/bin/pallet labels) | ✓ split |
| 21 | Database Additions | Design spec §3.3-3.5 (full schemas Wave 1-3) | ✓ |
| 22 | MVP Scope (7 items) | PRD §5.1 (Wave 1 in-scope) — all 7 items present | ✓ |
| 23 | Development Roadmap (4 weeks) | PRD §10 (28 weeks honest, 22-25 with agents) | ✓ recalibrated |
| 24 | Expected Outcomes | PRD §11 (Success metrics — operational metrics added) | ✓ enhanced |
| 25 | Customer Portal — Overview | PRD §6.7 + Design spec §4.3 Module 9 | ✓ |
| 26 | Customer Portal Core Features (auth options + customer_users table + roles) | PRD §6.7 (magic link chosen; multi-role Wave 2) + Design spec §3.3 (`customer_users` schema) | ✓ |
| 27 | Customer Dashboard (Active/Completed/etc) | PRD §6.7 + Design spec §4.3 Module 9 | ✓ |
| 28 | Job Tracking Page (Customer View) — visual progress + timeline + customer-visible flag | PRD §6.7 + Design spec §3.3 (`customer_visible` on history) + §4.3 Module 9 (`<CustomerProgressTracker>`) | ✓ |
| 29 | Real-Time Status Updates | PRD §6.7 + Design spec §4.5 (Supabase Realtime) | ✓ |
| 30 | Notifications (Email MVP, SMS later, Push future) | PRD §6.8 (Wave 2 email) + Deferred catalog (SMS Wave 3.5; Push indefinite) | ✓ split |
| 31 | Customer Job Search | PRD §6.7 (filter by status, search by job_number, filter by date) | ✓ |
| 32 | File & Document Access (Phase 2) | PRD §6.5 (qc photos Wave 2), §6.11 (invoices/quotes Wave 3) + Design spec §4.3 (`shared/storage`) | ✓ split |
| 33 | Customer Permissions (jobs.company_id = user.company_id) | Design spec §5.7 (RLS policies — customer-side filters) | ✓ enforced at DB |
| 34 | Public Job Tracking (Optional) | PRD §6.10 (Wave 3) + Design spec §3.5 (`job_public_tokens`) | ✓ deferred to Wave 3 |
| 35 | UI Requirements (Login/Dashboard/JobList/JobDetail/AccountSettings) | PRD §6.7 + Design spec §4.3 Module 9 (all 5 routes) | ✓ |
| 36 | API Requirements (REST endpoints) | PRD §6.16 (architectural divergence: Server Actions instead) — functional equivalents documented | ✓ divergence |
| 37 | Database Additions (customer_users, customer_sessions, job_public_tokens) | customer_users ✓; customer_sessions ✗ (Supabase Auth handles); job_public_tokens ✓ Wave 3 | ✓ rationalized |
| 38 | MVP Scope for Customer Portal (5 items) | PRD §5.1 (Wave 1) — all 5 present | ✓ |
| 39 | Phase 2 Enhancements (notif, docs, photos, public, messaging) | PRD §6.8 (notif Wave 2), §6.11 (docs Wave 3), §6.5 (photos Wave 2 via attachments), §6.10 (public Wave 3), §6.12 (messaging Wave 3) | ✓ all scheduled |
| 40 | Business Impact | PRD §13.5 (ROI calculation — 18× return) + Design spec §10.6 | ✓ |

**Result:** every original section is accounted for. Nothing silently dropped. Items moved to "deferred" have explicit rationale and re-activation path.

---

## Appendix B — Open questions (for partner review)

Items the partner should weigh in on before Week 0 starts:

### B.1 Service agreement decisions (RESOLVED 2026-04-27 with v3.0 pivot)

All items in this section have been resolved by the multi-tenant whitelabel pivot. Pops is **Tenant 1 — a paying customer on standard tenant pricing** (see [DESIGN §10.4](docs/DESIGN.md)). There is no partnership, MSA, design-partner relationship, or revenue-share arrangement. Standard SaaS terms apply:

- [x] **Engagement model**: standard tenant on $499/mo + $2,500 onboarding (current rates per DESIGN §10.4)
- [x] **IP ownership**: operator owns the platform; tenant owns their data; standard SaaS license
- [x] **Termination**: 90-day notice; full data export; 12-month data hosting post-termination
- [x] **Liability cap**: limited to fees paid in prior 12 months
- [x] **Tenant data ownership**: explicitly the tenant's, not the operator's

Original v2.1 questions about hourly rates, IP carve-outs, and revenue share are obsolete with the v3.0 pivot.

### B.2 Scope decisions (decide before Wave 1 start)

- [ ] **Stripe in Wave 3?** Adds 1 week. Pops needs online payments OR is "record check/cash payments" enough?
- [ ] **MFA for admin role**: Wave 2 enhancement OR can ship Wave 1 without it?
- [ ] **Spanish UI**: Wave 2 priority OR defer indefinitely?
- [x] **Multi-shop support** (tenant 2+): RESOLVED 2026-04-27 — onboarded in Wave 4 (Tenant 2 = sandblasting shop). See §5.4.
- [ ] **Native mobile app**: ever in scope? (PWA covers most needs.)
- [ ] **Manager role**: Old PRD had 4 roles (admin, office, shop_employee, manager); current design consolidates managers into "office or admin." Does Pops have shift managers who need permissions distinct from office staff (e.g., view analytics dashboard, but cannot edit company records)? If yes, restore the 4th role in Wave 1; if no, current design holds.

### B.3 Operational decisions

- [ ] **Brand identity**: who creates the logo + colors? Designer ($500-2000)? Use existing?
- [ ] **DNS / domain ownership**: registrar choice; transfer plan to Pops at Wave 1 ship?
- [ ] **Hardware ownership**: does Pops buy iPads directly or does dev buy + invoice?
- [ ] **WiFi survey**: who conducts? When?
- [ ] **Pops's IT contact**: who is it? What's their availability?
- [ ] **On-call hours**: 8am-8pm ET weekdays acceptable, or does Pops need 24/7 emergency response?
- [ ] **Pricing for tenant 2+**: when (and if) the model goes multi-tenant SaaS, what's the pricing tier structure?

### B.4 Technical decisions deferred (low-risk to defer; flagged for partner awareness)

- [ ] **Email provider**: Resend (chosen) OR Postmark? (Postmark configured as warm backup either way.)
- [ ] **Backup encryption keys**: where to escrow? Single point of failure risk on dev's 1Password.
- [ ] **Payment processor** (if Stripe): test-mode → live keys handoff plan.
- [ ] **Sentry sample rate** in production: 100% Wave 1 (low volume) → ramp down later?

### B.5 Risk acknowledgments (for partner sign-off)

- [ ] iOS Safari camera permission UX may be flaky; spike Week 1 mandatory; manual entry always available
- [ ] Offline mode (Week 10) is highest single-feature risk; iOS Safari has no Background Sync API
- [ ] Solo dev = single point of failure during Waves 1-3; acknowledge bus factor risk
- [ ] WiFi unreliability could push offline burden higher than estimated

### B.6 Multi-tenant / whitelabel architecture decisions (added 2026-04-27, decide before Wave 4)

- [ ] **Platform name + agency name**: currently `[Platform TBD]` and `[Agency TBD]` placeholders throughout. Pick before §6.17 ships (Wave 4) — needs to appear in tenant-facing UI.
- [ ] **Vertical 2-year horizon**: confirmed sandblasting + adjacent verticals. Pin down which 2-3 specifically (galvanizing? plating? media blasting? ceramic coating?). Affects §6.18 template breadth and Wave 4 testing scope.
- [ ] **Stripe billing in Wave 3 vs Wave 4**: current plan is Wave 4 (alongside whitelabel). Push to Wave 3 if Tenant 1 needs online payments earlier.
- [ ] **Super-admin consent flow**: should tenants be able to revoke a support session mid-flight, or only deny upfront? UX detail; ship default = upfront only, mid-flight revoke as v1.1.
- [ ] **Tenant data export format** (for portability): JSON dump? CSV per table? PDF report? Format affects implementation.
- [ ] **Workflow template "lock" semantics**: when a tenant edits their workflow template, do existing jobs stay on the old version (current plan) or do they migrate? Affects analytics continuity.
- [ ] **Per-vertical default modules**: per-vertical defaults are in §6.18; should the Implementation Specialist always start from the default and customize, or also offer a "blank" option for unusual shops?
- [ ] **Custom domain provisioning**: does the tenant always provide their own domain (current plan) or do we offer free `<tenant>.platform.com` subdomains as default with custom domain as optional upgrade?
- [ ] **Multi-vertical tenant support**: can a single tenant operate multiple verticals (e.g., a shop that does both powder coating AND sandblasting)? Currently one vertical per tenant; would need parent/child tenants OR per-job vertical-pickable to support.
- [ ] **Tenant-level theming scope**: branding (logo, color) only, or also typography choices, dashboard layout preferences, custom CSS? Wave 4 ships the simplest viable scope.
- [ ] **Workflow template export/import**: should a tenant be able to export their customized template as JSON to share with other tenants in the same vertical? Or strictly tenant-private?

---

## Appendix C — Assumptions

Items treated as true unless someone says otherwise. If any of these is false, the design changes:

### C.1 About Pops

- Single physical shop location (one building)
- 5 distinct workstations (Receiving, Prep, Coating Booth 1, Curing Oven, QC Inspection)
- Estimated 4-15 shop floor employees + 1-2 office staff (so PIN tile-grid scales fine)
- WiFi coverage acceptable at every workstation OR willing to upgrade (~$500-1,200)
- One-shift operation OR dual-shift with PIN switching (per-workstation auth handles both)
- Pops's owner is technical enough to be the on-call business contact; can articulate workflow nuances
- Customer base: ~10-100 active companies sending work; not 10,000+
- Job volume: ~5-50 jobs/week peak; not 500+/week
- Owner uses a real business email (Google Workspace recommended)
- Owner can dedicate ~2 hours/week to Q&A during Wave 1 build

### C.2 About the build

- Solo developer (the author) is the only person writing code in Wave 1
- Developer is full-time on this project for the duration of Wave 1
- No hard external deadline (can slip a week without breaking commitments)
- Anthropic / Claude Code agent dispatches work as documented
- Vercel + Supabase + Resend + Upstash + Sentry remain available and pricing stays roughly stable through 2026
- Next.js 16 doesn't ship a major breaking change mid-build that requires a rewrite
- iPad hardware availability holds; no Apple supply crunch

### C.3 About commercial / legal

- Pops's owner signs an MSA before Week 1
- Customer data ownership clearly: Pops's data, not the developer's
- US-based shop and US-based customers initially (CCPA applies; GDPR likely not until expansion)
- No HIPAA / SOX / regulated industry adjacency
- Powder coating is not a regulated material requiring specialized compliance (assumed; verify with Pops)

### C.4 About users

- Office staff are computer-comfortable (can use email, basic web apps)
- Shop floor staff may be less computer-comfortable; the scanner UI must be near-zero-learning
- Customers expect email — not Slack, not WhatsApp, not in-person
- Customers will tolerate a magic-link flow (no password) in exchange for not having one more password to manage
- Customer base includes both small (1-person) and larger (multi-staff) companies; multi-role support in Wave 2 handles the latter

If any assumption above is wrong, flag it during partner review and we'll re-evaluate the affected sections.

---

## Appendix D — Operational playbook

How tenants are onboarded, supported, and tracked through their lifecycle. Operational reference for the Implementation Specialist + founder.

### D.1 Tenant onboarding playbook (4-6 weeks from kickoff to live)

**Week 1: Configuration**
- Kickoff call (1 hour): walk through their workflow, name their stages, capture branding intake
- Set up tenant in platform (subdomain initially; custom domain in Week 2-3)
- Configure workflow template (vertical-default + tenant tweaks per §6.18)
- Configure modules (toggle off what they don't need per §6.17)
- Send hardware procurement guide; tenant orders iPads + mounts

**Week 2: Branding + domain**
- Tenant uploads logo, picks brand color
- Tenant adds DNS records for custom domain + email-from identity
- Verify SPF/DKIM/DMARC; send test email
- Custom domain SSL provisioned via Vercel
- Walk-through call (30 min): tenant logs in, sees their branding

**Week 3: Hardware install + WiFi check**
- Hardware arrives at tenant's shop
- Implementation Specialist (in-person or remote with video) installs iPads, mounts, runs WiFi survey
- Workstation enrollment ceremony: each tablet generates its `device_token` and becomes a synthetic Supabase user

**Week 4: Training**
- Office staff training (90 min): create job, print packet, view dashboard, manage customers
- Shop floor training (60 min): PIN tap, scan packet, advance stages, on-hold
- Customer-facing training (30 min): how to invite customers to the portal, how customers see their jobs

**Week 5: Pilot run**
- Tenant runs 3-5 real jobs through the system end-to-end while paper-tracking in parallel
- Daily check-in calls (15 min) for the first week
- Issues triaged same-day

**Week 6: Cutover**
- Paper tracking discontinued
- Tenant marked **Live** in super-admin console
- Tenant added to monthly health-review rotation

### D.2 Support tiers

| Tier | Definition | Channel | Response time | Owner |
|---|---|---|---|---|
| Tier 0 | Self-serve docs | Help center | n/a | Founder writes; IS maintains |
| Tier 1 | Common how-to questions | Email/chat | 24 business hours | IS or self-serve |
| Tier 2 | Account/config issues, training | Email + scheduled call | Same business day | IS |
| Tier 3 | Bugs, platform issues | Email + Sentry alert | 4 hours during business hours | Founder |
| P0 | Outage / data loss / cross-tenant leak | Phone + email | 30 minutes 24/7 | Founder |

### D.3 Tenant lifecycle states

Surfaced in the super-admin console (§6.19) as a per-tenant health badge:

- **Healthy** — active scans daily, low Sentry error rate, no open Tier-3 tickets
- **At-risk** — usage drop >50% week-over-week, OR open Tier-3 ticket >5 days, OR repeated P0 alerts
- **Stale** — no scans for 14+ days
- **Off-platform** — tenant terminated; data export delivered; tenant data retained 12 months then deleted (per terms)

Health states are reviewed monthly; the founder reaches out to at-risk tenants directly.

### D.4 Operational team scaling

| Stage | Roles | Trigger to add |
|---|---|---|
| Wave 1-3 | Founder (full-stack: build + onboard + support) | n/a |
| Tenant 3 | + Implementation Specialist | Founder support load >15hr/wk |
| Tenant 8-10 | + second Implementation Specialist OR Customer Success | Onboarding pipeline backlog >2 |
| Tenant 25+ | Consider engineering hire OR self-serve tier | Platform feature requests outpace solo dev |

---

## Appendix E — Whitelabel checklist

Per-tenant verification checklist used during the 4-6 week onboarding. Implementation Specialist runs through this; tenant admin signs off before Live.

### E.1 Pre-installation

- [ ] Service agreement signed
- [ ] Tenant entity, contact, and vertical captured in operational CRM
- [ ] Hardware procurement guide sent
- [ ] WiFi survey scheduled (if needed)

### E.2 Tenant configuration

- [ ] Tenant created in platform with `tenant_id`, vertical, default workflow template
- [ ] Tenant admin user created and invited
- [ ] Subdomain assigned (`<tenant>.<platform>.com`) and tested
- [ ] Module toggles set per vertical defaults; tenant overrides captured

### E.3 Branding

- [ ] Logo uploaded (PNG/SVG, transparent background, 256px+ short side)
- [ ] Primary brand color set (hex, contrast verified for WCAG AA)
- [ ] Accent color set (hex)
- [ ] Optional secondary email logo set
- [ ] Theme preview verified on `app.<tenant>.com` and `track.<tenant>.com`

### E.4 Custom domain (optional but standard)

- [ ] Tenant provided domain (e.g., `acmecoatings.com`)
- [ ] CNAME records added at tenant's DNS (`crm`, `track`)
- [ ] SSL provisioned by Vercel
- [ ] DNS verification green in admin UI
- [ ] Test load from `crm.<tenant>.com` and `track.<tenant>.com`

### E.5 Email identity

- [ ] Tenant's "from" address chosen (`noreply@<tenant>.com`)
- [ ] SPF record added
- [ ] DKIM record added
- [ ] DMARC policy set (recommended: `v=DMARC1; p=quarantine; pct=100`)
- [ ] Test transactional email sent and delivered to all of: Gmail, Outlook, iCloud, Yahoo

### E.6 Workflow template

- [ ] Default vertical template loaded (`powder_coating` | `sandblasting` | `media_blasting` | `galvanizing` | `plating` | `other`)
- [ ] Tenant reviews stages; rename/reorder/add/remove as needed
- [ ] Stage count between 3-12
- [ ] Customer-visible stages flagged (default: all stages visible)
- [ ] Workflow template version locked; documented for rollback

### E.7 Hardware

- [ ] iPads ordered, received, enrolled in MDM
- [ ] iPads mounted at workstations
- [ ] Power + cable runs verified
- [ ] WiFi reaches each workstation at -67 dBm or stronger
- [ ] Each iPad enrolled as a workstation (`device_token` issued; synthetic user created)

### E.8 Users

- [ ] Office staff invited and verified
- [ ] Shop floor staff PINs issued
- [ ] Tenant admin verified (login + role check)
- [ ] First customer invited (test) — verify they see only their company's data

### E.9 Training

- [ ] Office staff training completed (90 min)
- [ ] Shop floor training completed (60 min)
- [ ] Customer-facing training completed (30 min)
- [ ] Self-serve docs link provided + bookmarked

### E.10 Pilot run + cutover

- [ ] 3-5 jobs run end-to-end with paper-parallel
- [ ] Daily check-in calls (Week 5)
- [ ] All Tier 1-2 issues resolved
- [ ] No Tier 3 bugs open
- [ ] Tenant admin signs off
- [ ] Paper tracking discontinued
- [ ] Tenant marked **Live** in super-admin console
- [ ] Tenant added to monthly health-review rotation

### E.11 Post-live (Week 7+)

- [ ] Week 7 health check
- [ ] Month 1 retrospective with tenant admin
- [ ] Quarterly business review scheduled

---

*End of PRD. For implementation details, see the [Design spec](docs/DESIGN.md). For build orchestration, see the [Parallel execution plan](docs/EXECUTION.md). For the project entry point, see the [README](README.md).*
