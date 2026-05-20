# Production Branch And Ralph Loop Backlog

Status date: 2026-05-20.

Current green base: draft PR #6, branch `codex/demo-readiness`, head `f1730fa`.

Use this file as a cut-and-paste backlog for separate branches or separate `git worktree` checkouts. Keep each Ralph story to one iteration. Do not start Phase 2 build branches until Phase 1 Task 5 sign-off passes unless the user explicitly overrides the GSD gate.

## Branch 00: Merge Green Demo Readiness

Branch: `codex/demo-readiness`

Purpose: land the already-green production gate fixes.

Ralph stories:

- `US-0001` Ready PR #6 for review. Acceptance: PR #6 is no longer draft only after user approves; all checks remain green; branch is clean; Typecheck passes.
- `US-0002` Merge PR #6 after approval. Acceptance: merge commit or squash exists on `main`; `origin/main` contains CI fixes and runbook updates; no local uncommitted changes remain; Typecheck passes.
- `US-0003` Prune stale Supabase preview branch after merge. Acceptance: `codex/demo-readiness` preview branch is deleted only after merged; `main` linked migrations still align; pgTAP linked suite passes; Tests pass.

## Branch 01: Manual Production Infrastructure Gate

Branch: `codex/prod-infra-dns-email`

Purpose: close human-only Phase 1 blockers.

Ralph stories:

- `US-0101` Add registrar DNS for app host. Acceptance: `app.popsindustrial.com` has the exact Vercel CNAME target from dashboard; `dig +short app.popsindustrial.com` resolves; Vercel domain is valid; Typecheck passes.
- `US-0102` Add registrar DNS for portal host. Acceptance: `track.popsindustrial.com` has the exact Vercel CNAME target from dashboard; `dig +short track.popsindustrial.com` resolves; Vercel domain is valid; Typecheck passes.
- `US-0103` Verify TLS and host routing. Acceptance: `https://app.popsindustrial.com/sign-in` renders office sign-in; `https://track.popsindustrial.com/sign-in` renders portal sign-in; both certificates are valid; Typecheck passes.
- `US-0104` Add Resend DNS records. Acceptance: exact DKIM/SPF/MX records from Resend are present at registrar; Resend dashboard reports verified; no secrets are committed; Typecheck passes.
- `US-0105` Configure Supabase custom SMTP. Acceptance: Supabase Auth SMTP uses Resend SMTP credentials; from address is `noreply@popsindustrial.com`; test email passes SPF/DKIM; no secrets are committed; Typecheck passes.
- `US-0106` Confirm Supabase Auth redirect allow-list. Acceptance: allow-list includes `https://app.popsindustrial.com/**` and `https://track.popsindustrial.com/**`; magic links resolve to canonical hosts; Typecheck passes.
- `US-0107` Remove stale canonical conflicts only after healthy cutover. Acceptance: stale `app.popscoating.com` and `track.popscoating.com` are removed only after `popsindustrial.com` hosts are healthy; no canonical host regression; Typecheck passes.

## Branch 02: Tenant 1 Seed And Owner Handoff

Branch: `codex/prod-tenant1-seed`

Purpose: bootstrap Pops as Tenant 1 after DNS and SMTP are verified.

Ralph stories:

- `US-0201` Collect owner seed inputs. Acceptance: real owner email and name are available in an approved secure channel; values are not committed or pasted into docs; Typecheck passes.
- `US-0202` Dry-run seed script against non-production target. Acceptance: script idempotency path is verified; packet QR shape is `https://app.popsindustrial.com/scan?packet=<packet_token>`; Tests pass.
- `US-0203` Run live Tenant 1 seed. Acceptance: tenant, shop settings, owner staff, customer user, shop employee, workstation, and seed job exist; owner invite is delivered through Resend SMTP; no recovery/setup link is logged in docs; Typecheck passes.
- `US-0204` Verify owner account activation. Acceptance: owner can complete password setup through secure handoff; JWT contains `tenant_id` and `audience=office`; office sign-in works on app host; Typecheck passes.
- `US-0205` Verify seed idempotency after live run. Acceptance: rerun does not duplicate tenant/domain/users/jobs; existing Auth metadata is repaired if needed; Tests pass.

## Branch 03: Phase 1 Success Walkthrough

Branch: `codex/phase1-success-walkthrough`

Purpose: prove the five Phase 1 success criteria.

Ralph stories:

