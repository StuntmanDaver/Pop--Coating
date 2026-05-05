# Pops Industrial Coatings — Operations Platform (Wave 1)

## What This Is

A multi-tenant whitelabel SaaS for industrial finishing shops (powder coating, sandblasting, plating, galvanizing). Every job gets a printed QR-code packet; shop floor staff scan it at each workstation to advance the job through production stages, creating a timestamped, employee-attributed record. Customers see real-time status via a magic-link portal branded as the shop's own. **Pops Industrial Coatings** is the launch tenant (Tenant 1); the platform is architected for Tenant 2+ from day 1. Built by Cultr Ventures.

## Core Value

Replace paper-based job tracking with a QR scan loop that gives shop owners live production visibility and eliminates "where is my job?" calls — both for office staff and customers.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Infrastructure & scaffolding**
- [ ] Next.js 16 App Router repo initialized with TypeScript strict, Tailwind v4, shadcn/ui, pnpm
- [ ] Supabase project wired (Postgres + Auth + Realtime + Storage)
- [ ] Vercel project configured with `app.popscoating.com` + `track.popscoating.com` domains
- [ ] Multi-tenant schema foundation: `tenants` table, `tenant_id` on every business table, RLS policies using `app.tenant_id()` helper
- [ ] Auth: Supabase Auth with `@supabase/ssr` cookie storage; JWT `app_metadata.tenant_id` claim; three audiences (office, shop/workstation, customer)
- [ ] Sentry + Resend + Upstash Redis wired and verified

**CRM module**
- [ ] Companies: name, addresses, phone, email, tax ID, payment terms, archive
- [ ] Contacts: company association, name, email, phone, role, primary-contact flag, archive
- [ ] Activities: polymorphic (company/contact/job), type (call/email/meeting/note), body, staff attribution
- [ ] Tags: tenant-scoped, color, polymorphic (jobs/companies/contacts)

**Jobs & QR packets**
- [ ] Job record with `intake_status` (draft → scheduled → in_production → archived) and `production_status` (Received → Prep → Coating → Curing → QC → Completed → Picked Up)
- [ ] Flexible (any-to-any) production transitions; backward transitions flagged `is_rework=true`
- [ ] `on_hold` flag orthogonal to status, with required reason
- [ ] Multi-color jobs via parent/child (`parent_job_id`)
- [ ] Auto-generated job numbers: `JOB-YYYY-NNNNN`, year-reset, atomic
- [ ] PDF job packet: logo, job info, QR code (SVG, ECC level H), manual-entry fallback, stage checklist; `packet_dirty` reprint detection
- [ ] `production_status` direct UPDATE forbidden at DB level; all transitions via `app.record_scan_event()`

**Scanner interface**
- [ ] Camera-based QR scanning via `@zxing/browser`, manual entry fallback
- [ ] PIN tap to identify shop floor employee at workstation
- [ ] Workstation enrollment ceremony (admin QR → tablet scans → synthetic Supabase user)
- [ ] Offline mode: IndexedDB queue, sync on reconnect
- [ ] Snap-photo-at-scan; canvas → JPEG 0.7 quality, max 1024px

**Office dashboard**
- [ ] Kanban board by production stage, real-time updates via Supabase Realtime
- [ ] Filters (stage, company, date range, on-hold)
- [ ] Stat cards (jobs in flight, throughput, overdue)

**Customer portal**
- [ ] Magic-link auth scoped to customer's company only
- [ ] Job list with filter/search
- [ ] Job detail: visual progress tracker + scan timeline
- [ ] Account settings (name, email)

**Observability & ops**
- [ ] Audit log: sensitive operations (invites, deactivations, role changes)
- [ ] Comprehensive RLS test suite (cross-tenant, audience-isolation, function authorization)
- [ ] Supabase PITR + weekly offsite backup to Backblaze B2

### Out of Scope (Wave 1)

- Inventory / color library — Wave 2
- QC inspections / alerts / email notifications — Wave 2
- Quotes / invoices / analytics — Wave 3
- Custom domains / per-tenant theming / whitelabel layer — Wave 4
- Stripe billing — Wave 4
- MFA for admin role — Wave 2
- SMS / push notifications — Wave 3+
- Spanish i18n — Wave 2 (infrastructure in place from Day 1 via `next-intl`)
- Native mobile app — indefinite
- Employee badge scanning (RFID/NFC) — v1.1+

## Context

- Pops Industrial Coatings is a powder coating shop currently running on paper travelers, phone calls, and spreadsheets. Lost jobs on the floor, no customer visibility, no timing data.
- The strategic wedge: once customers expect live QR tracking, switching vendors means losing it. The portal is a retention moat.
- Three audiences in Wave 1: **office staff** (CRM + job intake), **shop staff** (scanner only, PIN-based, glove-friendly UI), **customers** (magic-link portal, read-only).
- Two domains: `app.popscoating.com` (internal) + `track.popscoating.com` (customer portal).
- Hardware target: iPad Safari on workstation tablets — glove-friendly, high-contrast, WiFi-degradation resilient.
- EXECUTION.md estimates Wave 1 at ~9-11 weeks with parallel agent dispatch (vs 12-13 solo).
- GSD scope: **Wave 1 only** (Weeks 1-13). Re-plan Wave 2 after Wave 1 ships.

## Constraints

- **Stack (hard)**: Next.js 16 App Router, TypeScript strict, Tailwind v4, shadcn/ui, Supabase, Vercel Pro, Resend, Upstash Redis, Sentry — no deviations without an explicit decision
- **Package manager**: pnpm only — no npm or yarn
- **Auth**: always `supabase.auth.getUser()` for auth decisions; never `getSession()`; `cookies()` from `next/headers` is async
- **RLS**: non-negotiable — every business table gets `tenant_id` + RLS policy; service-role usage gated to allowed modules only
- **Production status**: direct UPDATE forbidden; transitions only via `app.record_scan_event()` SECURITY DEFINER function
- **i18n**: English-only Wave 1; `next-intl` infrastructure in place from Day 1
- **Multi-tenant**: `tenant_id` on every business table; `app.tenant_id()` SECURITY DEFINER helper reads JWT `app_metadata`
- **Workstation session**: 1-hour TTL (stolen-tablet mitigation); office + customer = 30 days
- **Photo upload**: canvas → JPEG 0.7, max 1024px longest edge

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Multi-tenant via `tenant_id` + RLS (not separate schemas/DBs) | Simpler ops, single Supabase instance, Supabase Auth compatible | — Pending |
| `production_status` column-level REVOKE | Prevents direct status bypasses; all transitions auditable via scan events | — Pending |
| Workstation = synthetic Supabase user | Enables per-workstation JWT; avoids shared credentials | — Pending |
| Magic-link portal auth (not OAuth) | Customers don't create accounts; zero friction | — Pending |
| Any-to-any production transitions | Supports rework, multi-color back-passes, corrections without blocking flow | — Pending |
| `src/proxy.ts` (not `middleware.ts`) | Next.js 16 renamed multi-domain/tenant routing middleware | — Pending |
| GSD roadmap: Wave 1 only, coarse granularity | Ship something real at Week 13; re-plan Wave 2 based on learnings | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-28 after initialization*
