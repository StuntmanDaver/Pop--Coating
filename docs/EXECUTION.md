# [Platform TBD] — Parallel Sub-Agent Execution Plan

**Document version:** 2.0 (multi-tenant whitelabel pivot — Wave 4 added)
**Date:** 2026-04-27
**Companion to:** `DESIGN.md`, `../PRD.md`

---

## 0. Purpose

This document is an **exhaustive operational plan** for executing the entire 36-week project (Waves 1-4) using concurrent Claude Code sub-agents. It groups every concrete task into agent-sized work units, identifies which can run in parallel, marks human-only blockers, and defines synchronization points.

**It complements the design spec.** The spec answers "what are we building?" — this document answers "how do we organize the work so parallel agents can do most of the typing while you (the human) do review, integration, and human-only tasks?"

**Realistic time savings (revised, honest):** The 36-week calendar in the design spec already assumes solo human dev. Agents don't compress the calendar much — sequential gates (schema → migration → types → backend → frontend → tests, with reviewer throughput as the binding constraint per §11.0) keep the critical path roughly the same length. **What agents DO save: solo coding hours.** Estimated **20-30% reduction in pure coding time**, which translates to roughly **2-3 weeks shaved off Wave 1** and **1-2 weeks each off Waves 2, 3, and 4** if reviewer throughput holds.

This is meaningful but not magical. The earlier draft's "7-9 weeks for Wave 1" claim was unverified — the actual lower bound, given dependency chains and ~6-8 PRs/day reviewer throughput, is **closer to 9-11 weeks for Wave 1** (vs 12 weeks solo). Total project: **~28-32 weeks vs 36 weeks solo**.

---

## 1. Concurrency model

### 1.1 Roles

```
                       ┌─────────────────────────────────┐
                       │   YOU (Master Orchestrator)     │
                       │   - Reads spec                   │
                       │   - Dispatches batches           │
                       │   - Reviews output               │
                       │   - Resolves conflicts           │
                       │   - Makes commercial decisions   │
                       │   - Handles human-only tasks     │
                       └────────────────┬────────────────┘
                                        │ dispatches
              ┌─────────────────────────┼─────────────────────────┐
              ▼                         ▼                         ▼
     ┌────────────────┐       ┌────────────────┐       ┌────────────────┐
     │ Schema agent   │       │ Module backend │       │ UI/components  │
     │  (per migration)│      │  (per module)   │      │  (per module)  │
     └────────────────┘       └────────────────┘       └────────────────┘
              ▼                         ▼                         ▼
     ┌────────────────┐       ┌────────────────┐       ┌────────────────┐
     │ Test agent     │       │ Docs agent     │       │ Audit agent    │
     │  (per module)  │       │  (READMEs)     │       │  (security)    │
     └────────────────┘       └────────────────┘       └────────────────┘
```

You dispatch batches. Each batch is a single message with multiple `Agent` tool uses (Claude Code allows multiple parallel calls per message). Agents return findings/code to you. You integrate, commit, dispatch next batch.

### 1.2 Maximum concurrency per batch

- **Recommended:** 5-8 agents per batch
- **Hard limit:** depends on context window of orchestrator (you) — each agent's brief uses tokens, results consume tokens too
- **Practical max:** 10-12 with very focused agents

### 1.3 Coordination patterns

**Pattern A: Module team (3 agents per module, parallel)**
1. Backend agent (schema + queries + actions)
2. Frontend agent (components)
3. Test agent (pgtap + Vitest + Playwright)

All three work simultaneously. Backend's outputs (table names, action signatures) are in the spec, so Frontend and Test don't need to wait.

**Pattern B: Pipeline (sequential within batch, parallel batches)**
Batch 1: Schema migration → batch 2: backend uses schema → batch 3: frontend uses backend.

**Pattern C: Fan-out/fan-in (1 → many → 1)**
1. One "decomposer" agent reads spec, produces a list of sub-tasks
2. Many parallel agents execute sub-tasks
3. One "integrator" agent stitches results together

**Pattern D: Cross-cutting (always-on background)**
Some agents (security auditor, doc maintainer) run after every PR, in background.

### 1.4 What agents CAN do (good candidates)

- Write SQL migrations from a spec
- Implement TypeScript modules from a spec
- Write React components from descriptions
- Write pgTAP, Vitest, Playwright tests
- Generate Edge Functions
- Set up CI/CD configs
- Write seed scripts
- Audit code for security/quality issues
- Update documentation
- Generate types from schema
- Write Zod validators
- Set up env templates
- Create deploy hooks

### 1.5 What agents CAN'T do (human-only)

- Sign legal agreements (MSA, NDA)
- Pay vendors (Vercel, Supabase, Resend, Apple)
- Configure DNS at the registrar (need credentials)
- Buy physical hardware (iPads, brackets)
- Conduct WiFi survey at the shop (physical presence)
- Train Pops staff (in-person)
- Test on a physical iPad (camera, gloves)
- Resolve commercial disputes
- Make pricing decisions
- Stakeholder check-ins (need attendance)
- Negotiate vendor contracts
- Handle Pops's owner relationship

### 1.6 What's risky to parallelize

- **Multiple agents editing the same file** → merge conflicts; serialize these
- **Schema migrations applied in parallel** → race conditions in dev DB; serialize
- **Tests that depend on un-built code** → flaky; sequence properly
- **Security-critical code** (auth, RLS, payments) → need careful human review even after agent writes

---

## 2. Agent type catalog

| Agent type | What it does | Tools used | Typical scope | Run time |
|---|---|---|---|---|
| **schema-writer** | Writes SQL migrations from spec | Write, Read | One module's tables + RLS | 5-15 min |
| **backend-builder** | Server Actions, queries, helpers | Write, Read, Edit | One module | 15-30 min |
| **frontend-builder** | React components, pages | Write, Read, Edit | One module's UI | 20-40 min |
| **test-writer** | pgTAP / Vitest / Playwright | Write, Read, Bash | Tests for one module | 15-25 min |
| **edge-function-builder** | Supabase Edge Functions | Write, Read | One cron worker | 10-20 min |
| **migration-applier** | Runs migrations against dev DB | Bash | Sequential, one at a time | 1-2 min |
| **type-generator** | Runs `supabase gen types typescript` | Bash | After every schema change | 1-2 min |
| **docs-writer** | READMEs, API docs | Write, Read | One module's docs | 10-15 min |
| **security-auditor** | Code review for security issues | Read, Grep | One PR or one module | 10-20 min |
| **code-reviewer** | Code quality review | Read, Grep | One PR | 10-20 min |
| **performance-auditor** | Lighthouse, query timing | Bash, Read | One page or query | 15-30 min |
| **accessibility-auditor** | WCAG, color contrast, keyboard nav | Read, Grep | One module | 10-20 min |
| **research-verifier** | Verifies vendor APIs against current docs | WebFetch, Context7 | One library/feature | 5-15 min |
| **deployment-agent** | Vercel deploys, env var sync | Bash | One env update | 5-10 min |
| **seed-script-writer** | Test fixture generation | Write, Read | One scenario | 10-15 min |
| **i18n-extractor** | Pulls strings from code into messages.json | Read, Edit | One module | 10-15 min |
| **dependency-auditor** | npm audit, version updates | Bash, Read | Whole repo | 5-10 min |
| **screenshot-comparer** | Visual regression for UI | Bash | Per page | 10-15 min |

---

## 3. Wave 1 sub-agent batches (Weeks 1-12)

### Week 0: Pre-flight (HUMAN-HEAVY, agent assist)

**HUMAN tasks (cannot delegate):**
- Verify `popsindustrial.com` available; register
- Pay for: Vercel Pro, Supabase Pro, Resend, 1Password, Sentry
- Sign MSA with Pops's owner
- Identify Pops's IT contact
- Order test iPad
- Conduct WiFi survey at the shop
- Outsource brand identity (logo, colors) to a designer

**AGENT batch 0.A (parallel, 4 agents):**
- AGENT 0.A.1: **research-verifier** — Verify current Vercel/Supabase pricing tier features for 2026
- AGENT 0.A.2: **research-verifier** — Verify Apple Business Manager + MDM options for kiosk-mode iPads in 2026
- AGENT 0.A.3: **docs-writer** — Draft MSA template (commercial terms, IP, scope)
- AGENT 0.A.4: **docs-writer** — Draft hardware procurement checklist with current model numbers/SKUs

**AGENT batch 0.B (parallel, 3 agents) — once accounts exist:**
- AGENT 0.B.1: **deployment-agent** — Initialize empty GitHub repo with .gitignore, .env.local.example
- AGENT 0.B.2: **deployment-agent** — Create empty Supabase project skeleton; set timezone/region
- AGENT 0.B.3: **deployment-agent** — Create empty Vercel project skeleton; configure custom domains placeholder

### Week 1: Foundation (sequential start, parallel finish)

**SEQUENTIAL: AGENT 1.0 first** (everything depends on this)
- AGENT 1.0: **backend-builder** — Initialize Next.js 16 app with Tailwind v4, TypeScript strict, ESLint flat-config with `no-restricted-imports` + service-role lint rule (per spec §2.4), Prettier, Husky pre-commit. Verify deploys to Vercel.

**Then PARALLEL batch 1.A (5 agents):**
- AGENT 1.A.1: **backend-builder** — `src/shared/db/` (server.ts, client.ts, admin.ts, types.ts placeholder)
- AGENT 1.A.2: **backend-builder** — `src/shared/auth-helpers/` (require.ts, claims.ts) + `src/shared/audit/` (withAudit HOF, log.ts)
- AGENT 1.A.3: **backend-builder** — `src/shared/rate-limit/` with @upstash/ratelimit + Upstash adapter
- AGENT 1.A.4: **backend-builder** — `src/shared/storage/` skeleton (will be filled in Week 5)
- AGENT 1.A.5: **backend-builder** — `src/proxy.ts` with host detection + audience routing skeleton