- `US-0301` Execute automated gate. Acceptance: `mise exec -- pnpm type-check`, `mise exec -- pnpm lint`, `mise exec -- pnpm test`, `mise exec -- pnpm build`, and `supabase test db --linked` pass; Tests pass.
- `US-0302` Verify office auth criterion. Acceptance: office staff signs in on app host; 30-day felt session works through refresh; JWT has tenant and office audience; Typecheck passes.
- `US-0303` Verify workstation auth criterion. Acceptance: workstation enrollment succeeds; workstation session uses one-hour JWT expiry; workstation creds are rejected from office domain; Typecheck passes.
- `US-0304` Verify customer portal criterion. Acceptance: magic link opens portal; customer sees only company-scoped jobs; office creds are rejected from portal; Typecheck passes.
- `US-0305` Verify no-tenant denial criterion. Acceptance: authenticated query without `tenant_id` sees zero rows on business tables; pgTAP evidence exists; Tests pass.
- `US-0306` Record sign-off result. Acceptance: `docs/runbooks/phase-1-success-walkthrough.md` is updated with no secrets; `.planning/STATE.md` marks Phase 1 complete only after criteria pass; Typecheck passes.

## Branch 04: Production Observability And Alerts

Branch: `codex/prod-observability-alerts`

Purpose: make production failures visible before onboarding.

Ralph stories:

- `US-0401` Confirm Sentry tenant tagging. Acceptance: server, edge, and client events include `tenant_id` where available; unknown tenant is tagged explicitly; Tests pass.
- `US-0402` Add Sentry alert rules. Acceptance: production alerts exist for elevated errors, auth failures, scan failures, and webhook failures; runbook lists owners and thresholds; Typecheck passes.
- `US-0403` Add health-check runbook. Acceptance: runbook covers Vercel deployment, Supabase health, Redis rate limits, Resend delivery, Sentry intake, and DNS; Typecheck passes.
- `US-0404` Add deployment smoke command. Acceptance: one documented command verifies production sign-in pages and Supabase connectivity without secrets in output; Tests pass.

## Branch 05: Backup, Restore, And Incident Runbooks

Branch: `codex/prod-backup-dr`

Purpose: make rollback and recovery operational.

Ralph stories:

- `US-0501` Verify Supabase PITR settings. Acceptance: PITR/backups are enabled on the Pro project; restore limitations are documented; Typecheck passes.
- `US-0502` Run restore drill to test project. Acceptance: restore drill completes without touching production; pgTAP passes on restored target; runbook includes elapsed time; Tests pass.
- `US-0503` Add weekly backup automation decision. Acceptance: choose Supabase-native/PITR plus optional external export path; if external backup is used, credentials remain out of repo; Typecheck passes.
- `US-0504` Write incident response checklist. Acceptance: checklist covers cross-tenant leak, SMTP failure, Vercel outage, Supabase outage, and scanner outage; Typecheck passes.

## Branch 06: Credentialed E2E Smoke

Branch: `codex/prod-e2e-credentialed-smoke`

Purpose: turn optional E2E credentials into repeatable pre-prod smoke coverage.

Ralph stories:

- `US-0601` Configure non-secret E2E docs. Acceptance: required GitHub secret names are listed; no values are committed; Typecheck passes.
- `US-0602` Add office credentialed smoke. Acceptance: Playwright signs in as staff and reaches office dashboard; missing credentials still skip clearly; Tests pass.
- `US-0603` Add workstation credentialed smoke. Acceptance: Playwright validates workstation rejection on office domain and scanner access on scan route; Tests pass.
- `US-0604` Add customer portal smoke. Acceptance: Playwright verifies portal host and customer-scoped job list using safe test customer; Tests pass.

## Branch 07: Wave 1 CRM And Settings

Branch: `codex/wave1-crm-settings`

Blocked by: Phase 1 Task 5 sign-off.

Ralph stories:

- `US-0701` Companies, contacts, activities, tags schema. Acceptance: migrations add tenant-scoped tables with RLS using `app.tenant_id()`; pgTAP cross-tenant tests pass; Tests pass.
- `US-0702` CRM server actions and queries. Acceptance: create/update/archive company, contact management, activity logging, and filters work through module public exports only; Tests pass.
- `US-0703` Tags module. Acceptance: tag CRUD and tagged entity linking support allowed entity types; RLS blocks cross-tenant reads; Tests pass.
- `US-0704` Settings staff management. Acceptance: staff list, invite, deactivate, and audit log queries are implemented with service-role only in allowed settings paths; Tests pass.
- `US-0705` CRM/settings UI routes. Acceptance: office routes render companies, contacts, tags, settings, staff invite, and audit log; Verify in browser using dev-browser skill; Typecheck passes.
- `US-0706` CRM/settings tests and docs. Acceptance: Vitest, pgTAP, Playwright smoke, module READMEs, accessibility review, and security review complete; Tests pass.

