# Phase 1 Gate — Next Dispatch Batch

Source of truth: `PRD.md`, `docs/DESIGN.md`, `.planning/phases/01-foundation/01-06-PLAN.md`, `.planning/intel/SESSION-MEMORY.md`.

Canonical production hosts:

- `app.popsindustrial.com`
- `track.popsindustrial.com`

## Current Automated Baseline

- `pnpm type-check` passes as of 2026-05-12.
- `pnpm lint` passes as of 2026-05-12, including `madge --circular src/modules`.
- `pnpm test` passes as of 2026-05-12 after rebasing onto `origin/main`: 41 files / 300 tests.
- `pnpm build` passes as of 2026-05-12.
- Linked pgTAP passes as of 2026-05-12: `supabase test db --linked` passes 9 files / 93 tests, including public Dashboard hook wrapper coverage.
- `supabase migration list --linked` is clean as of 2026-05-12: local and remote align through `0026`.
- `src/shared/db/types.ts` was regenerated from the linked schema through `0026`.
- Playwright E2E is not verified locally because staff E2E credentials are not configured.
- No-secret Playwright host-form smoke passes as of 2026-05-12: `pnpm exec playwright test tests/e2e/phase1-auth-smoke.spec.ts --grep "office host|customer portal renders"` (2 tests).

## Human-Only Blockers

- [x] Supabase Dashboard: JWT expiry is set to `3600`.
- [x] Supabase Dashboard: Custom Access Token Hook is enabled via `public.dashboard_custom_access_token_hook`, which delegates to canonical `app.custom_access_token_hook`.
- [ ] Supabase Dashboard: configure Custom SMTP through Resend after Resend DNS verifies.
- [ ] Resend/DNS registrar: verify DKIM, SPF, and MX for `popsindustrial.com`.
- [ ] Registrar DNS: add the required records for `app.popsindustrial.com` and `track.popsindustrial.com`; the domains are attached to `pops--coating` but invalid until DNS resolves.
- [ ] Vercel Dashboard: after canonical domains are valid, remove stale `app.popscoating.com` and `track.popscoating.com` from the production domain list.
- [x] Vercel Dashboard/CLI: production env names from `docs/runbooks/phase-1-production-readiness.md` were observed on 2026-05-11 without recording values, including `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, and `RESEND_WEBHOOK_SECRET`.
- [x] GitHub Actions: required CI secret/variable names from `docs/runbooks/phase-1-production-readiness.md` were confirmed without storing values in-repo; `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` were added for E2E.
- [x] Local/CI: Docker Desktop available; linked pgTAP passes locally.

## Parallel Agent Dispatches

### P1-GATE-01 — Live Supabase Verification

Agent type: `migration-applier`

Goal: verify Phase 1 Plan 06 Tasks 3-4 against the linked Supabase project.

Tasks:

- Source local env without printing secrets.
- Confirm linked Supabase project ref.
- Run `supabase migration list --linked`; expected result is local/remote alignment through `0026`.
- Run `supabase test db --linked`.
- Verify the Dashboard hook wrapper exists as `public.dashboard_custom_access_token_hook(jsonb)`, is `STABLE`, is `SECURITY DEFINER`, and delegates to `app.custom_access_token_hook`.
- Note: local Supabase CLI `v2.90.0` does not expose `supabase inspect db config`; JWT expiry remains a Dashboard-recorded verification unless a newer CLI/API path is available.
- Return exact commands run, pass/fail, and no secret values.

### P1-GATE-02 — Tenant 1 Seed Verification

Agent type: `seed-script-writer`

Goal: verify the Pops tenant seed path is production-ready and idempotent.

Tasks:

- Read `scripts/seed-tenant.ts`, `supabase/seed.sql`, and `.planning/phases/01-foundation/01-06-PLAN.md`.
- Confirm the script creates or verifies tenant, domains, shop settings, staff, company, contact, customer user, customer auth user, shop employee, workstation, and seed job.
- Check that generated packet QR targets `https://app.popsindustrial.com/scan?packet=<packet_token>`.
- Add or adjust tests only if a gap is found.
- Return changed files and verification commands.

### P1-GATE-03 — Production Env/Runbook Audit

Agent type: `deployment-agent`

Goal: make the production readiness checklist executable without exposing secrets.

Tasks:

- Inspect `.env.local.example`, `.github/workflows/ci.yml`, `docs/runbooks/phase-1-production-readiness.md`, and `docs/runbooks/dns-email-verification.md`.
- Ensure every required env var is documented exactly once with safe descriptions in `docs/runbooks/phase-1-production-readiness.md`.
- Ensure required env names are mirrored in `.env.local.example` when local or CI execution needs the name.
- Ensure `popsindustrial.com` is canonical and stale `popscoating.com` is only mentioned as a domain to remove after canonical domains are valid.
- Do not print or store secret values.
- Return changed files and any remaining manual dashboard gaps. Current known gap: registrar DNS and Resend DNS are pending; canonical domains are attached but invalid until DNS resolves.

### P1-GATE-04 — Phase 1 Success Walkthrough Harness

Agent type: `test-writer`

Goal: create or refine the proof harness for the five Phase 1 success criteria.

Tasks:

- Read `.planning/ROADMAP.md` Phase 1 success criteria and `docs/runbooks/phase-1-production-readiness.md`.
- Verify existing unit/E2E coverage for office sign-in, workstation auth, customer magic link, and RLS tenant denial.
- Add missing smoke tests or a no-secret manual checklist where automation needs dashboard credentials.
- Keep Playwright credential-gated; do not hardcode test user secrets.
- Return changed files and verification commands.

### P1-GATE-05 — Canonical Docs Reconciliation

Agent type: `docs-writer`

Goal: reconcile stale planning notes after the current production-readiness branch changes.

Tasks:

- Read `PRD.md`, `docs/DESIGN.md`, `.planning/STATE.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, and `.planning/intel/SESSION-MEMORY.md`.
- Update only stale operational status or domain references; do not rewrite canonical product scope.
- Surface conflicts instead of silently changing PRD/DESIGN.
- Return changed files and unresolved conflicts.
