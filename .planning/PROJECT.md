# Industrial Finishing Operations Platform

## What This Is

A multi-tenant whitelabel SaaS replacing paper-traveler job tracking in industrial finishing shops (powder coating, sandblasting, plating, galvanizing). Every job gets a QR-coded packet that shop floor employees scan at each workstation — every scan is timestamped, employee-attributed, and instantly visible to managers via live kanban and to customers via a magic-link portal. **Pops Industrial Coatings** is the launch tenant (Tenant 1); the platform is architected multi-tenant from day 1.

## Core Value

Every job scan creates a timestamped, employee-attributed record that customers can see in real time — eliminating the "where is my job?" phone call.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Foundation**
- [ ] Next.js 16 app scaffold: App Router, TypeScript strict, Tailwind v4, shadcn/ui, ESLint flat-config with service-role lint rule, Prettier, Husky pre-commit
- [ ] Shared infra: `src/shared/db/` (server/client/admin Supabase clients), `src/shared/auth-helpers/`, `src/shared/audit/` (withAudit HOF), `src/shared/rate-limit/`, `src/shared/storage/` skeleton
- [ ] `src/proxy.ts` host-based routing (app.* → office, track.* → portal)
- [ ] Supabase project: tenants, shop_settings, tenant_domains, audit_log schema + `app` helper functions
- [ ] CI: GitHub Actions (lint, typecheck, pgTAP, Vitest on every push)
- [ ] Resend SMTP + SPF/DKIM/DMARC for transactional email
- [ ] Sentry error tracking (cross-tenant, tagged by tenant_id)
- [ ] next-intl setup (English-only Wave 1)

**Auth**
- [ ] Auth Hook (JWT app_metadata injection with tenant_id, role, audience)
- [ ] Staff sign-in/sign-out/forgot-password/set-password flows
- [ ] Customer magic-link request + expiry screens
- [ ] Workstation PIN authentication (shop floor employees)
- [ ] Cross-tenant isolation tests (pgTAP suite)

**CRM + Settings**
- [ ] Companies CRUD with activity logging
- [ ] Contacts linked to companies
- [ ] Tags (polymorphic, multi-entity)
- [ ] Settings: shop info, staff management, invite staff, audit log viewer

**Jobs**
- [ ] Jobs CRUD: create, update, archive, schedule, clone
- [ ] Multi-color splitting (one job → per-color child jobs)
- [ ] Hold / release-from-hold workflow
- [ ] Part count tracking (parts_in / parts_out / parts_scrapped)
- [ ] `jobs.production_status` state machine enforced via `app.record_scan_event()` only (direct UPDATE forbidden at column-grant level)

**Packets + Storage**
- [ ] PDF job packet generation (`@react-pdf/renderer` + `qrcode`)
- [ ] QR code embedded in PDF, unique per job
- [ ] File upload (photos) at canvas → JPEG 0.7 quality, max 1024px
- [ ] Packet storage in Supabase Storage

**Scanner**
- [ ] Workstation enrollment (claim/release/heartbeat via SECURITY DEFINER functions)
- [ ] Employee PIN picker UI (wall-mounted iPad, kiosk-style)
- [ ] Camera-based QR scan (`@zxing/browser`) — works on iPad Safari with shop dust/glare
- [ ] Scan event recording (stage advance, photo attach, conflict handling)
- [ ] Offline mode: service worker + IndexedDB queue + replay on reconnect

**Timeline + Dashboard**
- [ ] Live kanban board (production_status columns, realtime updates)
- [ ] Job timeline (all scan events for a job, employee-attributed)
- [ ] Stage duration analytics (basic — bottleneck visibility)

**Customer Portal**
- [ ] Magic-link entry (tokenized, TTL-controlled)
- [ ] Job list + job detail with current stage
- [ ] Real-time status updates
- [ ] Per-tenant branding (CSS variables, tenant logo)

**Production Deploy**
- [ ] Vercel Pro deploy with custom domain placeholder (app.popscoating.com + track.popscoating.com)
- [ ] Pops onboarding: staff training, observation day, owner sign-off
- [ ] Wave 1 ship gate at Week 13

### Out of Scope