**PARALLEL batch 1.B (5 agents):**
- AGENT 1.B.1: **schema-writer** — `tenants`, `shop_settings`, `tenant_domains`, `audit_log` migrations + `app` schema with helper functions (per spec §3.2)
- AGENT 1.B.2: **edge-function-builder** — pgcrypto extension enable + `app.set_updated_at()` trigger function + apply to mutable tables
- AGENT 1.B.3: **deployment-agent** — Set up Resend SMTP credentials in Supabase Auth + DNS records (SPF, DKIM, DMARC)
- AGENT 1.B.4: **backend-builder** — Sentry integration (Next.js client + server, environment tags)
- AGENT 1.B.5: **backend-builder** — `next-intl` setup with `src/messages/en/*.json` namespace files

**PARALLEL batch 1.C (4 agents):**
- AGENT 1.C.1: **test-writer** — pgTAP installation + first cross-tenant test scaffold
- AGENT 1.C.2: **test-writer** — Vitest setup + first server action test pattern
- AGENT 1.C.3: **test-writer** — Playwright setup + first E2E scaffold (visit homepage, check status)
- AGENT 1.C.4: **deployment-agent** — GitHub Actions CI: lint + typecheck + pgtap + vitest on every push

**HUMAN: Week 1 spike (CANNOT DELEGATE):**
- Real iPad QR scanner PoC (verify @zxing/browser works on iOS Safari with shop dust/glare)

**Week 1 review checkpoint:**
- Repo deploys cleanly
- Test invite email lands in Gmail/Outlook/iCloud
- Camera scanner spike succeeds on real iPad

### Week 2: Auth foundation

**SEQUENTIAL: schema first**
- AGENT 2.0: **schema-writer** — `staff`, `shop_employees`, `workstations` tables + cross-table email uniqueness trigger + linking trigger on auth.users + Auth Hook Postgres function (per spec §5.2)

**PARALLEL batch 2.A (4 agents) — depends on 2.0:**
- AGENT 2.A.1: **backend-builder** — Auth Hook configuration script + grants + BYPASSRLS verification
- AGENT 2.A.2: **backend-builder** — `modules/auth/actions.ts` (signInStaff, signOutStaff, requestPasswordReset)
- AGENT 2.A.3: **backend-builder** — `modules/settings/actions.ts` for inviteStaff (depends on auth)
- AGENT 2.A.4: **type-generator** — Run `supabase gen types typescript` to update `src/shared/db/types.ts`

**PARALLEL batch 2.B (4 agents):**
- AGENT 2.B.1: **frontend-builder** — `<SignInForm>`, `<SignOutButton>` components
- AGENT 2.B.2: **frontend-builder** — `/sign-in`, `/sign-out`, `/forgot-password`, `/set-password` pages
- AGENT 2.B.3: **frontend-builder** — `<MagicLinkRequestForm>`, `<MagicLinkSentScreen>`, `<MagicLinkExpiredScreen>`, `<AccessRevokedScreen>`
- AGENT 2.B.4: **frontend-builder** — proxy.ts cross-domain audience redirect logic

**PARALLEL batch 2.C (5 agents) — tests:**
- AGENT 2.C.1: **test-writer** — pgtap test_cross_tenant_isolation.sql
- AGENT 2.C.2: **test-writer** — pgtap test_audience_isolation.sql
- AGENT 2.C.3: **test-writer** — pgtap test_function_authorization.sql (auth hook + linking trigger)
- AGENT 2.C.4: **test-writer** — pgtap test_inactive_user.sql
- AGENT 2.C.5: **test-writer** — Playwright E2E for sign-in flow + magic link flow

**PARALLEL batch 2.D (3 agents):**
- AGENT 2.D.1: **docs-writer** — `src/modules/auth/README.md`
- AGENT 2.D.2: **security-auditor** — Review Auth Hook + linking trigger for cross-tenant leaks
- AGENT 2.D.3: **code-reviewer** — Review all server actions for missing rate limits

### Week 3: CRM + Settings

**SEQUENTIAL: schema first**
- AGENT 3.0: **schema-writer** — `companies`, `contacts`, `activities`, `tags`, `tagged_entities` migrations + RLS policies

**PARALLEL batch 3.A (6 agents):**
- AGENT 3.A.1: **backend-builder** — `modules/crm/actions.ts` (companies CRUD + activity logging)
- AGENT 3.A.2: **backend-builder** — `modules/crm/queries.ts` (listCompanies with filters)
- AGENT 3.A.3: **backend-builder** — `modules/tags/` full module (small)
- AGENT 3.A.4: **backend-builder** — `modules/settings/actions.ts` (updateShopSettings, staff management, audit log query)
- AGENT 3.A.5: **type-generator** — Refresh types
- AGENT 3.A.6: **i18n-extractor** — Extract auth + crm strings into `messages/en/*.json`

**PARALLEL batch 3.B (6 agents) — UI:**
- AGENT 3.B.1: **frontend-builder** — `<CompanyList>`, `<CompanyDetail>`, `<CompanyForm>`
- AGENT 3.B.2: **frontend-builder** — `<ContactPicker>`, `<ContactForm>`, `<ActivityFeed>`
- AGENT 3.B.3: **frontend-builder** — `<TagManager>`, `<TagPicker>`, `<TagBadge>`
- AGENT 3.B.4: **frontend-builder** — `<SettingsForm>`, `<StaffList>`, `<InviteStaffDialog>`
- AGENT 3.B.5: **frontend-builder** — `<AuditLogViewer>` with filtering
- AGENT 3.B.6: **frontend-builder** — `/(office)/companies/*`, `/(office)/settings/*` routes

**PARALLEL batch 3.C (5 agents) — tests:**
- AGENT 3.C.1: **test-writer** — pgtap RLS tests for companies/contacts/activities
- AGENT 3.C.2: **test-writer** — pgtap RLS tests for tags
- AGENT 3.C.3: **test-writer** — Vitest tests for all CRM server actions
- AGENT 3.C.4: **test-writer** — Vitest tests for settings server actions
- AGENT 3.C.5: **test-writer** — Playwright E2E: invite staff → create company → add contact → log activity

**PARALLEL batch 3.D (3 agents):**
- AGENT 3.D.1: **docs-writer** — READMEs for crm, tags, settings modules
- AGENT 3.D.2: **accessibility-auditor** — Audit company/contact/settings forms for WCAG
- AGENT 3.D.3: **security-auditor** — Review activity polymorphic entity_type for injection risks

### Week 4: Jobs

**SEQUENTIAL: schema first**
- AGENT 4.0: **schema-writer** — `jobs` table (with all part counts, parent_job_id, etc.) + `next_job_number()` function + status state matrix CHECK constraints + REVOKE UPDATE on production_status

**PARALLEL batch 4.A (5 agents):**
- AGENT 4.A.1: **backend-builder** — `modules/jobs/actions.ts` (createJob, updateJob, archiveJob, scheduleJob, markInProduction, cloneJob)
- AGENT 4.A.2: **backend-builder** — `modules/jobs/actions.ts` (continued: splitJobForMultiColor, placeOnHold, releaseFromHold, recordPartCounts)
- AGENT 4.A.3: **backend-builder** — `modules/jobs/queries.ts` (listJobs with all filters, getJobById)
- AGENT 4.A.4: **backend-builder** — `modules/jobs/schemas.ts` (Zod validation)
- AGENT 4.A.5: **type-generator** — Refresh types

**PARALLEL batch 4.B (5 agents) — UI:**
- AGENT 4.B.1: **frontend-builder** — `<JobList>` with all filters
- AGENT 4.B.2: **frontend-builder** — `<JobForm>` (create/edit)
- AGENT 4.B.3: **frontend-builder** — `<JobDetail>` (timeline placeholder, parts panel, hold panel, child jobs panel)
- AGENT 4.B.4: **frontend-builder** — `<JobHoldDialog>`, `<MultiColorSplitter>`
- AGENT 4.B.5: **frontend-builder** — `/(office)/jobs/*` routes

**PARALLEL batch 4.C (4 agents) — tests:**
- AGENT 4.C.1: **test-writer** — pgtap test for next_job_number atomicity (concurrent inserts)
- AGENT 4.C.2: **test-writer** — pgtap RLS tests for jobs
- AGENT 4.C.3: **test-writer** — Vitest: createJob happy path + multi-color split + hold flow
- AGENT 4.C.4: **test-writer** — Playwright E2E: create job → schedule → split into children

### Week 5: Packets + Storage

**SEQUENTIAL: storage schema first**
- AGENT 5.0: **schema-writer** — `attachments` table + `can_user_access_attachment_path` SQL function + storage bucket policies

**PARALLEL batch 5.A (5 agents):**
- AGENT 5.A.1: **backend-builder** — `shared/storage/` module (upload, signed URLs, delete)
- AGENT 5.A.2: **backend-builder** — Storage path helpers (polymorphic path scheme)
- AGENT 5.A.3: **backend-builder** — `modules/packets/actions.ts` (generatePacketPdf with caching)
- AGENT 5.A.4: **backend-builder** — `modules/packets/queries.ts` (regenerateQrSvg)
- AGENT 5.A.5: **research-verifier** — Verify @react-pdf/renderer + qrcode current best practices for 2026

**PARALLEL batch 5.B (5 agents) — UI:**
- AGENT 5.B.1: **frontend-builder** — `<PacketPreview>` component
- AGENT 5.B.2: **frontend-builder** — `<QrCodeImage>`, `<PrintablePacketLayout>` (React-PDF document)
- AGENT 5.B.3: **frontend-builder** — `<FileUploadZone>`, `<AttachmentList>`, `<ImageGallery>` for shared/storage
- AGENT 5.B.4: **frontend-builder** — `/(office)/jobs/[id]/packet` route
- AGENT 5.B.5: **frontend-builder** — Logo upload UI in settings (uses storage)

**PARALLEL batch 5.C (4 agents) — tests:**
- AGENT 5.C.1: **test-writer** — pgtap test_polymorphic_attachments.sql (cross-customer denial)
- AGENT 5.C.2: **test-writer** — Vitest: PDF generation, QR error correction level H
- AGENT 5.C.3: **test-writer** — Playwright E2E: print packet → scan QR with phone camera (manual)
- AGENT 5.C.4: **performance-auditor** — Time PDF cold-start; verify caching by job_id works

