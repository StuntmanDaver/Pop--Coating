# Phase 1 Production Readiness Checklist

Source of truth: `.planning/phases/01-foundation/01-06-PLAN.md`, `.planning/intel/SESSION-MEMORY.md`, `PRD.md`, and `docs/DESIGN.md`.

Production domain default is `popsindustrial.com`:

- Staff app: `app.popsindustrial.com`
- Customer portal: `track.popsindustrial.com`

## Manual Infrastructure Gate

- Supabase Authentication JWT expiry is set to `3600` seconds.
- Supabase Custom Access Token Hook is registered to `app.custom_access_token_hook`.
- Vercel project is linked under the intended team and production deploy is known. Current project: `stuntmandavers-projects/pops--coating`.
- Vercel domains include `app.popsindustrial.com` and `track.popsindustrial.com`; stale `popscoating.com` domains are removed. Current blocker: CLI attach for both canonical aliases is blocked because they are already assigned to another Vercel project and need dashboard reassignment/removal before attachment.
- Production env vars match the inventory below. Set values only in Vercel, GitHub Actions, Supabase Dashboard, or local `.env.local`; never paste values into docs or terminal output.
- Resend DNS for `popsindustrial.com` passes DKIM, SPF, and MX verification.

## Environment Variable Inventory

This is the single source of truth for required Phase 1 env names and safe descriptions. `.env.local.example` mirrors the names only as a local template.

| Name | Required where | Safe description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel Production, local `.env.local`, GitHub Actions E2E secret | Public Supabase project URL used by browser, server, proxy, and smoke tests. |
| `SUPABASE_URL` | Optional local `.env.local` seed/admin script alias | Server-only Supabase project URL alias for `pnpm seed:tenant`; if unset, the script uses `NEXT_PUBLIC_SUPABASE_URL`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel Production, local `.env.local`, GitHub Actions E2E secret | Public Supabase anon key; RLS still gates data access. |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel Production, local `.env.local` for admin scripts only | Sensitive Supabase service-role key for allowed audited admin paths. |
| `SUPABASE_PROJECT_REF` | GitHub Actions variable, local `.env.local` for linked CLI checks | Supabase project reference ID. Non-secret, but keep repo-specific values out of docs. |
| `SUPABASE_ACCESS_TOKEN` | GitHub Actions secret, local `.env.local` for linked CLI checks | Sensitive Supabase CLI token for branch DB and linked pgTAP checks. |
| `UPSTASH_REDIS_REST_URL` | Vercel Production, local `.env.local` when rate limits run locally | Upstash Redis REST endpoint provisioned through Vercel Marketplace. |
| `UPSTASH_REDIS_REST_TOKEN` | Vercel Production, local `.env.local` when rate limits run locally | Sensitive Upstash Redis REST token. |
| `SENTRY_DSN` | Vercel Production, local `.env.local` when server telemetry is tested | Server and edge Sentry DSN. |
| `NEXT_PUBLIC_SENTRY_DSN` | Vercel Production, local `.env.local` when client telemetry is tested | Browser Sentry DSN. Public identifier, not an auth token. |
| `NEXT_PUBLIC_VERCEL_ENV` | Vercel Production/Preview framework env, local `.env.local` when client telemetry is tested | Public deployment environment label for browser Sentry events; expected values are `production`, `preview`, or `development`. |
| `SENTRY_AUTH_TOKEN` | Vercel Production build env, local `.env.local` only if source-map upload is tested | Sensitive Sentry build token for source-map upload. |
| `RESEND_API_KEY` | Vercel Production, Supabase SMTP/dashboard setup, local `.env.local` when email is tested | Sensitive Resend credential for transactional email setup. |
| `RESEND_WEBHOOK_SECRET` | Vercel Production, local `.env.local` when webhook verification is tested | Sensitive secret used to verify inbound Resend webhooks. |
| `NEXT_PUBLIC_APP_HOST` | Vercel Production, local `.env.local` | Staff and scanner host. Production value is `https://app.popsindustrial.com`. |
| `NEXT_PUBLIC_PORTAL_HOST` | Vercel Production, local `.env.local` | Customer portal host. Production value is `https://track.popsindustrial.com`. |
| `E2E_BASE_URL` | Optional local/CI smoke-test override | Playwright base URL when not using the default local host. |
| `E2E_PORTAL_BASE_URL` | Optional local/CI smoke-test override | Playwright portal URL when not using `http://track.localhost:3000`. |
| `E2E_STAFF_EMAIL` | Optional GitHub Actions secret and local `.env.local` | Staff test account email for Playwright smoke tests. |
| `E2E_STAFF_PASSWORD` | Optional GitHub Actions secret and local `.env.local` | Sensitive staff test account password for Playwright smoke tests. |
| `E2E_WORKSTATION_EMAIL` | Optional GitHub Actions secret and local `.env.local` | Synthetic workstation account email for Playwright workstation smoke tests. |
| `E2E_WORKSTATION_PASSWORD` | Optional GitHub Actions secret and local `.env.local` | Sensitive synthetic workstation password for Playwright workstation smoke tests. |
| `E2E_CUSTOMER_EMAIL` | Optional GitHub Actions secret and local `.env.local` | Provisioned customer email for portal smoke tests; omitted runs use a non-deliverable anti-enumeration address. |
| `E2E_RUN_MAGIC_LINK_POST` | Optional local/CI smoke-test override | Set to `true` only when rate-limit and email env are configured for live portal magic-link POST smoke. |

