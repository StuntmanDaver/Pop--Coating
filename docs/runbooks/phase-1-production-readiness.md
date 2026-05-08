# Phase 1 Production Readiness Checklist

Source of truth: `.planning/phases/01-foundation/01-06-PLAN.md`, `.planning/intel/SESSION-MEMORY.md`, `PRD.md`, and `docs/DESIGN.md`.

Production domain default is `popsindustrial.com`:

- Staff app: `app.popsindustrial.com`
- Customer portal: `track.popsindustrial.com`

## Manual Infrastructure Gate

- Supabase Authentication JWT expiry is set to `3600` seconds.
- Supabase Custom Access Token Hook is registered to `app.custom_access_token_hook`.
- Vercel project is linked under the intended team and production deploy is known.
- Vercel domains include `app.popsindustrial.com` and `track.popsindustrial.com`; stale `popscoating.com` domains are removed.
- Vercel env vars include `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `RESEND_API_KEY`, and `RESEND_WEBHOOK_SECRET`.
- Resend DNS for `popsindustrial.com` passes DKIM, SPF, and MX verification.

## Automated Gate

- `pnpm type-check`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm exec playwright test` when `E2E_STAFF_EMAIL` and `E2E_STAFF_PASSWORD` are available.
- `supabase test db` against the PR branch database.

### Latest Local Baseline

2026-05-08:

- Passed: `pnpm type-check`
- Passed: `pnpm lint`
- Passed: `pnpm test` (32 files / 230 tests)
- Passed: `pnpm build`
- Not run: Playwright E2E, because `E2E_STAFF_EMAIL` and `E2E_STAFF_PASSWORD` were not configured locally.
- Blocked: pgTAP. Local `supabase test db` could not connect to `127.0.0.1:54332`; linked `supabase test db --linked` reached the remote flow after sourcing `.env.local` but Docker Desktop was not running.

## Seed And Smoke

- Run `pnpm seed:tenant --tenant-name "Pops Industrial Coatings" --slug pops-coating --owner-email <owner-email> --owner-name <owner-name>` against the production Supabase project.
- Confirm the script reports tenant, domain, company, contact, customer user, shop employee, workstation, and seed job identifiers.
- Confirm the packet QR target shape is `https://app.popsindustrial.com/scan?packet=<packet_token>`.

## Sign-Off

Phase 1 Task 5 can run only after the two Supabase Dashboard steps, branch push/sync, and the automated gate pass. Phase 2 planning stays blocked until Task 5 criteria pass.