### Week 6: Workstation enrollment + Scanner shell

**SEQUENTIAL: schema first**
- AGENT 6.0: **schema-writer** — `job_status_history` table + denorm `company_id` trigger + `compute_status_event_metadata` trigger + `record_scan_event` function + `validate_employee_pin` function + workstation lifecycle wrappers (claim_workstation, record_workstation_heartbeat, release_workstation)

**PARALLEL batch 6.A (5 agents):**
- AGENT 6.A.1: **backend-builder** — `modules/settings/createWorkstation` flow (synthetic Supabase user creation)
- AGENT 6.A.2: **backend-builder** — `modules/scanning/actions.ts` (enrollWorkstation, claimWorkstation, releaseWorkstation, recordWorkstationHeartbeat)
- AGENT 6.A.3: **backend-builder** — `modules/scanning/queries.ts` (lookupJobByPacketToken with prefix matching)
- AGENT 6.A.4: **edge-function-builder** — `supabase/functions/inactivity-sweeper/` (hourly cron)
- AGENT 6.A.5: **edge-function-builder** — `supabase/functions/pin-lockout-cleanup/` (5-min cron)

**PARALLEL batch 6.B (5 agents) — UI:**
- AGENT 6.B.1: **frontend-builder** — `/scan/enroll` page + `<WorkstationEnroll>` component
- AGENT 6.B.2: **frontend-builder** — `<EmployeePicker>` (tile grid + filter for >12 employees)
- AGENT 6.B.3: **frontend-builder** — `<EmployeePinPad>` (4-digit numeric pad, no keyboard)
- AGENT 6.B.4: **frontend-builder** — `<SwitchUserButton>`, inactivity heartbeat hook
- AGENT 6.B.5: **frontend-builder** — Workstation enrollment QR display in settings

**PARALLEL batch 6.C (4 agents) — tests:**
- AGENT 6.C.1: **test-writer** — pgtap: validate_employee_pin lockout after 5 failures, atomic
- AGENT 6.C.2: **test-writer** — pgtap: claim_workstation optimistic concurrency
- AGENT 6.C.3: **test-writer** — pgtap: record_scan_event cross-tenant denial
- AGENT 6.C.4: **test-writer** — Playwright E2E: enroll workstation → PIN tap → look up job

### Week 7: Camera scanner + Scan event

**PARALLEL batch 7.A (5 agents):**
- AGENT 7.A.1: **frontend-builder** — `<CameraScanner>` with @zxing/browser
- AGENT 7.A.2: **frontend-builder** — `<ManualPacketEntry>` component (last-8-char prefix)
- AGENT 7.A.3: **frontend-builder** — `<ScanResultPanel>`, `<StageTransitionButtons>`, `<HoldDialog>`
- AGENT 7.A.4: **frontend-builder** — Wrong-workstation warning dialog
- AGENT 7.A.5: **frontend-builder** — Concurrent scan handling UI ("moved by [other employee]")

**PARALLEL batch 7.B (4 agents):**
- AGENT 7.B.1: **backend-builder** — `recordScanEvent` server action (with photo upload + record_scan_event call)
- AGENT 7.B.2: **frontend-builder** — Snap-photo-at-scan flow (canvas → JPEG q=0.7, 1024px max)
- AGENT 7.B.3: **frontend-builder** — Sound + haptic feedback on success
- AGENT 7.B.4: **frontend-builder** — `/scan/scanner` page assembly

**PARALLEL batch 7.C (4 agents) — tests:**
- AGENT 7.C.1: **test-writer** — Vitest: recordScanEvent happy path + photo upload
- AGENT 7.C.2: **test-writer** — Playwright E2E: scan job through 7 stages + photo + hold
- AGENT 7.C.3: **test-writer** — pgtap: record_scan_event picked_up sets timestamp + intake_status transition
- AGENT 7.C.4: **performance-auditor** — Scan event end-to-end latency (<200ms target)

### Week 8: Timeline + Dashboard

**PARALLEL batch 8.A (4 agents):**
- AGENT 8.A.1: **backend-builder** — `modules/timeline/queries.ts` (getJobTimeline, getCurrentStageInfo, getJobsAtStage, getJobsStuckInStage, getRecentActivity)
- AGENT 8.A.2: **schema-writer** — `jobs_with_latest_event` view (LATERAL join optimization) + `customer_visible_timeline` view
- AGENT 8.A.3: **backend-builder** — `modules/dashboard/queries.ts` (getDashboardSnapshot)
- AGENT 8.A.4: **backend-builder** — `shared/realtime/use-subscription.ts` (single shared subscription per tab via Context)

**PARALLEL batch 8.B (5 agents) — UI:**
- AGENT 8.B.1: **frontend-builder** — `<JobTimeline>` (visual stage progression + duration badges)
- AGENT 8.B.2: **frontend-builder** — `<StageProgressBar>`, `<DurationBadge>`, `<ReworkBadge>`, `<UnusualTransitionBadge>`
- AGENT 8.B.3: **frontend-builder** — `<KanbanByStage>` with drag-disabled (status changes only via scan)
- AGENT 8.B.4: **frontend-builder** — `<StatCards>`, `<RecentActivityFeed>`, `<OverdueJobsList>`, `<DueTodayPanel>`
- AGENT 8.B.5: **frontend-builder** — `<DashboardFilters>` (company, due date, tag, priority) + `/(office)/` route

**PARALLEL batch 8.C (4 agents) — tests:**
- AGENT 8.C.1: **test-writer** — Vitest: timeline queries against fixture data
- AGENT 8.C.2: **test-writer** — Playwright: dashboard live updates via realtime
- AGENT 8.C.3: **performance-auditor** — Dashboard load time with 1000 jobs
- AGENT 8.C.4: **test-writer** — pgtap: jobs_with_latest_event view correctness

### Week 9: Customer portal

**SEQUENTIAL: DNS + middleware first**
- AGENT 9.0: **deployment-agent** — Verify track.popsindustrial.com DNS + Vercel domain attached + tenant_domains seeded

**PARALLEL batch 9.A (5 agents):**
- AGENT 9.A.1: **backend-builder** — `modules/portal/actions.ts` (requestCustomerMagicLink with rate limit + anti-enumeration, signOutCustomer)
- AGENT 9.A.2: **backend-builder** — `modules/portal/actions.ts` (inviteCustomer + sendInitialMagicLink — office-side)
- AGENT 9.A.3: **backend-builder** — `modules/portal/queries.ts` (getCustomerJobs, getCustomerJobDetail, getCustomerJobTimeline)
- AGENT 9.A.4: **backend-builder** — `proxy.ts` host-based routing for track.* (rewrites to (portal) route group)
- AGENT 9.A.5: **schema-writer** — Add customer_visible filter triggers/views as needed

**PARALLEL batch 9.B (5 agents) — UI:**
- AGENT 9.B.1: **frontend-builder** — `<CustomerLayout>` with brand from shop_settings
- AGENT 9.B.2: **frontend-builder** — `<CustomerJobList>`, `<CustomerJobCard>`
- AGENT 9.B.3: **frontend-builder** — `<CustomerJobDetail>`, `<CustomerProgressTracker>`, `<CustomerTimeline>`
- AGENT 9.B.4: **frontend-builder** — `/(portal)/auth/callback`, magic link flows
- AGENT 9.B.5: **frontend-builder** — Realtime subscription wired to customer's company's jobs

**PARALLEL batch 9.C (4 agents) — tests:**
- AGENT 9.C.1: **test-writer** — pgtap: customer cannot see other companies' jobs
- AGENT 9.C.2: **test-writer** — Vitest: anti-enumeration silent success on unknown email
- AGENT 9.C.3: **test-writer** — Playwright E2E: customer receives magic link → signs in → sees jobs → live update
- AGENT 9.C.4: **security-auditor** — Verify magic link replay protection + revoked-mid-session handling

### Week 10: Offline mode

**HUMAN: extended iPad testing throughout this week (cannot delegate)**

**SEQUENTIAL: foundation first**
- AGENT 10.0: **frontend-builder** — Service worker scaffold + scope to `/scan/*`

**PARALLEL batch 10.A (5 agents):**
- AGENT 10.A.1: **frontend-builder** — IndexedDB queue schema + helpers (Dexie or raw IDB)
- AGENT 10.A.2: **frontend-builder** — Photo compression pipeline (canvas → JPEG, max 1024px, q=0.7)
- AGENT 10.A.3: **frontend-builder** — Foreground polling replay logic (iOS Safari has no Background Sync)
- AGENT 10.A.4: **frontend-builder** — `<OfflineBanner>` ("OFFLINE — N SCANS QUEUED")
- AGENT 10.A.5: **frontend-builder** — Queue size cap (100 scans / 50MB) + cleanup logic

**PARALLEL batch 10.B (3 agents):**
- AGENT 10.B.1: **frontend-builder** — Conflict resolution UI (modal: apply / discard / keep both)
- AGENT 10.B.2: **frontend-builder** — Eager photo upload on reconnect (before scan replay)
- AGENT 10.B.3: **frontend-builder** — Stale-employee detection in replay (employee deactivated mid-offline)

**PARALLEL batch 10.C (3 agents) — tests:**
- AGENT 10.C.1: **test-writer** — Playwright E2E: offline scanner → 5 scans → reconnect → all replay
- AGENT 10.C.2: **test-writer** — Playwright: offline conflict resolution path
- AGENT 10.C.3: **test-writer** — Manual test scenarios doc (for human iPad testing)

### Week 11: Polish + Pre-prod testing

**PARALLEL batch 11.A (6 agents) — sweep all UI:**
- AGENT 11.A.1: **frontend-builder** — Empty states for every list view (sweep)
- AGENT 11.A.2: **frontend-builder** — Loading states (skeleton components) for every async area
- AGENT 11.A.3: **frontend-builder** — Error boundaries with friendly messages (sweep)
- AGENT 11.A.4: **frontend-builder** — 404 / 500 pages with brand
- AGENT 11.A.5: **frontend-builder** — Toast notification system (sonner) + integration in all actions
- AGENT 11.A.6: **frontend-builder** — Dark mode toggle in scanner UI (for dim shop lighting)