Rows marked sensitive, plus test passwords, must stay in encrypted secret stores only.

## Automated Gate

- `pnpm type-check`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e` when the staff E2E credentials and public Supabase env vars in the inventory are available. Workstation smoke coverage also runs when workstation E2E credentials are available.
- `supabase test db` against the PR branch database.

### Latest Local Baseline

2026-05-08:

- Passed: `pnpm type-check`
- Passed: `pnpm lint`
- Passed: `pnpm test` (34 files / 242 tests)
- Passed: `pnpm build`
- Passed: `pnpm exec playwright test tests/e2e/phase1-auth-smoke.spec.ts --grep "office host|customer portal renders"` (2 no-secret host-form tests)
- Applied live Supabase migration `0018_security_and_hot_path_hardening.sql`.
- Applied live Supabase migration `0019_pgtap_test_schema_usage.sql`.
- Applied live Supabase migration `0020_security_definer_fail_closed.sql`.
- Regenerated `src/shared/db/types.ts` from the linked Supabase schema.
- Pushed `main` to `origin` through commit `a34bb04`.
- Confirmed GitHub Actions secret/variable names without printing values. Added `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; existing names include `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, and `RESEND_API_KEY`.
- Confirmed Vercel project `stuntmandavers-projects/pops--coating`; latest production deployment is ready, but the project still reports a stale production URL under `app.popscoating.com`.
- Confirmed Vercel production env names for Supabase, `RESEND_API_KEY`, Upstash Redis/QStash, and canonical app/portal hosts. `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, and `RESEND_WEBHOOK_SECRET` were not visible in the CLI inventory and remain dashboard/env gaps.
- Attempted to attach `app.popsindustrial.com` and `track.popsindustrial.com`; both are blocked by alias conflicts because they are already assigned to another Vercel project. Do not force-move without confirming the current owning project in the dashboard.
- Not run: Playwright E2E, because staff E2E credentials were not configured locally.
- Passed: `supabase test db --linked` (9 files / 87 tests).
- Verified: `supabase migration list --linked` shows local and remote migrations through `0020`.
- Not available in local CLI `v2.90.0`: `supabase inspect db config`; JWT expiry remains a Supabase Dashboard verification.

## Seed And Smoke

- Run `pnpm seed:tenant --tenant-name "Pops Industrial Coatings" --slug pops-coating --owner-email <owner-email> --owner-name <owner-name>` against the production Supabase project.
- The script generates but does not print the recovery action link. Complete owner password setup through an approved secure handoff path, and never paste setup links into docs, tickets, or chat.
- Confirm the script reports tenant, domain, company, contact, customer user, customer auth user, shop employee, workstation, and seed job identifiers.
- Confirm the packet QR target shape is `https://app.popsindustrial.com/scan?packet=<packet_token>`.
- The script is idempotency-hardened: existing canonical domains must belong to the same tenant, existing Auth users get required metadata repaired, and existing seed job packet tokens are validated before the QR target is printed.

## Manual Dashboard Gaps

- Supabase Dashboard: JWT expiry must be `3600` seconds.
- Supabase Dashboard: Custom Access Token Hook must point to `app.custom_access_token_hook`.
- Supabase Dashboard: Custom SMTP must use the verified Resend sender for `popsindustrial.com`.
- Vercel Dashboard/CLI: production project env vars from the inventory must be present with production scope; sensitive values must not be placed in Preview or Development unless a separate non-production credential exists. Framework/system names such as `NEXT_PUBLIC_VERCEL_ENV` may be satisfied by Vercel automatic framework env exposure; confirm that behavior before relying on client Sentry environment labels. Remaining observed gaps: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, and `RESEND_WEBHOOK_SECRET`.
- Vercel Dashboard/CLI: `app.popsindustrial.com` and `track.popsindustrial.com` must be attached and certificate issuance must be complete. Current blocker: both aliases are already assigned elsewhere and require dashboard reassignment/removal before attachment to `pops--coating`.
- Resend/DNS registrar: DKIM, SPF, and MX must verify for `popsindustrial.com`.
- GitHub Actions settings: required CI secret/variable names from the inventory were confirmed on 2026-05-08 without values stored in-repo. Staff/workstation E2E credential secrets remain optional and credential-gated.

## Sign-Off

Use `docs/runbooks/phase-1-success-walkthrough.md` for the no-secret success walkthrough. Phase 1 Task 5 can run only after the two Supabase Dashboard steps, branch push/sync, and the automated gate pass. Phase 2 planning stays blocked until Task 5 criteria pass.
