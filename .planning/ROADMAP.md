# Roadmap: Pops Industrial Coatings — Operations Platform (Wave 1)

**Milestone:** Wave 1 — Internal MVP + Customer Portal
**Target:** Week 13
**Granularity:** Coarse
**Coverage:** 37/37 requirements mapped

---

## Phases

- [ ] **Phase 1: Foundation** — Repo scaffold, infrastructure, and multi-tenant auth; the platform skeleton every other phase builds on
- [ ] **Phase 2: Core Data** — CRM and Jobs modules; office staff can intake and manage jobs end-to-end
- [ ] **Phase 3: Shop Floor** — QR scanner loop and office dashboard; the core value proposition is live
- [ ] **Phase 4: Portal & Ops** — Customer portal and observability; product is shippable to real users

---

## Phase Details

### Phase 1: Foundation
**Goal**: The repo, infrastructure, multi-tenant schema, and all three auth audiences are in place so every subsequent phase can build without revisiting foundational decisions
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. A developer can run `pnpm install && pnpm dev` and reach a working Next.js 16 app at `app.popscoating.com` and `track.popscoating.com` via local env — TypeScript strict passes, Tailwind v4 renders, shadcn/ui components mount
  2. An office staff user can sign in with email/password on `app.popscoating.com` and their 30-day session survives a page reload; `supabase.auth.getUser()` returns a valid user with `tenant_id` and `audience=office` in `app_metadata`
  3. A workstation tablet can be enrolled via admin QR ceremony and then authenticates with a 1-hour session; attempting to authenticate on the office domain with workstation credentials is rejected
  4. A customer can receive a magic link and reach `track.popscoating.com` scoped only to their company's data; office credentials do not work on the portal domain
  5. Any SQL query from the `authenticated` role that omits `tenant_id` returns zero rows from any business table — cross-tenant data cannot leak even without application-level filtering
**Plans**: 6 plans
  - [x] 01-01-PLAN.md — Repo scaffold: Next.js 16 + Tailwind v4 + shadcn/ui + ESLint module-boundary + service-role gating + i18n + folder structure (INFRA-01, INFRA-07 partial)
  - [x] 01-02-PLAN.md — DB migrations 0001–0006: app schema helpers + tenants/auth/CRM/jobs tables + RLS policies (INFRA-03, INFRA-06)
  - [x] 01-03-PLAN.md — DB migrations 0007–0010: custom_access_token_hook (STABLE/no-write) + production_status REVOKE + workstation lifecycle SECURITY DEFINER + link_auth_user_to_actor trigger (AUTH-04, INFRA-06)
  - [x] 01-04-PLAN.md — Supabase clients + auth-helper guards + src/proxy.ts multi-domain routing + Upstash rate limiters + Sentry (INFRA-04, INFRA-05, AUTH-05)
  - [x] 01-05-PLAN.md — auth module (sign-in, sign-out, magic-link) + createWorkstation server action + sign-in UI + portal callback + module stubs (AUTH-01, AUTH-02, AUTH-03, AUTH-05)
  - [ ] 01-06-PLAN.md — pgTAP RLS suite + GitHub Actions CI + scripts/seed-tenant.ts + supabase/seed.sql + [BLOCKING] supabase db push + live Tenant 1 bootstrap + Resend/Vercel/Sentry config + [A1] TTL verification + Phase 1 success-criteria sign-off (INFRA-02, INFRA-04, INFRA-07, AUTH-01–04)

### Phase 2: Core Data
**Goal**: Office staff can manage the full customer record (company, contacts, activities, tags) and create and track jobs through intake stages with QR-ready printed packets
**Depends on**: Phase 1
**Requirements**: CRM-01, CRM-02, CRM-03, CRM-04, JOB-01, JOB-02, JOB-03, JOB-04, JOB-05, JOB-06
**Success Criteria** (what must be TRUE):
  1. An office staff member can create a company, add contacts, log an activity (call/note/email/meeting), and apply a colored tag — all visible only within the same tenant
  2. An office staff member can create a job, see it auto-assigned a number in `JOB-2026-NNNNN` format, and advance it through `intake_status` (draft → scheduled → in_production → archived) using the UI
  3. A job can be put on hold with a reason at any `production_status` stage; the on-hold state is visually distinct and does not block the stage value
  4. An office staff member can generate and print a PDF job packet that includes the shop logo, job details, a scannable QR code (ECC level H), and a stage checklist; editing the job after printing displays a "needs reprint" badge on the packet
  5. An attempt to directly UPDATE `production_status` via SQL or Supabase client returns a permission error — only `app.record_scan_event()` can change that column
**Plans**: TBD
**UI hint**: yes

### Phase 3: Shop Floor
**Goal**: Shop floor staff can scan job packets at any workstation to advance production status, and office staff can see the live state of all jobs on a kanban board
**Depends on**: Phase 2
**Requirements**: SCAN-01, SCAN-02, SCAN-03, SCAN-04, SCAN-05, DASH-01, DASH-02, DASH-03
**Success Criteria** (what must be TRUE):
  1. A shop floor employee can tap their PIN on a workstation tablet, scan a QR code from a job packet, and see the job advance to the next stage — the scan is recorded with employee identity, workstation, and timestamp via `app.record_scan_event()`
  2. When the WiFi drops, the scanner queues scan events in IndexedDB and successfully syncs them to the server on reconnect without data loss or duplication
  3. A shop floor employee can capture a photo at scan time (e.g., damage at Receiving); the photo is compressed to JPEG 0.7 / 1024px max before upload and is visible in the job timeline
  4. An office staff member opens the dashboard and sees all active jobs arranged in a kanban by production stage; adding a new scan on any tablet moves the job card in real time without a page refresh
  5. An office staff member can filter the kanban to show only on-hold jobs for a specific company and see the three stat cards (in-flight count, completed-this-week throughput, overdue count) update to match the filter
**Plans**: TBD
**UI hint**: yes

### Phase 4: Portal & Ops
**Goal**: Customers can track their jobs via a branded magic-link portal, and the platform has audit logging, RLS test coverage, and backup/recovery in place — making the product safe to ship to real users
**Depends on**: Phase 3
**Requirements**: PORTAL-01, PORTAL-02, PORTAL-03, PORTAL-04, OPS-01, OPS-02, OPS-03
**Success Criteria** (what must be TRUE):
  1. A customer receives a magic link by email, opens `track.popscoating.com`, and sees only their own company's jobs; attempting to view a job from a different company returns a 404 or permission error
  2. A customer can open any of their jobs and see a visual progress tracker with the current stage highlighted and a full scan timeline (employee name, stage, timestamp, photo if any)
  3. A customer can update their display name and email address in account settings; the change takes effect immediately on next page load
  4. Inviting a new office staff member, deactivating a staff account, or changing a role generates an immutable audit log entry tagged with `tenant_id` and the acting user's ID; the entry cannot be deleted or modified via the `authenticated` role
  5. The pgTAP RLS test suite runs in CI and passes: cross-tenant queries return zero rows, office/shop/customer audiences cannot access each other's routes, and `app.record_scan_event()` rejects calls from non-shop audiences
**Plans**: TBD
**UI hint**: yes

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 5/6 | In Progress|  |
| 2. Core Data | 0/0 | Not started | - |
| 3. Shop Floor | 0/0 | Not started | - |
| 4. Portal & Ops | 0/0 | Not started | - |