**PARALLEL batch 11.B (5 agents) — comprehensive testing:**
- AGENT 11.B.1: **test-writer** — pgtap: gap-fill any RLS policy not yet tested (target 100% policy coverage)
- AGENT 11.B.2: **test-writer** — Vitest: gap-fill server action tests (target 80% coverage)
- AGENT 11.B.3: **test-writer** — Playwright: full critical-flow regression suite
- AGENT 11.B.4: **test-writer** — Playwright: multi-color (parent/child) flow
- AGENT 11.B.5: **test-writer** — Playwright: concurrent scan conflict flow

**PARALLEL batch 11.C (5 agents) — audits:**
- AGENT 11.C.1: **security-auditor** — Final security review: SQL injection, XSS, CSRF, service-role usage
- AGENT 11.C.2: **accessibility-auditor** — WCAG 2.1 AA compliance check across all pages
- AGENT 11.C.3: **performance-auditor** — Lighthouse scores for all routes; Core Web Vitals
- AGENT 11.C.4: **dependency-auditor** — `npm audit` + license check
- AGENT 11.C.5: **code-reviewer** — Code quality sweep (dead code, unused imports, complexity)

**PARALLEL batch 11.D (3 agents):**
- AGENT 11.D.1: **deployment-agent** — Backup drill: trigger a Supabase PITR restore to test project
- AGENT 11.D.2: **edge-function-builder** — Verify all Edge Function crons fire on schedule
- AGENT 11.D.3: **docs-writer** — Update all module READMEs with current state

**HUMAN: iPad on-site testing (touch targets with gloves, dust, lighting, camera fail scenarios)**

### Week 12: Production deploy + Pops onboarding

**SEQUENTIAL: production setup**
- AGENT 12.0: **deployment-agent** — Production Supabase project + migrations applied + custom SMTP verified

**PARALLEL batch 12.A (4 agents):**
- AGENT 12.A.1: **deployment-agent** — Production Vercel deploy + env vars
- AGENT 12.A.2: **deployment-agent** — Sentry production project + alert rules
- AGENT 12.A.3: **deployment-agent** — Backup automation: GitHub Actions cron → Backblaze B2 weekly
- AGENT 12.A.4: **seed-script-writer** — `scripts/seed-tenant.ts` for Pops (tenant, shop_settings, owner staff)

**PARALLEL batch 12.B (3 agents):**
- AGENT 12.B.1: **docs-writer** — Pops office staff training cheat sheet (laminated, posted at desk)
- AGENT 12.B.2: **docs-writer** — Pops shop staff training cheat sheet (one per workstation)
- AGENT 12.B.3: **docs-writer** — 5-minute training video script (record human, host on YouTube unlisted)

**HUMAN-ONLY tasks (cannot delegate, ~3-4 days):**
- Physical install of tablets (mounting, cable runs)
- iPad MDM enrollment + kiosk mode
- Run seed-tenant.ts; configure Pops's logo, hours
- Create real workstations + print enrollment QRs + walk to each tablet
- Create real shop_employees with PINs + photos
- Train Pops office staff (~0.5 day)
- Train shop staff per shift (~1 day per shift)
- Live-observe first half-day of production
- Fix issues immediately

### Week 13: Wave 1 ship gate (HUMAN-DRIVEN)

- 3 production days minimum observation
- Verify gate criteria (per spec §6.4):
  - 1+ multi-color job successfully tracked
  - 1+ rework loop tracked
  - 1+ customer signed in to portal
  - Backups verified
  - <5 Sentry errors
  - Owner says "yes, this is better"

**Agent assist:**
- AGENT 13.1: **performance-auditor** — Daily report on Sentry errors, scan latency, uptime
- AGENT 13.2: **security-auditor** — Re-verify no cross-tenant leaks in production (with anonymized prod data)

### Week 14: Rest week

No agents. Take a break.

---

## 4. Wave 2 sub-agent batches (Weeks 15-20)

### Weeks 15-16: Inventory module

**SEQUENTIAL: schema first**
- AGENT 15.0: **schema-writer** — `color_library`, `inventory_items`, `inventory_movements`, `job_inventory_usage` tables + ALTER jobs ADD color_library_id

**PARALLEL batch 15.A (5 agents):**
- AGENT 15.A.1: **backend-builder** — `modules/inventory/actions.ts` (createInventoryItem, recordRestock, recordConsumption, recordDamage, adjustQuantity)
- AGENT 15.A.2: **backend-builder** — `modules/inventory/queries.ts` (getInventoryStatus, getJobMaterialUsage, getLowStockItems)
- AGENT 15.A.3: **backend-builder** — `modules/inventory/color-library.ts` (CRUD)
- AGENT 15.A.4: **backend-builder** — Scanner integration: consumption prompt at coating stage
- AGENT 15.A.5: **seed-script-writer** — Backfill script: link existing job color text → color_library entries

**PARALLEL batch 15.B (5 agents) — UI:**
- AGENT 15.B.1: **frontend-builder** — `<InventoryList>`, `<InventoryItemForm>`
- AGENT 15.B.2: **frontend-builder** — `<RestockForm>`, `<ConsumptionForm>`, `<AdjustmentDialog>`
- AGENT 15.B.3: **frontend-builder** — `<ColorLibraryManager>`, `<ColorPicker>`
- AGENT 15.B.4: **frontend-builder** — `<LowStockBadge>`, low stock view in dashboard
- AGENT 15.B.5: **frontend-builder** — Job material usage panel on `<JobDetail>`

**PARALLEL batch 15.C (4 agents) — tests:**
- AGENT 15.C.1: **test-writer** — pgtap RLS for inventory tables
- AGENT 15.C.2: **test-writer** — Vitest: inventory action paths
- AGENT 15.C.3: **test-writer** — Playwright: scan into coating → record powder consumption
- AGENT 15.C.4: **test-writer** — pgtap: inventory_movements signed quantity (CHECK quantity != 0)

### Week 17: Quality module

**SEQUENTIAL: schema first**
- AGENT 17.0: **schema-writer** — `qc_inspections` table + ALTER attachments CHECK to add 'qc_inspection'

**PARALLEL batch 17.A (4 agents):**
- AGENT 17.A.1: **backend-builder** — `modules/quality/actions.ts` (createQcInspection, addQcPhoto, markRequiresRework)
- AGENT 17.A.2: **backend-builder** — Scanner integration: QC pass moves job to completed; fail moves to prep with is_rework=true
- AGENT 17.A.3: **frontend-builder** — `<QcInspectionForm>` with defect checklist
- AGENT 17.A.4: **frontend-builder** — `<QcResultBadge>`, QC history panel on JobDetail

**PARALLEL batch 17.B (3 agents) — tests:**
- AGENT 17.B.1: **test-writer** — pgtap: QC fail → job back to prep + parts_rework_count incremented
- AGENT 17.B.2: **test-writer** — Vitest: defect categorization
- AGENT 17.B.3: **test-writer** — Playwright: scan into QC → fail with photo → job in prep

### Weeks 18-19: Alerts + Notifications

**SEQUENTIAL: schemas first**
- AGENT 18.0: **schema-writer** — `alert_rules`, `alerts`, `notification_preferences`, `notification_log` tables

**PARALLEL batch 18.A (6 agents):**
- AGENT 18.A.1: **backend-builder** — `modules/alerts/actions.ts` (createAlertRule, acknowledgeAlert, resolveAlert)
- AGENT 18.A.2: **edge-function-builder** — `supabase/functions/alerts-evaluator/` (5-min cron, evaluates all rule types)
- AGENT 18.A.3: **edge-function-builder** — `supabase/functions/stuck-job-pinger/` (hourly cron)
- AGENT 18.A.4: **backend-builder** — `modules/notifications/actions.ts` (updateNotificationPreferences, enqueueEmail)
- AGENT 18.A.5: **edge-function-builder** — `supabase/functions/notification-dispatcher/` (1-min cron, sends queued emails)
- AGENT 18.A.6: **backend-builder** — Resend webhook handler at `/api/webhooks/resend` (bounce/complaint → notification_log status)

**PARALLEL batch 18.B (5 agents) — UI + email templates:**
- AGENT 18.B.1: **frontend-builder** — `<AlertRulesList>`, `<AlertRuleForm>`, `<AlertsPanel>`, `<AlertBadge>`
- AGENT 18.B.2: **frontend-builder** — `/(office)/alerts/*` routes
- AGENT 18.B.3: **frontend-builder** — Email templates (React Email): job_received, job_completed, delay_alert, picked_up, daily_digest, weekly_digest
- AGENT 18.B.4: **frontend-builder** — `<NotificationPreferencesForm>` for customer portal
- AGENT 18.B.5: **frontend-builder** — `<NotificationLogList>` (admin view)

**PARALLEL batch 18.C (4 agents) — tests:**
- AGENT 18.C.1: **test-writer** — pgtap: each rule_type query produces correct alerts
- AGENT 18.C.2: **test-writer** — Vitest: notification dispatch happy + bounce path
- AGENT 18.C.3: **test-writer** — Playwright: alert triggered → email received (mock Resend)
- AGENT 18.C.4: **research-verifier** — Verify Resend bounce webhook signature validation in 2026

### Week 20: Multi-role customer portal

**SEQUENTIAL: schema migration first**
- AGENT 20.0: **schema-writer** — ALTER customer_users ADD role + RLS policy updates