- **Wave 2 features** — inventory tracking, QC inspections, alerts, email notifications, multi-role customer portal (admin/viewer/accounting) — deferred to Weeks 15-20
- **Wave 3 features** — quotes, invoices, Stripe payments, analytics dashboards, public tokenized tracking links, per-job messaging threads — deferred to Weeks 21-28
- **Wave 4 features** — custom domain provisioning UI, per-tenant theming config UI, vertical workflow templates, agency super-admin console, Tenant 2 onboarding — deferred to Weeks 29-36
- **Spanish language** — Wave 2+ only; Wave 1 is English-only
- **Per-tenant billing (Stripe)** — Wave 4 only
- **Multiple Supabase instances** — single instance, multi-tenant via RLS
- **Pages Router** — App Router only

## Context

- **Status:** Planning complete; no code written. Week 0 pre-flight (DNS, hardware, accounts, WiFi survey) is the current human-only gate before agent dispatches begin.
- **Five audit passes** done before any code: PRD review, schema audit, module breakdown audit, auth flow audit, independent deep audit. All critical findings resolved and logged in `docs/DESIGN.md §12`.
- **Build approach:** ~880 agent dispatches over 36 weeks using concurrent sub-agents. Wave 1 (Weeks 1-13) is the focus — scaffolding → auth → CRM → jobs → packets → scanner → timeline → portal → polish → deploy.
- **Two-domain architecture:** `app.<tenant>.com` for internal operations (CRM + production tracking), `track.<tenant>.com` for customer-facing portal. Both served by one Next.js app via `src/proxy.ts` host detection.
- **Hardware at Pops:** 6 wall-mounted iPads at workstations, one per stage. iPad camera used for QR scanning. Employees tap PIN on iPad, scan packet, tap button to advance job.
- **Canonical docs:** `PRD.md` (what), `docs/DESIGN.md` (how — architecture, data model, auth flows), `docs/EXECUTION.md` (when — ~880 agent dispatches, weekly batches).

## Constraints

- **Tech stack:** Next.js 16 (App Router, Server Actions), TypeScript strict, Tailwind v4 (CSS-first config), shadcn/ui, Supabase (Postgres + Auth + Realtime + Storage, Pro), Vercel Pro — no deviations without explicit decision
- **Multi-tenant isolation:** Every business table has `tenant_id uuid not null references public.tenants(id)` + RLS policy using `app.tenant_id()` SECURITY DEFINER helper — bypassing RLS is never acceptable
- **Auth library:** `@supabase/ssr` for cookie-based sessions; always use `supabase.auth.getUser()` (never `getSession()`) for auth decisions
- **Package manager:** `pnpm` — never npm or yarn
- **Module boundaries:** `src/modules/<name>/index.ts` is the only public surface; cross-module imports enforced via ESLint
- **Wave 1 ship gate:** Week 13 — Pops live on platform, owner sign-off required
- **Device target:** iPad Safari (shop floor); must work with dirty gloves, industrial lighting

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Single Supabase instance, multi-tenant via `tenant_id` + RLS | Simpler ops at current scale vs separate schemas or DBs; RLS enforces isolation at query level | — Pending |
| `jobs.production_status` REVOKE UPDATE; must go through `app.record_scan_event()` | Prevents accidental direct updates bypassing audit trail and state machine | — Pending |
| Auth Hook injects `tenant_id` into JWT `app_metadata` | Claim available to RLS policies without per-request lookup; eliminates N+1 auth queries | — Pending |
| `src/proxy.ts` (not `middleware.ts`) for host-based routing | Next.js 16 renamed the file; proxy.ts routes app.* vs track.* audiences | — Pending |
| `cookies()` from `next/headers` is async in Next.js 16 | API changed in Next.js 16; `await cookies()` required everywhere | — Pending |
| Workstation session TTL = 1 hour (vs 30 days for office/customer) | Stolen-tablet mitigation; tablet re-authenticates silently on expiry | — Pending |
| `app.custom_access_token_hook` must not write to tables | Supabase Issue #29073 deadlock; user-row linking goes in a separate AFTER INSERT trigger | — Pending |
| `supabase_auth_admin` must keep BYPASSRLS | Auth Hook depends on it; removing it breaks token injection | — Pending |

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