## Branch 08: Wave 1 Jobs Core

Branch: `codex/wave1-jobs-core`

Blocked by: Branch 07 schema patterns and Phase 1 Task 5 sign-off.

Ralph stories:

- `US-0801` Jobs schema and status invariants. Acceptance: jobs table, `next_job_number()`, status constraints, parent/child jobs, and `production_status` revoke exist; pgTAP passes; Tests pass.
- `US-0802` Job actions and validation. Acceptance: create, update, archive, schedule, hold/release, clone, split multi-color, and part counts are implemented without direct status updates; Tests pass.
- `US-0803` Job queries and filters. Acceptance: list/detail queries support company, due date, tag, priority, status, and archived filters; Tests pass.
- `US-0804` Job UI. Acceptance: job list, form, detail, holds, parts, children, and routes render; Verify in browser using dev-browser skill; Typecheck passes.
- `US-0805` Job tests. Acceptance: pgTAP covers job RLS and job number atomicity; Vitest covers create/split/hold; Playwright covers create to schedule; Tests pass.

## Branch 09: Wave 1 Packets And Storage

Branch: `codex/wave1-packets-storage`

Blocked by: Branch 08 jobs.

Ralph stories:

- `US-0901` Attachments schema and storage policies. Acceptance: attachments are tenant-scoped; storage paths enforce customer/staff access; pgTAP passes; Tests pass.
- `US-0902` Shared storage module. Acceptance: upload, signed URL, delete, and path helpers live in `src/shared/storage`; no forbidden service-role usage; Tests pass.
- `US-0903` Packet PDF generation. Acceptance: `@react-pdf/renderer` packet includes job info, QR, tenant branding, and cached regeneration; Tests pass.
- `US-0904` Packet UI. Acceptance: packet preview, QR image, print route, attachment list, image gallery, and logo upload render; Verify in browser using dev-browser skill; Typecheck passes.
- `US-0905` Packet performance and tests. Acceptance: PDF cold-start is measured; QR error correction tested; manual print/scan scenario documented; Tests pass.

## Branch 10: Wave 1 Workstation And Scanner Shell

Branch: `codex/wave1-workstation-scanner-shell`

Blocked by: Branch 08 jobs and Branch 09 packets.

Ralph stories:

- `US-1001` Scan history and workstation functions. Acceptance: `job_status_history`, denorm triggers, scan metadata, PIN validation, lockout, and workstation lifecycle wrappers exist with pgTAP; Tests pass.
- `US-1002` Scanning server actions and queries. Acceptance: enroll, claim, heartbeat, release, and packet-token lookup actions work; no service-role import in scanning module; Tests pass.
- `US-1003` Workstation enrollment UI. Acceptance: `/scan/enroll`, workstation QR display, employee picker, PIN pad, switch user, and heartbeat hook render on iPad-sized viewport; Verify in browser using dev-browser skill.
- `US-1004` Scanner shell tests. Acceptance: pgTAP covers PIN lockout, claim concurrency, record scan denial; Playwright covers enroll to PIN to job lookup; Tests pass.

## Branch 11: Wave 1 Camera Scan Event

Branch: `codex/wave1-camera-scan-event`

Blocked by: Branch 10 scanner shell.

Ralph stories:

- `US-1101` Camera scanner. Acceptance: `@zxing/browser` camera scanner works on iPad Safari target; manual packet entry fallback exists; Verify in browser using dev-browser skill.
- `US-1102` Scan event action. Acceptance: action uploads optional compressed photo and calls only `app.record_scan_event()` for status transitions; Tests pass.
- `US-1103` Scan result UI. Acceptance: result panel, stage transition buttons, hold dialog, wrong-workstation warning, and concurrent scan handling exist; Verify in browser using dev-browser skill.
- `US-1104` Photo compression. Acceptance: canvas to JPEG quality 0.7 with 1024px max longest edge applies to online and queued uploads; Tests pass.
- `US-1105` Scan feedback and latency. Acceptance: sound/haptic success feedback works; end-to-end scan target is measured under 200ms where feasible; Tests pass.

## Branch 12: Wave 1 Timeline And Dashboard

Branch: `codex/wave1-timeline-dashboard`

Blocked by: Branch 11 scan events.

Ralph stories:

- `US-1201` Timeline queries and views. Acceptance: job timeline, current stage, stuck jobs, recent activity, latest-event view, and customer-visible timeline view exist; pgTAP passes; Tests pass.
- `US-1202` Dashboard queries. Acceptance: dashboard snapshot supports stats, recent activity, overdue, due today, and filters; Tests pass.
- `US-1203` Realtime shared subscription. Acceptance: shared realtime helper prevents duplicate subscriptions per tab and scopes by tenant; Tests pass.
- `US-1204` Timeline/dashboard UI. Acceptance: timeline, progress bar, badges, kanban-by-stage, stat cards, activity feed, overdue/due panels, filters, and office dashboard route render; Verify in browser using dev-browser skill.
- `US-1205` Dashboard performance. Acceptance: dashboard load with 1000 jobs is measured and documented; no obvious N+1 query remains; Tests pass.

## Branch 13: Wave 1 Customer Portal

Branch: `codex/wave1-customer-portal`

Blocked by: Branch 12 timeline/dashboard and production `track.*` DNS.

Ralph stories:

- `US-1301` Portal actions. Acceptance: request magic link, sign out, invite customer, and send initial magic link are anti-enumeration and rate-limited; Tests pass.
- `US-1302` Portal queries. Acceptance: customer jobs, details, and timeline are company-scoped; pgTAP blocks cross-company access; Tests pass.
- `US-1303` Portal host routing. Acceptance: `track.*` routes to portal group; office credentials rejected; customer credentials rejected from office where applicable; Tests pass.
- `US-1304` Portal UI. Acceptance: customer layout, branded job list/cards, detail, progress tracker, timeline, callback, and magic-link states render; Verify in browser using dev-browser skill.
- `US-1305` Portal security review. Acceptance: replay protection and revoked-mid-session behavior are reviewed; security-auditor verdict is PASS or signed-off follow-up; Tests pass.

## Branch 14: Wave 1 Offline Scanner

Branch: `codex/wave1-offline-scanner`

Blocked by: Branch 11 scan event.

Ralph stories:

- `US-1401` Scanner service worker. Acceptance: service worker scope is limited to `/scan/*`; office and portal pages are unaffected; Tests pass.
- `US-1402` IndexedDB scan queue. Acceptance: queue stores scan payloads and compressed photos with 100 scan / 50MB cap; Tests pass.
- `US-1403` Replay logic. Acceptance: foreground polling replays queued scans on reconnect; stale employee and conflicts are handled; Tests pass.
- `US-1404` Offline UI. Acceptance: offline banner, queued count, conflict modal, and reconnect status render on iPad viewport; Verify in browser using dev-browser skill.
- `US-1405` Offline E2E and manual iPad plan. Acceptance: Playwright covers offline to replay and conflict path; manual iPad scenario doc exists; Tests pass.

## Branch 15: Wave 1 Polish, Audit, And Ship Gate

Branch: `codex/wave1-polish-audit-shipgate`

Blocked by: Branches 07-14.

Ralph stories:

- `US-1501` UX state sweep. Acceptance: empty states, loading skeletons, error boundaries, 404/500, toasts, and scanner dark mode exist; Verify in browser using dev-browser skill.
- `US-1502` Test gap fill. Acceptance: pgTAP reaches intended RLS coverage, Vitest server-action coverage target is met, and critical Playwright suite passes; Tests pass.
- `US-1503` Security audit gate. Acceptance: `security-auditor` first line is `VERDICT: PASS` or signed-off `FAIL-WITH-FOLLOW-UP`; verdict parser passes.
- `US-1504` Accessibility audit gate. Acceptance: WCAG 2.1 AA blocker findings are zero; verdict parser passes; Verify in browser using dev-browser skill.
- `US-1505` Performance audit gate. Acceptance: Lighthouse/Core Web Vitals and hot-path query timings have no blocker; verdict parser passes.
- `US-1506` Dependency and code review gates. Acceptance: dependency-auditor has no Critical/High; code-reviewer has no Blocker/Major; verdict parser passes.

## Branch 16: Production Deploy And Pops Onboarding

Branch: `codex/wave1-prod-deploy-onboarding`

Blocked by: Branch 15 ship gate.

Ralph stories:

- `US-1601` Production deployment verification. Acceptance: production Supabase migrations, Vercel deploy, env vars, domains, SMTP, Sentry, backups, and rate limits are verified; Tests pass.
- `US-1602` Pops training materials. Acceptance: office cheat sheet, shop staff cheat sheet, and 5-minute training script exist; Typecheck passes.
- `US-1603` Hardware readiness. Acceptance: iPad kiosk settings, workstation labels, QR enrollment sheets, printer settings, and Wi-Fi fallback are documented; Typecheck passes.
- `US-1604` Onsite pilot checklist. Acceptance: intake to packet print to scan to portal status is exercised with Pops staff; issues are triaged into follow-up branches; Typecheck passes.
- `US-1605` Wave 1 ship gate. Acceptance: wave contract is signed; all required auditors PASS or have user-signed follow-up; production rollback path is known; Tests pass.
