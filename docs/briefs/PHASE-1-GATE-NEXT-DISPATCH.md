# Phase 1 Gate — Next Dispatch Batch

Source of truth: `PRD.md`, `docs/DESIGN.md`, `.planning/phases/01-foundation/01-06-PLAN.md`, `.planning/intel/SESSION-MEMORY.md`.

Canonical production hosts:

- `app.popsindustrial.com`
- `track.popsindustrial.com`

## Current Automated Baseline

- `pnpm type-check` passes.
- `pnpm lint` passes, including `madge --circular src/modules`.
- `pnpm test` passes: 33 files / 234 tests.
- `pnpm build` passes.
- pgTAP is not verified in the current local session because local Supabase is not running and linked pgTAP requires Docker Desktop.
- Playwright E2E is not verified locally because staff E2E credentials are not configured.

## Human-Only Blockers

- [ ] Supabase Dashboard: set JWT expiry to `3600`.
- [ ] Supabase Dashboard: register Custom Access Token Hook to `app.custom_access_token_hook`.
- [ ] Supabase Dashboard: configure Custom SMTP through Resend.
- [ ] Resend/DNS registrar: verify DKIM, SPF, and MX for `popsindustrial.com`.
- [ ] Vercel Dashboard: confirm production project/team and attach `app.popsindustrial.com` and `track.popsindustrial.com`.
- [ ] Vercel Dashboard: confirm production env vars match `docs/runbooks/phase-1-production-readiness.md` without storing values in-repo.
- [ ] GitHub Actions: confirm required CI secret/variable names from `docs/runbooks/phase-1-production-readiness.md` without storing values in-repo.
- [ ] Local/CI: start Docker Desktop before running linked pgTAP locally.

## Parallel Agent Dispatches

### P1-GATE-01 — Live Supabase Verification

Agent type: `migration-applier`

Goal: verify Phase 1 Plan 06 Tasks 3-4 against the linked Supabase project.

Tasks:

- Source local env without printing secrets.
- Confirm linked Supabase project ref.
- Run `supabase migration list --linked` and verify migrations through `0018_security_and_hot_path_hardening.sql` are applied.
- Run `supabase test db --linked` after Docker is available.
- Verify JWT expiry reports `3600` if the CLI can inspect it.
- Return exact commands run, pass/fail, and no secret values.

### P1-GATE-02 — Tenant 1 Seed Verification

Agent type: `seed-script-writer`

Goal: verify the Pops tenant seed path is production-ready and idempotent.

Tasks:

- Read `scripts/seed-tenant.ts`, `supabase/seed.sql`, and `.planning/phases/01-foundation/01-06-PLAN.md`.
- Confirm the script creates or verifies tenant, domains, shop settings, staff, company, contact, customer user, shop employee, workstation, and seed job.
- Check that generated packet QR targets `https://app.popsindustrial.com/scan?packet=<packet_token>`.
- Add or adjust tests only if a gap is found.
- Return changed files and verification commands.

### P1-GATE-03 — Production Env/Runbook Audit

Agent type: `deployment-agent`

Goal: make the production readiness checklist executable without exposing secrets.

Tasks:

- Inspect `.env.local.example`, `.github/workflows/ci.yml`, `docs/runbooks/phase-1-production-readiness.md`, and `docs/runbooks/dns-email-verification.md`.
- Ensure every required env var is documented exactly once with safe descriptions in `docs/runbooks/phase-1-production-readiness.md`.
- Ensure `popsindustrial.com` is canonical and stale `popscoating.com` is only mentioned as a domain to remove.
- Do not print or store secret values.
- Return changed files and any manual dashboard gaps.

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
