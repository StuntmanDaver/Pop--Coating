# [Platform TBD] — Industrial Finishing Operations Platform

> Multi-tenant whitelabel SaaS for industrial finishing shops — powder coating, sandblasting, media blasting, galvanizing, plating, and adjacent verticals. QR-coded job packets, real-time production tracking, customer portal. Pops Industrial Coatings is the launch tenant (Tenant 1); architected as multi-tenant from day 1.

---

## Status

| | |
|---|---|
| **Phase** | Planning complete; Week 0 pre-flight not yet started |
| **PRD** | v3.0 (multi-tenant whitelabel pivot) |
| **Design spec** | v2.0 (5 audit passes + Wave 4 alignment) |
| **Execution plan** | v2.0 (with Wave 4 batches) |
| **Code** | Not yet started — Wave 1 Week 0 pre-flight is next |
| **Wave 1 ship gate** | Week 13 (Pops live on platform) |
| **Wave 4 ship gate** | Week 36 (Tenant 2 live; whitelabel layer proven) |

**Next action:** complete Week 0 pre-flight tasks (DNS, hardware order, account setup, WiFi survey at Pops's shop). See [PRD §10](PRD.md#10-roadmap) and [Design spec §6.2](docs/DESIGN.md).

---

## What it does

Industrial finishing shops operate in a paper-traveler world. Jobs come in, get processed, get shipped — and tracking happens via a paper sheet that gets stuffed in a pallet. Lost paperwork, missed handoffs, no real-time visibility for customers, no data on bottlenecks.

This system replaces that with **QR-coded job packets**:

- Office staff create a job → system generates a unique job number + QR code → office prints the packet → packet travels with the parts
- Shop floor employees PIN-tap into a wall-mounted iPad at their workstation → scan the packet QR → tap a button to advance the job to the next stage
- Every scan is timestamped, employee-attributed, and immediately visible to managers (live kanban) and customers (magic-link portal)
- Real-time data on stage durations, bottlenecks, employee output, inventory consumption

**Two faces, one codebase:**
- **Internal operations platform** (CRM + production tracking + inventory + accountability) at `app.<tenant>.com`
- **External customer portal** (live status, timeline, notifications) at `track.<tenant>.com`

**Multi-tenant from day 1.** Every table has `tenant_id`; every RLS policy filters on it. Wave 1-3 builds the platform with Pops as Tenant 1. Wave 4 adds the whitelabel layer (custom domains, theming, vertical workflow templates, super-admin console) needed to onboard Tenant 2 (typically a sandblasting shop) and beyond.

**For shop owners:** less time on the phone answering "where is my job?", real production data, employee accountability, customer trust.

**For customers:** click an email link, see your job's current stage, get notified on completion.

**For employees:** simpler than paper — tap your PIN on the tablet, scan the packet, tap a button.

---

## Tech stack

- **Next.js 16** (App Router, Server Actions, `proxy.ts` for multi-domain + multi-tenant routing)
- **TypeScript strict** + **Tailwind v4** + **shadcn/ui** (CSS-variable-based theming for per-tenant branding)
- **Supabase** (Postgres + Auth + Realtime + Storage; Pro plan; single instance, multi-tenant via `tenant_id` + RLS)
- **Vercel** (Pro plan; deploys + custom domains + per-tenant SSL + edge runtime)
- **Resend** (transactional email; per-tenant from-identity with SPF/DKIM/DMARC)
- **Upstash Redis** via Vercel Marketplace (rate limiting)
- **Sentry** (error tracking; cross-tenant)
- **@react-pdf/renderer** + **qrcode** (job packet PDFs with QR codes)
- **@zxing/browser** (camera-based QR scanning on iPad Safari)
- **next-intl** (i18n; English-only Wave 1, Spanish Wave 2+)
- **@upstash/ratelimit** (sliding window limiters)
- **Stripe** (Wave 4: per-tenant billing for monthly subscriptions + onboarding fees)

---

## Documentation

The project has four primary documents that work together:

| Document | What it covers | When to read |
|---|---|---|
| **[PRD](PRD.md)** | What we're building, who it's for, scope, requirements, success metrics | Start here. Read first. |
| **[Design spec](docs/DESIGN.md)** | How we're building it: architecture, full data model, modules, auth flows, roadmap, operational concerns, risks, testing, costs | Source of truth for implementation |
| **[Execution plan](docs/EXECUTION.md)** | How concurrent sub-agents accelerate the build (~880-885 agent dispatches across 36 weeks; saves ~4-8 weeks of solo coding time) | When you're ready to start dispatching agents |
| **[Original PRD](docs/archive/original-prd.md)** (archived) | The pre-pivot v1 PRD; preserved for traceability — see PRD Appendix A for section-by-section mapping | Reference only; do not modify |

Plus (created later):
- `docs/runbooks/` — operational runbooks (created Week 11; disaster recovery is the first one)
- `docs/adr/` — Architecture Decision Records (created as significant decisions are made)
- `src/modules/<name>/README.md` — module-specific documentation (created with each module)

---

## How to read the docs

If you're new to this project:

1. **Read [§1 of the PRD (Executive summary)](PRD.md#1-executive-summary)** — 2 minutes, gets you 80% of the picture
2. **Skim [PRD §5 (Scope) and §10 (Roadmap)](PRD.md#5-scope)** — 5 minutes, understand what ships when
3. **Read [Design spec §1 (Decisions log)](docs/DESIGN.md)** — 10 minutes, the most load-bearing decisions
4. **Skim [Design spec §2 (Architecture) and §6 (Roadmap)](docs/DESIGN.md)** — 20 minutes, see the shape

If you're going to write code:
- Read **all of the design spec** (~22k+ words — half a day)
- Then read the **execution plan** for how to dispatch agents
- Then start with Week 1's batches

If you're a tenant admin (shop owner using the platform):
- Read **[PRD §1, §2, §4.5, §11](PRD.md#1-executive-summary)** — 10 minutes
- That's everything you need to understand the product
- Skip the technical sections unless curious

If you're auditing the design:
- Read **[Design spec §11 (Verification log)](docs/DESIGN.md)** for citations of all external API claims
- Read **[Design spec §12 (Change log)](docs/DESIGN.md)** for what's been audited and fixed
- Read **[PRD Appendix A](PRD.md#appendix-a--original-prd-section-traceability)** for proof that nothing from the original v1 PRD was dropped

---

## Roadmap at a glance

```
WAVE 1 (Weeks 1-13) — Internal MVP + Customer Portal (Pops as Tenant 1)
├─ Week 0:    Pre-flight (DNS, hardware, accounts, WiFi survey) — HUMAN
├─ Week 1:    Foundation (Next.js + Supabase + email + camera spike)
├─ Week 2:    Auth (Auth Hook, sign-in flows, audit log)
├─ Week 3:    CRM + Settings (companies, contacts, activities, staff mgmt)
├─ Week 4:    Jobs (jobs CRUD, multi-color, holds, status state matrix)
├─ Week 5:    Packets + Storage (PDF generation, QR codes, file uploads)
├─ Week 6:    Workstation enrollment + Scanner shell (PIN, employee picker)
├─ Week 7:    Camera scanner (full scan flow, photos, conflict handling)
├─ Week 8:    Timeline + Dashboard (kanban, realtime updates)
├─ Week 9:    Customer portal (magic link, job list/detail, custom branding)
├─ Week 10:   Offline mode (service worker, IndexedDB queue, replay)
├─ Week 11:   Polish + Pre-prod testing (RLS suite, E2E, manual QA)
├─ Week 12:   Production deploy + Pops onboarding (training, observation)
└─ Week 13:   WAVE 1 SHIP GATE (3 production days, owner sign-off)

WAVE 2 (Weeks 15-20) — Inventory, Quality, Alerts, Multi-role
├─ Weeks 15-16: Inventory module
├─ Week 17:     Quality (QC inspections)
├─ Weeks 18-19: Alerts + Notifications (email + bounce handling)
└─ Week 20:     Multi-role customer portal (admin/viewer/accounting)

WAVE 3 (Weeks 21-28) — Quotes, Invoices, Analytics, Public, Messaging
├─ Weeks 21-22: Quotes
├─ Weeks 23-24: Invoices + Payments (+ optional Stripe)
├─ Week 25:     Analytics (charts, materialized views)
├─ Week 26:     Public tracking (no-login tokenized links)
├─ Week 27:     Messaging (per-job threads with realtime)
└─ Week 28:     Wave 3 ship gate (Pops fully migrated)

WAVE 4 (Weeks 29-36) — Whitelabel + Tenant 2 onboarding
├─ Weeks 29-30: Tenant configuration & whitelabel (custom domains, theming, module toggles)
├─ Weeks 31-32: Vertical workflow templates (per-vertical defaults; tenant-customizable)
├─ Weeks 33-34: Agency super-admin console (consent-token impersonation, audit log, billing)
├─ Weeks 35-36: Tenant 2 (sandblasting) onboarding + Wave 4 polish
└─ Week 36:     WAVE 4 SHIP GATE (Tenant 2 live; cross-tenant RLS verified end-to-end)
```

**Total:** ~36 weeks solo, ~28-32 weeks with parallel-agent execution.

---

## Cost summary

### Platform infrastructure (fixed, scales gracefully)

~$80-130/mo across Supabase Pro, Vercel Pro, Resend, Upstash, Google Workspace, backups, and 1Password Business in Wave 1. Trends to ~$150-250/mo through Wave 4 with 5+ tenants. The single Supabase project + single Vercel project serves all tenants.

### Per-tenant one-time hardware (tenant-paid)

~$3,000-5,000 per tenant for 6 iPads + brackets + cables + lens protectors + AppleCare+. Optional WiFi upgrade and electrician work add ~$500-2,700.

### Tenant ROI

System saves ~12 hours/week of office labor (calls, paperwork, lookups). At $50/hr loaded labor cost, that's ~$2,400/mo saved against ~$130/mo platform infrastructure cost. Pops sees roughly **18× ROI** in Wave 1; Tenant 2+ on standard pricing see ~5× ROI.

Full breakdown: [PRD §13](PRD.md#13-operational-costs) and [Design spec §10](docs/DESIGN.md).

---

## Project structure (when code exists)

```
Pops--Coating/
├── README.md                       # this file
├── PRD.md                          # canonical product requirements
├── docs/
│   ├── DESIGN.md                   # technical design spec
│   ├── EXECUTION.md                # parallel execution plan
│   ├── archive/
│   │   ├── original-prd.md         # pre-pivot v1 PRD (reference only)
│   │   └── design-section-06-draft.md
│   ├── runbooks/                   # operational runbooks (Week 11+)
│   └── adr/                        # Architecture Decision Records
├── e2e/                            # Playwright tests
├── public/
├── scripts/
│   └── seed-tenant.ts              # programmatic tenant seeding
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (office)/               # rendered when host = app.<tenant>.com
│   │   ├── scan/                   # rendered for /scan/* paths (PWA scope)
│   │   ├── (portal)/               # rendered when host = track.<tenant>.com
│   │   ├── (agency)/               # super-admin console (Wave 4)
│   │   ├── api/webhooks/           # Resend bounces, Stripe (Wave 3-4)
│   │   ├── manifest.ts             # PWA manifest
│   │   └── layout.tsx
│   ├── messages/en/                # next-intl message files
│   ├── modules/                    # business logic (one folder per module)
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
│   │   ├── inventory/              # Wave 2
│   │   ├── quality/                # Wave 2
│   │   ├── alerts/                 # Wave 2
│   │   ├── notifications/          # Wave 2
│   │   ├── quotes/                 # Wave 3
│   │   ├── invoices/               # Wave 3
│   │   ├── analytics/              # Wave 3
│   │   ├── public-tracking/        # Wave 3
│   │   ├── messaging/              # Wave 3
│   │   ├── tenant-config/          # Wave 4 — branding, domains, module toggles
│   │   ├── workflow-templates/     # Wave 4 — vertical workflow templates
│   │   └── agency-console/         # Wave 4 — super-admin cross-tenant view
│   ├── shared/                     # cross-cutting infrastructure
│   │   ├── audit/                  # withAudit() HOF
│   │   ├── auth-helpers/           # requireOfficeStaff, etc.
│   │   ├── db/                     # Supabase clients (server, browser, admin)
│   │   ├── rate-limit/             # @upstash/ratelimit wrappers
│   │   ├── realtime/               # subscription helpers
│   │   ├── storage/                # polymorphic file upload module
│   │   ├── theming/                # Wave 4 — CSS variables per tenant
│   │   └── ui/                     # shadcn components + custom shared
│   ├── proxy.ts                    # Next.js 16 proxy (host-based + tenant routing)
│   └── i18n.ts                     # next-intl config
├── supabase/
│   ├── functions/                  # Edge Functions (Wave 1+ crons)
│   ├── migrations/                 # SQL migration files
│   ├── seed.sql                    # dev seed
│   └── tests/rls/                  # pgTAP RLS test suite
├── .env.local.example
├── package.json
└── eslint.config.js                # includes no-restricted-imports rules
```

---

## Quick start (when code exists)

> **Note:** No code yet. This is the eventual quick-start. Currently we're in the planning phase.

```bash
# Prerequisites: Node 20+, pnpm, Supabase CLI, Vercel CLI

# Clone
git clone <repo>
cd Pops--Coating
pnpm install

# Local Supabase
supabase start                       # spins up local Postgres + Auth + Storage
supabase db reset                    # runs all migrations + seed

# Generate types
pnpm gen:types                       # supabase gen types typescript --local > src/shared/db/types.ts

# Run dev server
pnpm dev                             # next dev — hits app.localhost:3000 and track.localhost:3000

# Run tests
pnpm test                            # Vitest unit tests
pnpm test:e2e                        # Playwright E2E
supabase test db                     # pgTAP RLS tests

# Production deploy
vercel deploy --prod                 # ships to Vercel; runs migrations on Supabase prod
```

Local development uses `*.localhost` URLs (no `/etc/hosts` edits needed in modern browsers):
- `http://app.localhost:3000` — office staff + scanner (Tenant 1)
- `http://track.localhost:3000` — customer portal (Tenant 1)
- `http://admin.localhost:3000` — super-admin console (Wave 4)

To test multi-tenant locally, set up additional `*.localhost` subdomains and use `seed-tenant.ts` to provision a second tenant.

---

## Contributing

> **Note:** Currently a single-developer project. Contribution model TBD.

If you're adding code:
1. Branch from `main`
2. Follow module boundaries (`src/modules/<name>/` with strict imports — see [Design spec §2.4](docs/DESIGN.md))
3. Every change requires:
   - pgTAP tests for any RLS or function changes
   - Vitest tests for any Server Action
   - Playwright test for any new critical user flow
   - README update for the affected module
4. CI must pass (lint, typecheck, pgTAP, Vitest)
5. PR description must reference the relevant design spec section

Service-role usage is restricted to specific modules (`auth`, `settings`, `portal`, `agency-console`) and `src/shared/audit/**` and `supabase/functions/**`. Lint enforces this.

Cross-tenant queries from the `agency-console` module require an explicit consent token from a `tenant_admin` and are audit-logged.

---

## Operational concerns

- **Backups:** Supabase Pro daily PITR + weekly offsite to Backblaze B2 (encrypted with `age`)
- **Monitoring:** Sentry from Day 1; Vercel Analytics; Resend deliverability; Supabase metrics
- **On-call:** founder is on-call (8am-8pm ET weekdays best-effort; 24/7 for P0 events only)
- **Disaster recovery runbook:** committed to `docs/runbooks/disaster-recovery.md` from Week 11; covers 6 scenarios (DB corruption, bad deploy, Resend suspension, Supabase outage, compromised credential, lost tablet)
- **Backup drill:** monthly restore to a test Supabase project (verifies backups actually work)
- **Security:** comprehensive pgTAP RLS test suite (target 100% policy coverage); cross-tenant isolation tests on every PR; quarterly credential rotation drill
- **Multi-tenant operations** (Wave 4+): per-tenant onboarding playbook (Appendix D of PRD), whitelabel checklist (Appendix E), super-admin console with consent-gated impersonation

Full operational details: [Design spec §7](docs/DESIGN.md) and [PRD Appendix D](PRD.md#appendix-d--operational-playbook).

---

## Audit corrections

The project went through **5 deep audit passes** before any code was written:

1. **Original PRD review** — flagged ~32 gaps in scope, hardware, security, real-world workflow modeling
2. **Schema audit** — 4 critical bugs fixed (admin/manager roles, contact_id link, activities customer_visible, part-count tracking; security fix on `record_scan_event`)
3. **Module breakdown audit** — 32 issues; service-role lint rule, missing flows, ambiguous ownership
4. **Auth flow audit** — 33 issues; PIN race conditions, BYPASSRLS dependency, multi-tenant trigger fix, magic-link TTL
5. **Independent agent audit (deep)** — 14 critical / 20 important / 23 polish — all critical fixed (SECURITY DEFINER, missing wrapper functions, route group URLs, audit_log RLS, BYPASSRLS docs, multi-tenant linking, refresh window contradiction, etc.)

The design spec's [§12 Change log](docs/DESIGN.md) tracks every audit correction.

The PRD's [Appendix A](PRD.md#appendix-a--original-prd-section-traceability) maps every section of the original v1 PRD to its location in v3.0 — proves zero functional regressions across the multi-tenant whitelabel pivot.

---

## Contact

- **Project owner / developer:** David K. (ketchel.david@gmail.com)
- **Launch tenant:** Pops Industrial Coatings (Tenant 1; owner contact established at Week 0)
- **On-call (post-launch):** TBD via Pushover / phone in 1Password shared vault

---

*Last updated: 2026-04-27. For implementation status, see the [PRD §11 (Success metrics)](PRD.md#11-success-metrics) and [Design spec §6 (Roadmap)](docs/DESIGN.md).*