**PARALLEL batch 20.A (4 agents):**
- AGENT 20.A.1: **backend-builder** — Customer admin invite flow (inviteCustomerUser by admin role)
- AGENT 20.A.2: **backend-builder** — Permission filter logic (viewer can't see prices, accounting sees billing)
- AGENT 20.A.3: **frontend-builder** — Customer settings UI for admins (manage users, set roles)
- AGENT 20.A.4: **frontend-builder** — Role-based UI hiding (price columns, etc.)

**PARALLEL batch 20.B (3 agents):**
- AGENT 20.B.1: **test-writer** — pgtap: each role's RLS allows/denies correctly
- AGENT 20.B.2: **test-writer** — Playwright: customer admin invites viewer → viewer signs in → can't see prices
- AGENT 20.B.3: **performance-auditor** — Wave 2 ship gate: end-to-end metrics

**Wave 2 ship gate (HUMAN):**
- 2 weeks of inventory tracking
- 5+ QC inspections
- 3+ alerts triggered + resolved
- Customer notifications not in spam
- Customer admin invited a peer

---

## 5. Wave 3 sub-agent batches (Weeks 21-28)

### Weeks 21-22: Quotes

**SEQUENTIAL: schema first**
- AGENT 21.0: **schema-writer** — `quotes`, `quote_line_items` tables + status state checks

**PARALLEL batch 21.A (5 agents):**
- AGENT 21.A.1: **backend-builder** — `modules/quotes/actions.ts` (createQuote, addLineItem, sendQuote, markApproved, reviseQuote, convertToJob)
- AGENT 21.A.2: **backend-builder** — `modules/quotes/queries.ts` (listQuotes, getQuoteById)
- AGENT 21.A.3: **frontend-builder** — `<QuoteList>`, `<QuoteForm>`, `<LineItemEditor>`
- AGENT 21.A.4: **frontend-builder** — `<QuotePdfPreview>` + quote PDF document (React-PDF)
- AGENT 21.A.5: **frontend-builder** — Quote send dialog (email PDF via Resend)

**PARALLEL batch 21.B (3 agents) — tests:**
- AGENT 21.B.1: **test-writer** — pgtap RLS for quotes (sent/approved visible to customer)
- AGENT 21.B.2: **test-writer** — Vitest: quote revision flow
- AGENT 21.B.3: **test-writer** — Playwright: create quote → send → customer approves → convert to job

### Weeks 23-24: Invoices + Payments

**SEQUENTIAL: schema first**
- AGENT 23.0: **schema-writer** — `invoices`, `invoice_line_items`, `payment_records` tables

**PARALLEL batch 23.A (5 agents):**
- AGENT 23.A.1: **backend-builder** — `modules/invoices/actions.ts` (createInvoiceFromJob, sendInvoice)
- AGENT 23.A.2: **backend-builder** — `modules/invoices/actions.ts` (recordPayment, markPaid, voidInvoice)
- AGENT 23.A.3: **backend-builder** — `modules/invoices/queries.ts` (listInvoices, getOutstandingBalance, getAgingReport)
- AGENT 23.A.4: **frontend-builder** — `<InvoiceList>`, `<InvoiceForm>`, `<PaymentRecordForm>`
- AGENT 23.A.5: **frontend-builder** — Invoice PDF + send dialog

**OPTIONAL (if Stripe in scope, +1 week):**
- AGENT 23.B.1: **research-verifier** — Verify Stripe Payments API for 2026
- AGENT 23.B.2: **backend-builder** — Stripe webhook handler at `/api/webhooks/stripe`
- AGENT 23.B.3: **frontend-builder** — Online payment UI in customer portal
- AGENT 23.B.4: **test-writer** — Stripe test mode flows

**PARALLEL batch 23.C (3 agents) — tests:**
- AGENT 23.C.1: **test-writer** — pgtap RLS for invoices (customer sees only their own)
- AGENT 23.C.2: **test-writer** — Vitest: payment recording + balance calculation
- AGENT 23.C.3: **test-writer** — Playwright: create invoice → record payment → outstanding balance updates

### Week 25: Analytics

**PARALLEL batch 25.A (5 agents):**
- AGENT 25.A.1: **backend-builder** — `modules/analytics/queries.ts` (getProductionMetrics, getStageBottlenecks, getEmployeePerformance, getInventoryUsage)
- AGENT 25.A.2: **frontend-builder** — `<ProductionChart>` with Recharts (turnaround time histogram, stage durations)
- AGENT 25.A.3: **frontend-builder** — `<StageBottleneckTable>`, `<EmployeeOutputChart>`
- AGENT 25.A.4: **frontend-builder** — `<InventoryUsageChart>`, `<MaterialCostChart>`
- AGENT 25.A.5: **frontend-builder** — `/(office)/reports/*` routes with date range picker

**PARALLEL batch 25.B (3 agents):**
- AGENT 25.B.1: **performance-auditor** — Profile each analytics query; create materialized views if >2s
- AGENT 25.B.2: **schema-writer** — Materialized views as needed (`analytics_snapshots`)
- AGENT 25.B.3: **test-writer** — Vitest + Playwright for analytics

### Week 26: Public tracking

**PARALLEL batch 26.A (5 agents):**
- AGENT 26.A.1: **schema-writer** — `job_public_tokens` table + `get_public_job_view(token)` SECURITY DEFINER function
- AGENT 26.A.2: **backend-builder** — `modules/public-tracking/actions.ts` (createPublicToken, expirePublicToken)
- AGENT 26.A.3: **backend-builder** — Token rate limiting (per token + per IP)
- AGENT 26.A.4: **frontend-builder** — `/track/[token]` route + `<PublicJobTracker>` (no auth)
- AGENT 26.A.5: **test-writer** — pgtap: invalid/expired token denied; rate limit fires

### Week 27: Messaging

**SEQUENTIAL: schema first**
- AGENT 27.0: **schema-writer** — `message_threads`, `messages` tables + RLS

**PARALLEL batch 27.A (5 agents):**
- AGENT 27.A.1: **backend-builder** — `modules/messaging/actions.ts` (createMessage, markThreadRead)
- AGENT 27.A.2: **backend-builder** — `modules/messaging/queries.ts` (getThreadsForJob, getMessagesInThread)
- AGENT 27.A.3: **frontend-builder** — `<MessageThread>`, `<MessageInput>`, `<UnreadBadge>` for office UI
- AGENT 27.A.4: **frontend-builder** — Customer-side messaging UI on `<CustomerJobDetail>`
- AGENT 27.A.5: **backend-builder** — Email notification on new message (uses notifications module)

**PARALLEL batch 27.B (3 agents) — tests:**
- AGENT 27.B.1: **test-writer** — pgtap: customer sees only their thread; cross-customer denied
- AGENT 27.B.2: **test-writer** — Playwright: office sends message → customer receives email + sees in portal
- AGENT 27.B.3: **test-writer** — Vitest: realtime subscription delivers new message

### Week 28: Wave 3 polish + ship

**PARALLEL batch 28.A (5 agents):**
- AGENT 28.A.1: **frontend-builder** — Polish across all Wave 3 features (empty states, loading, errors)
- AGENT 28.A.2: **test-writer** — Wave 3 RLS test additions (full pgtap coverage)
- AGENT 28.A.3: **performance-auditor** — Final perf audit; any analytics dashboard slower than 2s gets a materialized view
- AGENT 28.A.4: **security-auditor** — Final security audit (focus on quotes, payments, public tracking, messaging)
- AGENT 28.A.5: **docs-writer** — Update all Wave 2/3 module READMEs

**Wave 3 ship gate (HUMAN):**
- 3+ quotes sent → 1 approved → 1 invoice paid
- 1+ customer-shop message exchange
- Analytics dashboard <2s load
- Public tracking link tested against rate limit abuse

---

## 5.5 Wave 4 sub-agent batches (Weeks 29-36) — Whitelabel + Tenant 2 onboarding

Wave 4 makes the platform whitelabel-ready and onboards Tenant 2 (sandblasting). Multi-tenant isolation must remain unbroken throughout. Reference docs:

- [PRD §6.17 Tenant configuration & whitelabel](../PRD.md#617-tenant-configuration--whitelabel-wave-4)
- [PRD §6.18 Vertical workflow templates](../PRD.md#618-vertical-workflow-templates-wave-4)
- [PRD §6.19 Agency super-admin console](../PRD.md#619-agency-super-admin-console-wave-4)
- [DESIGN §6.8 Wave 4 detailed plan](DESIGN.md)
- [DESIGN §3.9 Wave 4 schema additions](DESIGN.md)

### Weeks 29-30: Tenant configuration & whitelabel foundation

**SEQUENTIAL: schema first**
- AGENT 29.0: **schema-writer** — `shop_settings` Wave 4 column expansions (accent_color_hex, email_from_name, email_from_address, module_toggles, tax_settings, vertical — only new columns; Wave 1's timezone/currency/business_hours reused) + `tenant_domains` Wave 4 column additions (verification_status, ssl_status, ssl_expires_at, verified_at — extends Wave 1 table). See DESIGN §3.9.

**PARALLEL batch 29.A (6 agents):**
- AGENT 29.A.1: **backend-builder** — `modules/tenant-config/actions.ts` (updateBranding, updateModuleToggles, updateWorkingHours, updateTaxSettings)
- AGENT 29.A.2: **backend-builder** — `modules/tenant-config/queries.ts` (getTenantConfig, getModuleEnabled)
- AGENT 29.A.3: **backend-builder** — `modules/tenant-config/domains.ts` (registerCustomDomain, verifyDomain, listDomains)
- AGENT 29.A.4: **frontend-builder** — `<BrandingForm>`, `<ModuleToggleGrid>`, `<WorkingHoursEditor>`
- AGENT 29.A.5: **frontend-builder** — `<DomainRegistrationFlow>` with DNS instructions + verification status
- AGENT 29.A.6: **infrastructure-builder** — `proxy.ts` generalization: host header → `tenant_domains` lookup → set tenant context; fallback to `<tenant>.<platform>.com` subdomain

**PARALLEL batch 29.B (4 agents):**
- AGENT 29.B.1: **backend-builder** — Vercel multi-domain provisioning (API integration to add custom domains to project)
- AGENT 29.B.2: **backend-builder** — Resend domain registration (per-tenant email-from with SPF/DKIM/DMARC verification)
- AGENT 29.B.3: **frontend-builder** — `<EmailIdentitySetup>` UI with copy-paste DNS instructions
- AGENT 29.B.4: **frontend-builder** — Theme renderer: CSS-variable injection at app shell from `shop_settings` (no compiled per-tenant CSS)

**PARALLEL batch 29.C (3 agents) — tests:**
- AGENT 29.C.1: **test-writer** — pgTAP RLS for tenant_config (cross-tenant isolation verified)
- AGENT 29.C.2: **test-writer** — pgTAP for tenant_domains (uniqueness across tenants; mutation only by tenant_admin)
- AGENT 29.C.3: **test-writer** — Playwright: Tenant 1 changes branding, sees update on `app.popsindustrial.com`; doesn't affect other tenants

### Weeks 31-32: Vertical workflow templates

**SEQUENTIAL: schema first**
- AGENT 31.0: **schema-writer** — `tenant_workflow_template` table + `jobs.workflow_template_id` / `workflow_template_version` columns (DESIGN §3.9)
- AGENT 31.0.1: **schema-writer** — Default workflow templates seed data: powder_coating (existing 7 stages), sandblasting (Received → Strip/Mask → Blast → Inspect → Completed → Picked Up), media_blasting, galvanizing, plating

**PARALLEL batch 31.A (5 agents):**
- AGENT 31.A.1: **backend-builder** — `modules/workflow-templates/actions.ts` (cloneDefault, editStages, setDefault, lockJobToVersion)
- AGENT 31.A.2: **backend-builder** — `modules/workflow-templates/queries.ts` (getTemplate, getDefaultForVertical, getStagesForJob)
- AGENT 31.A.3: **frontend-builder** — `<WorkflowTemplateEditor>` (drag-reorder stages, rename, add/remove with 3-12 enforced)
- AGENT 31.A.4: **frontend-builder** — `<StagePicker>` integration in job creation UI (uses tenant's active template)
- AGENT 31.A.5: **backend-builder** — Template versioning logic (lock existing jobs to version-at-creation; new jobs get current default)

**PARALLEL batch 31.B (3 agents) — tests:**
- AGENT 31.B.1: **test-writer** — pgTAP: cross-tenant template invisibility; jobs locked to old version after edit
- AGENT 31.B.2: **test-writer** — Vitest: stage edit produces new version; existing jobs unaffected
- AGENT 31.B.3: **test-writer** — Playwright: tenant edits sandblasting template; new jobs use edited stages; existing jobs use old stages

### Weeks 33-34: Agency super-admin console

**SEQUENTIAL: schema first**
- AGENT 33.0: **schema-writer** — `agency_users`, `agency_consent_token` tables + `audit_log.acted_as_tenant_id` column + `app.has_consent_for()` SECURITY DEFINER helper (DESIGN §3.9)

**PARALLEL batch 33.A (5 agents):**
- AGENT 33.A.1: **backend-builder** — `modules/agency-console/auth.ts` (signInAgency; Auth Hook expansion to issue `staff_agency` audience claim)
- AGENT 33.A.2: **backend-builder** — `modules/agency-console/consent.ts` (issueConsentToken, revokeToken, listActiveSessions)
- AGENT 33.A.3: **backend-builder** — `modules/agency-console/cross-tenant.ts` (listTenantHealth, getTenantConfig — config-only, NO data without active consent)
- AGENT 33.A.4: **frontend-builder** — `/(agency)/*` routes: tenant list, tenant detail (with consent flow), audit log viewer
- AGENT 33.A.5: **frontend-builder** — `<ConsentTokenIssuanceFlow>` on `tenant_admin` side: tenant_admin issues token via UI

**PARALLEL batch 33.B (3 agents) — tests:**
- AGENT 33.B.1: **test-writer** — pgTAP: agency role access without consent token blocked at DB level (defense in depth)
- AGENT 33.B.2: **test-writer** — pgTAP: impersonation actions audit-logged with `acted_as_tenant_id`; session expiry enforced; revocation respected
- AGENT 33.B.3: **test-writer** — Playwright: tenant_admin issues consent token → agency super-admin sees tenant data → audit log captures every read

### Weeks 35-36: Tenant 2 onboarding + Wave 4 polish

**PARALLEL batch 35.A (5 agents):**
- AGENT 35.A.1: **devops** — Run `scripts/seed-tenant.ts` for Tenant 2 (sandblasting); configure brand, custom domain, sandblasting workflow template, email-from identity
- AGENT 35.A.2: **frontend-builder** — Polish across Wave 4 features (empty states, loading, errors, accessibility)
- AGENT 35.A.3: **test-writer** — Wave 4 RLS test additions (full pgTAP coverage; cross-tenant + impersonation paths)
- AGENT 35.A.4: **security-auditor** — Final security audit (focus on agency console paths, consent token enforcement, cross-tenant queries, super-admin backdoor scenarios per DESIGN §8 risk #39)
- AGENT 35.A.5: **docs-writer** — Update Wave 4 module READMEs + verify cross-references to PRD §6.17/§6.18/§6.19 + DESIGN §3.9/§6.8

**PARALLEL batch 35.B (5 agents):**
- AGENT 35.B.1: **performance-auditor** — Cross-tenant query performance audit (verify per-tenant queries use tenant_id-prefixed indexes)
- AGENT 35.B.2: **test-writer** — Playwright E2E: Tenant 2 staff create job → scan → ship; verify Pops cannot see any of it
- AGENT 35.B.3: **test-writer** — Playwright E2E: Tenant 2 customer portal sees only Tenant 2 jobs (cross-tenant customer isolation)
- AGENT 35.B.4: **infrastructure-builder** — DNS health cron (weekly check on all `tenant_domains.ssl_status`; alert on expiring/expired)
- AGENT 35.B.5: **devops** — Onboarding playbook validation (PRD Appendix D.1) — confirm all steps executed for Tenant 2; whitelabel checklist (PRD Appendix E) signed off

**Wave 4 ship gate (HUMAN — Week 36):**
- 14+ days of Tenant 2 production scans
- Tenant 2 admin sign-off ("yes, this is better than what we had")
- Cross-tenant RLS verified end-to-end
- No P0 bugs for either tenant
- Onboarding playbook refined with Tenant 2 lessons learned
- See [DESIGN §6.9 Wave 4 ship gate criteria](DESIGN.md) for full list

**Wave 4 totals:** ~43 agent dispatches across 4 sub-phases. Heavy human involvement in Weeks 35-36 (Tenant 2 install, training, pilot run).

---

## 6. Cross-cutting / always-on agents

These run continuously or on schedule, not tied to specific weeks.

| Agent | Runs | Purpose |
|---|---|---|
| **PR-time security review** | On every PR | Service-role abuse check, missing RLS, SQL injection patterns |
| **PR-time code review** | On every PR | Quality, complexity, dead code |
| **PR-time test coverage check** | On every PR | New code has tests |
| **Daily Sentry triage** | Daily | New errors triaged + assigned |
| **Weekly dependency audit** | Weekly | `npm audit`, version updates |
| **Weekly performance check** | Weekly | Lighthouse, Core Web Vitals trend |
| **Weekly Resend bounce check** | Weekly | Email deliverability metrics |
| **Monthly backup restore drill** | Monthly | Verify backups actually restore |
| **Monthly cost trending** | Monthly | Vercel/Supabase usage; alert if anomalous |
| **Quarterly credential rotation drill** | Quarterly | Validates runbook works |

---

## 7. Human-only tasks (cannot be agented)

### Week 0
- Sign service agreement with Pops (Tenant 1)
- Pay vendor accounts (Vercel, Supabase, Resend, etc.)
- Configure DNS at registrar (need credentials)
- Buy iPads, brackets, cables
- Conduct WiFi survey at the shop floor
- Outsource brand identity to a designer (or use placeholder)

### Week 1
- Real iPad QR scanner spike (camera permissions, glare, dust)

### Week 11
- iPad on-site testing in shop conditions
- Print actual physical packets and verify scannability

### Week 12
- Physical install of tablets (mounting, cable runs)
- Train Pops office staff (~0.5 day)
- Train shop staff per shift (~1 day per shift)
- Live-observe first half-day of production
- Decide on issues that surface during onboarding

### Week 13 (Wave 1 ship gate)
- 3 production days observation
- Owner sign-off ("yes, this is better than what we had")

### Wave 2 / 3 onboardings
- Train Pops staff on new modules (inventory, alerts, quotes, etc.)

### Wave 4 — Weeks 29-30 (whitelabel infrastructure)
- Configure DNS strategy for multi-tenant custom domains (CNAME templates, Vercel domain provisioning)
- Design platform-side branding tokens (CSS variables, theme architecture)
- Audit Wave 1-3 code for any hardcoded "Pops" references that need to be tenant-driven (platformization audit)

### Wave 4 — Weeks 31-32 (vertical workflow templates)
- Source / shadow a sandblasting shop to validate the sandblasting workflow template before committing
- Decide which 2-3 adjacent verticals (galvanizing, plating, media blasting, ceramic coating) to ship default templates for
- Workflow template review with Pops's owner (does Pops want to customize the powder coating default?)

### Wave 4 — Weeks 33-34 (agency super-admin console)
- Define agency super-admin role policies (who at the operator can impersonate)
- Set up agency-side auth (separate Supabase auth project OR `agency_users` table within main project)
- Draft consent-token UX (how does a tenant_admin issue a token for support?)

### Wave 4 — Weeks 35-36 (Tenant 2 onboarding)
- Sales call → contract signed with Tenant 2 (sandblasting shop)
- Implementation Specialist runs Tenant 2 through onboarding playbook (PRD Appendix D.1)
- On-site or remote workstation enrollment ceremony at Tenant 2's shop
- Office + shop staff training at Tenant 2
- Pilot run + cutover (PRD Appendix E whitelabel checklist signed off)

### Week 36 (Wave 4 ship gate)
- 14+ days of Tenant 2 production scans
- Tenant 2 admin sign-off ("yes, this is better than what we had")
- Cross-tenant RLS verification: Tenant 2 cannot see Pops; Pops cannot see Tenant 2

### Ongoing
- Weekly status updates to Pops (Tenant 1) and Tenant 2+ admins
- Stakeholder check-ins (Weeks 5, 8, 10 for Pops; equivalent cadence for each new tenant)
- On-call response (Sentry alerts → triage → fix or schedule)
- Vendor contract renewals
- Platform feature requests (route to backlog with priority)

---

## 8. Synchronization points & quality gates

A synchronization point is where multiple parallel work streams must converge before next batch can start.

### Within a wave

| After | Sync point | Why |
|---|---|---|
| Each schema migration | All migrations applied to dev DB | Subsequent backend agents need types |
| Each module's backend | `supabase gen types typescript` runs | Frontend agents need typed actions |
| Each module's UI | Tests run | Test agents validate before merge |
| Week 1 foundation | Camera scanner spike succeeds | If iOS Safari is broken, Wave 1 architecture changes |
| Week 6 scanner | Real iPad tested | If permission UX is broken, scanner UX is wrong |
| Week 11 polish | All E2E passes + manual iPad QA | Required for Week 12 onboarding |
| Week 12 onboarding | Owner sign-off | Required for Wave 1 ship gate |

### Between waves

| Sync point | Required state |
|---|---|
| Wave 1 → Rest week | All ship-gate criteria met (DESIGN §6.4 / PRD §11.1) |
| Rest week → Wave 2 | Backlog groomed; Pops feedback incorporated |
| Wave 2 → Wave 3 | Wave 2 ship-gate criteria met (PRD §11.3) |
| Wave 3 → Wave 4 | Wave 3 ship-gate criteria met (PRD §11.4); Tenant 2 onboarding plan finalized; "platformization audit" identifies hardcoded Pops references to refactor |
| Wave 4 → Maintenance | Wave 4 ship-gate criteria met (DESIGN §6.9 / PRD §11.5); whitelabel isolation verified end-to-end; super-admin console pgTAP suite passing; runbooks current; backups verified |

---

## 9. Cost & token estimates

### 9.1 Per-agent cost (rough)

- Small focused agent (single module backend): ~50k-150k tokens total → ~$0.50-$2.00
- Medium agent (module backend + tests): ~150k-300k tokens → ~$2-$5
- Large agent (full module with UI): ~300k-500k tokens → ~$5-$10

### 9.2 Per-week cost estimate (see §13 for canonical totals)

- Average module-week: 15-20 agents × $3 average = **$45-$60/week**
- Heavy weeks (Week 1 foundation, Week 11 polish, Week 35 Tenant 2 onboarding): $90-$120/week
- Cross-cutting load (per-PR audits, weekly checks): ~$25/week ongoing
- 36 weeks total: ~**$1,800-$2,500 in agent costs** (canonical figure per §13)

### 9.3 Compared to solo dev value

Solo dev time saved: estimated 3-5 weeks of human time saved across the project.

If your effective hourly rate is $100-150, that's $12,000-$30,000 of time saved for $2,500 in agent costs. Net win.

### 9.4 Risk: agent compute costs blow up

- Set a monthly budget on Anthropic console
- Track cost per batch
- If a batch costs more than expected, investigate (probably due to agent retrying or going down rabbit holes)

---

## 10. Failure modes & mitigations

| Failure mode | Probability | Mitigation |
|---|---|---|
| Two agents edit the same file simultaneously | Medium | Brief each agent with non-overlapping file lists; check after batch |
| Agent produces broken code that breaks build | High | Each batch runs CI before merge; broken code stays in branch |
| Agent misinterprets the spec | Medium | Brief agents with specific spec section + line numbers |
| Agent goes off-brief (does too much) | Medium | Tight scope in brief; "do ONLY X, do NOT do Y" |
| Multiple agents duplicate work | Medium | Master orchestrator (you) tracks who's doing what |
| Agent takes too long / hangs | Low | Background agents can be killed via TaskStop; foreground agents are time-bounded |
| Agent depends on something not yet built | Medium | Sequence batches; check dependencies before dispatching |
| Token budget exceeded | Low | Per-agent cap; alert in Anthropic console |
| Agent generates code that passes tests but is wrong | Medium | Code review agent in cross-cutting layer + manual review of security-critical paths |
| Conflict between agent code and existing code | Medium | Agents read first, edit second (always Read before Edit) |

---

## 11. Suggested workflow for executing this plan

### 11.0 The binding constraint: reviewer throughput

**Parallelism is bounded by how fast you (the human) can review agent output, NOT by how many agents you can dispatch.**

Each agent produces a PR-sized diff. Realistic review time:
- Schema migration: 10-15 min
- Backend module: 30-45 min
- Frontend component set: 20-30 min
- Test file: 15-20 min
- Audit/research output: 10-15 min

**Realistic reviewer budget**: 6-8 PRs/day to actually land in main. More than that and quality slips OR PRs queue up unreviewed.

**Implication**: a "batch of 8 agents" doesn't mean "8 PRs landed today." It means "8 PRs produced, 6-8 reviewed today, the rest land tomorrow." Plan batch sizes accordingly:
- **Conservative**: 4-6 agents per batch, 1-2 batches per day → 6-8 PRs/day land
- **Aggressive**: 8 agents per batch, 1 batch per day → 8 PRs/day land (with overflow tomorrow)

Don't dispatch faster than you can review. Unreviewed agent code is technical debt, not progress.

### 11.1 Daily rhythm (revised — bounded by review throughput)

**Morning (1-2 hr): review + merge**
1. Review prior day's agent outputs (read diffs, check tests pass, request changes if needed)
2. Merge approved PRs to main
3. Run CI / integration smoke test on main
4. Plan today's batches with reviewer budget in mind

**Mid-day (1-2 hr): dispatch + parallel human work**
5. Dispatch ONE batch of 4-6 agents (use `run_in_background: true` so notifications come back)
6. While agents run, do human-only tasks: stakeholder, hardware, training, commercial decisions
7. As notifications arrive, mark tasks in progress

**Late-afternoon (2-3 hr): review what came back**
8. Review agent outputs in the order they completed
9. Send back any that need rework with specific feedback
10. Merge what's ready

**End of day (30 min):**
11. Update task list (one task per BATCH, not per agent — see §11.5)
12. Note tomorrow's first batch
13. Stop. Don't review evening agent output (you'll miss things)

### 11.2 Weekly rhythm

- **Monday**: Plan week's batches; communicate with Pops
- **Tuesday-Thursday**: Execute batches
- **Friday**: Polish, integration tests, ship-readiness check
- **Saturday**: Optional buffer
- **Sunday**: Off

### 11.3 Critical discipline

- **Don't skip security/code review for "trivial" changes** — these always come back to bite you
- **Don't dispatch agents for human-only tasks** — wastes tokens and time
- **Don't let agents run unsupervised on schema migrations** — review SQL before applying
- **Always read agent output, even when "successful"** — agents can produce code that compiles but is wrong
- **Don't dispatch faster than you can review** — unreviewed agent code is debt, not progress

### 11.4 Before-dispatch checklist (for every batch)

Before sending the batch:

- [ ] Schema migration from prior batch is **applied to dev DB** (run `supabase migration up` or check via `supabase db diff`)
- [ ] **Types regenerated** if schema changed (`npx supabase gen types typescript --local > src/shared/db/types.ts`)
- [ ] No two agents in this batch **own overlapping files** (cross-check the "Files this agent owns" lists)
- [ ] Each agent's **brief includes the relevant spec section** (use heading text, NOT line numbers — line numbers rot)
- [ ] Each agent's **brief includes its dependencies** ("AGENT 4.A.1 — staff and shop_employees tables already exist; rely on Postgres types from `src/shared/db/types.ts`")
- [ ] No agent depends on something that **hasn't been built yet**
- [ ] Reviewer has **time today** to review what comes back

If any item fails, defer or restructure the batch.

### 11.5 After-batch reconciliation

When all agents in the batch have notified completion:

- [ ] Run `git status` — verify only expected files changed
- [ ] Run CI suite (`npm run lint && npm run typecheck && supabase test db && npm run test`)
- [ ] If two agents changed the same file (despite ownership rules), inspect the diffs and resolve
- [ ] If an agent went off-brief (touched files it didn't own), revert and re-dispatch with stricter scope
- [ ] Update task list: mark batch complete, note any spillover work
- [ ] If anything from this batch is required by next batch, verify before dispatching next

### 11.6 Sequential gates (never parallelize across these)

The following CANNOT be parallelized — they MUST run sequentially within a batch sequence:

1. **schema-writer → migration-applier → type-generator → backend-builder → frontend-builder**
   This is the dependency chain. Skipping `migration-applier` means later agents work against schema files but no actual tables. Skipping `type-generator` means frontend imports break.

2. **backend-builder → test-writer (for that backend)**
   Tests need code to test.

3. **Wave 1 → Wave 1 ship gate → Wave 2 → Wave 2 ship gate → Wave 3 → Wave 3 ship gate → Wave 4 → Wave 4 ship gate → Maintenance**
   Don't start a wave until prior wave's gate criteria are met.

Every other axis (multiple modules in parallel, frontend in parallel with backend if types are stable, multiple test agents in parallel) is fair game.

---

## 12. Tooling recommendations

### 12.1 Use the existing Claude Code tools

**Default to `general-purpose` for portability.** Specialized subagent types (gsd-*, accesslint:*, vercel:*) only exist if you have those plugins installed. If a teammate or future-you opens this project on a fresh machine, only `general-purpose`, `Explore`, and `Plan` are guaranteed available.

**Recommended pattern:** dispatch `general-purpose` agent + invoke the relevant skill *inside* the brief. Example:
```
subagent_type: general-purpose
brief: "Use the `accesslint:contrast-checker` skill to audit src/modules/scanning
        for WCAG color-contrast violations. ..."
```

This way the brief is portable — if the skill exists, the agent uses it; if not, the agent does the audit manually.

**Specialized subagent types (only if available in your install):**
- `gsd-doc-writer` — project documentation
- `gsd-code-reviewer` / `superpowers:code-reviewer` — code review
- `gsd-security-auditor` — verifies threat mitigations from PLAN.md
- `gsd-ui-auditor`, `gsd-ui-checker`, `gsd-ui-researcher` — UI work
- `accesslint:reviewer` — accessibility audits
- `vercel:performance-optimizer` — Core Web Vitals, query timing
- `vercel:deployment-expert` — Vercel deploy issues
- `vercel:ai-architect` — if you add AI features later
- `Explore` — fast codebase exploration
- `Plan` — implementation planning before coding

### 12.2 Background agents

- Use `run_in_background: true` for long-running audit/research tasks
- Notification arrives when complete
- Don't poll; wait for notification

### 12.3 TaskCreate / TaskUpdate

- Track every dispatched batch as a task
- Mark complete when integrated
- Provides audit trail and progress tracking

### 12.4 Worktrees for isolation

- For large risky changes, use `isolation: 'worktree'` parameter on Agent calls
- Creates isolated git worktree; agent works there
- If agent makes no changes, worktree auto-cleaned
- Otherwise, you review changes before merging

---

## 13. Final exhaustive agent count

Across all 36 weeks (Waves 1-4):

| Wave | Module/phase | Agent count |
|---|---|---|
| Pre-flight | Week 0 | 7 agents + heavy human tasks |
| Wave 1 | Week 1 (foundation) | 14 agents |
| Wave 1 | Week 2 (auth) | 16 agents |
| Wave 1 | Week 3 (CRM + settings) | 21 agents |
| Wave 1 | Week 4 (jobs) | 15 agents |
| Wave 1 | Week 5 (packets + storage) | 15 agents |
| Wave 1 | Week 6 (workstation + scanner shell) | 15 agents |
| Wave 1 | Week 7 (camera scanner) | 13 agents |
| Wave 1 | Week 8 (timeline + dashboard) | 13 agents |
| Wave 1 | Week 9 (customer portal) | 15 agents |
| Wave 1 | Week 10 (offline mode) | 12 agents + heavy iPad testing |
| Wave 1 | Week 11 (polish) | 19 agents |
| Wave 1 | Week 12 (production) | 8 agents + heavy human onboarding |
| Wave 1 | Week 13 (ship gate) | 2 agents + observation |
| **Wave 1 total** | | **187 agent dispatches** |
| Wave 2 | Weeks 15-16 (inventory) | 15 agents |
| Wave 2 | Week 17 (quality) | 8 agents |
| Wave 2 | Weeks 18-19 (alerts + notifications) | 16 agents |
| Wave 2 | Week 20 (multi-role portal) | 8 agents |
| **Wave 2 total** | | **47 agent dispatches** |
| Wave 3 | Weeks 21-22 (quotes) | 9 agents |
| Wave 3 | Weeks 23-24 (invoices, +Stripe optional) | 9 + 4 optional |
| Wave 3 | Week 25 (analytics) | 8 agents |
| Wave 3 | Week 26 (public tracking) | 5 agents |
| Wave 3 | Week 27 (messaging) | 9 agents |
| Wave 3 | Week 28 (polish + ship) | 5 agents |
| **Wave 3 total** | | **45-49 agent dispatches** |
| Wave 4 | Weeks 29-30 (tenant config + whitelabel — branding, custom domains, theming, module toggles) | 14 agents |
| Wave 4 | Weeks 31-32 (vertical workflow templates — schema, default templates per vertical, editor UI) | 10 agents |
| Wave 4 | Weeks 33-34 (agency super-admin console — consent tokens, impersonation, audit log viewer, billing overview) | 9 agents |
| Wave 4 | Weeks 35-36 (Tenant 2 onboarding + Wave 4 polish — sandblasting tenant seed, RLS verification, ship gate) | 10 agents |
| **Wave 4 total** | | **~43 agent dispatches** |
| **Module agents subtotal (Waves 1-4)** | | **~322-326 dispatches** (187 + 47 + 45-49 + 43) |
| Cross-cutting: PR-time × ~4 PRs/week × 36 weeks × 3 reviewers (security, code, test-coverage) | | ~432 |
| Cross-cutting: weekly checks (deps, perf, deliverability) × 36 weeks × 3 | | ~108 |
| Cross-cutting: monthly drills × 9 months × 2 | | ~18 |
| **Cross-cutting subtotal** | | **~558 dispatches** |
| **GRAND TOTAL** | | **~880-885 agent dispatches** |

**Cost estimate (revised, internally consistent):**
- ~324 module agents × $3 average = **~$970**
- ~558 cross-cutting agents × $1.50 average (smaller scope) = **~$840**
- **Total: ~$1,810 in agent costs** for the entire 36-week project.

At a more pessimistic $5 per module agent: ~$1,620 + $840 = **~$2,460**.

**Range: $1,800 – $2,500** for ~880-885 agent dispatches across 36 weeks.

This supersedes the conflicting figures in §9. (Earlier draft for Waves 1-3 only said ~720 dispatches at $1,500-$2,100. The Wave 4 addition adds ~43 module agents and ~125 cross-cutting agents, pushing the total to ~880-885 dispatches at $1,800-$2,500. The actual itemized count of "AGENT N.X.Y" lines in §3-§5.5 is 322-326 module agents across Waves 1-4 — 187 Wave 1 + 47 Wave 2 + 45-49 Wave 3 + 43 Wave 4.)

---

## 14. Quick-start: how to dispatch your first batch

When you're ready to start Week 1 (after Week 0 human tasks), use this template:

```
[In one message, batch these tool calls in parallel:]

TaskCreate × 1 (one per BATCH, not per agent — see §11.5)
  subject: "Week 1 batch 1.A — shared infrastructure"
  description: "5 parallel agents building shared/db, auth-helpers, audit,
                rate-limit, storage skeleton, proxy skeleton"

Agent #1: subagent_type=general-purpose, run_in_background=true
  Brief: "You are the foundation builder. Initialize a Next.js 16 app at
          /Users/davidk/Documents/Dev-Projects/App-Ideas/Pops--Coating with
          Tailwind v4, TypeScript strict, ESLint flat-config including the
          no-restricted-imports rule (refer to design spec §2.4 'Module
          communication rules' — find it by heading text, not line number)..."
  Files this agent owns: package.json, next.config.ts, tsconfig.json, eslint.config.js,
                          tailwind.config.ts, .gitignore, .env.local.example

Agent #2: subagent_type=general-purpose, run_in_background=true
  Brief: "You are the Supabase schema agent. Create migration files in
          supabase/migrations/ for the foundational tables: tenants, shop_settings,
          tenant_domains, audit_log. Refer to design spec §3.3 'Wave 1 schema'
          → 'Core / tenant tables' subsection..."
  Files this agent owns: supabase/migrations/0001_*.sql

[... etc for 3-4 more agents in same message]
```

**Each agent is self-contained** (sees no conversation context). Brief them with:
1. **Their specific scope** ("ONLY do X, do NOT do Y")
2. **The relevant spec section** by **heading text** (NOT line numbers — line numbers rot fast)
3. **The files they own** (so other agents don't conflict)
4. **Their dependencies** ("the staff table is already created; types are at src/shared/db/types.ts")
5. **The deliverable format** (e.g., "write a single migration file")
6. **Where to report back** (file path or response format)

### 14.1 Things to remember every time you dispatch

- **One TaskCreate per BATCH** (not per agent) — keeps task list manageable for ~100+ batches across the 36-week project (Waves 1-4)
- **Default to `general-purpose`** subagent_type for portability
- **Migration-applier and type-generator are mandatory gates** — see §11.6 for the sequential dependency chain
- **Reviewer throughput is the binding constraint** — see §11.0; budget ~6-8 PRs/day to land
- **Run-in-background most agents** — frees you to work on human tasks while they run

### 14.2 Known missing agents to add when you encounter them

The audit pass identified several agents implied by the spec but not explicitly listed in the wave breakdowns above. Add as you encounter them:

- **shadcn-installer** (Week 1) — runs `npx shadcn add button dialog form input select table toast` etc., creates components in `src/shared/ui/`
- **design-token-integrator** (Week 1, after brand identity arrives) — translates designer's color/font choices into Tailwind config + CSS variables
- **`madge --circular` CI step** (Week 1) — enforces no circular module dependencies
- **`archive-aged-jobs` Edge Function** (Wave 2 — listed in spec §4.6 but not in wave breakdown) — daily cron auto-archives picked_up jobs >90 days
- **materialized-view-refresh cron** (Week 25, if analytics views are added) — REFRESH MATERIALIZED VIEW on schedule
- **GitHub Action setup for PR-time audits** (Week 1) — wires up the cross-cutting agents from §6 to fire on every PR
- **Sentry source-map upload** (Week 12 production deploy) — production errors need readable stack traces
- **SMTP deliverability verifier** (Week 1 + before Week 12) — sends test emails to Gmail/Outlook/iCloud and confirms inbox placement

### 14.3 Deferred features from original v1 PRD (post-Wave 4 / future versions)

Documented in design spec §6.4.1. Each becomes 1-2 agents when scheduled. None blocks current Wave 1-4 plan. Note: "Wave 4" was previously used as a placeholder for these deferred features, but Wave 4 now refers to the multi-tenant whitelabel layer (see §5.5). Deferred features are now scheduled "post-Wave 4 / v2.0+".

| Feature | When (estimate) | Agents needed |
|---|---|---|
| **Inventory QR labels** (PDF templates for `inventory_items.qr_value`) | Wave 2 enhancement | 1 frontend-builder + 1 test-writer |
| **Employee badge scanning** (RFID/NFC) | v1.1 if requested | 1 schema-writer (badge_value column) + 1 frontend-builder + 1 test-writer |
| **SMS notifications** via Twilio | post-Wave 4 / v1.5 | 1 backend-builder (Twilio adapter) + 1 test-writer |
| **Rack/bin/pallet label printing** | post-Wave 4 / v2.0+ | 1 schema-writer (`racks` table) + 2 frontend-builders (label PDF templates) + 1 test-writer |
| **Push notifications** (Web Push API) | Requires PWA install acceptance + iOS 16.4+ | 1 backend-builder + 1 frontend-builder + 1 test-writer |
| **Native mobile app** (iOS/Android) | Indefinite (PWA covers most needs) | Major separate project — Capacitor wrapper or full native rewrite |

---

## 15. Done

This document is the operational companion to the design spec. Use it as a working checklist; cross out batches as completed; update as the project evolves.

**Next step after reading this:** Start Week 0 human tasks while dispatching the agent batch 0.A in parallel (research-verifier and docs-writer agents — they can start immediately without paid accounts).
