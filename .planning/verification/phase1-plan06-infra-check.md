# Phase 1 Plan 06 Infrastructure Verification

**Date:** 2026-05-06  
**Stream:** infra-verifier  
**Worktree:** `/Users/davidk/Documents/Dev-Projects/App-Ideas/Pops--Coating-loki-infra`  
**Branch:** `codex/loki-infra-verifier`  
**Scope:** Safe repo/CLI checks only. No secret values read or recorded.

## RARV Summary

**Reason:** Phase 1 Plan 06 is marked complete in planning state, but continuity notes still list manual infrastructure tasks before Phase 1 Task 5 sign-off.

**Act:** Read the Plan 06 context and relevant local config; checked env templates, Supabase config, Sentry init, rate-limit adapter, proxy host config, migrations, generated DB types, CI workflow, GitHub secret names, Vercel CLI project visibility, and public DNS for production domains.

**Reflect:** Local repo readiness is strong: the local gates pass, config files include the intended env names, JWT expiry is set to 3600 in local Supabase config, the custom access token hook is configured locally, migrations 0001-0017 are present, and generated DB types contain live business tables/functions. Live/dashboard readiness is only partially checkable from this worktree and remains manually gated.

**Verify:** `pnpm type-check`, `pnpm lint`, and `pnpm test` all passed after `pnpm install --frozen-lockfile`.

## Status By Item

| Item | Status | Evidence | Remaining Manual Work |
|---|---|---|---|
| Supabase JWT expiry | **Local config ready; live value unverified** | `supabase/config.toml` has `jwt_expiry = 3600`. Plan memory says live Dashboard must be checked. | Confirm Supabase Dashboard Authentication Settings shows JWT expiry `3600`, or verify with an authenticated CLI command that does not expose secrets. |
| Supabase Auth Hook | **Local config ready; live registration unverified** | `supabase/config.toml` has `[auth.hook.custom_access_token] enabled = true` and `uri = "pg-functions://postgres/app/custom_access_token_hook"`. Migration `0007_auth_hook.sql` exists. | Confirm Supabase Dashboard Authentication Hooks registers `app.custom_access_token_hook` for Custom Access Token. |
| Upstash env | **Repo wired; deployed env unverified** | `.env.local.example` lists `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`; `src/shared/rate-limit/adapter.ts` reads both. | Provision/confirm Vercel Marketplace Upstash integration and production env vars. |
| Sentry DSN env | **Repo wired; deployed env unverified** | `.env.local.example` lists `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`; server/edge/client Sentry configs read those values. | Confirm Sentry project exists and Vercel/local env vars are set. Also verify automatic `release` tagging if required by DESIGN.md Sentry tags; current configs set environment and tenant tagging is per-request. |
| Vercel domains | **Not verified; public DNS absent** | `dig` returned no A/CNAME records for `app.popsindustrial.com` or `track.popsindustrial.com`. `vercel project ls` under `stuntmandavers-projects` returned no projects. | Link/select the correct Vercel team/project; add `app.popsindustrial.com` and `track.popsindustrial.com`; configure DNS per Vercel instructions. |
| Resend DNS | **Partially present, not Resend-ready from public DNS** | `popsindustrial.com` has existing SPF and DMARC records, plus Microsoft MX. No TXT found at `resend._domainkey.popsindustrial.com`; no Resend-specific MX was found. | Complete/verify Resend domain DNS records from the Resend Dashboard. Avoid overwriting existing Microsoft mail records unless intentionally changing inbound mail. |
| Migrations | **Repo ready; live applied status unverified** | `supabase/migrations` contains ordered migrations `0001` through `0017`. | Confirm live Supabase project has all migrations applied before sign-off. |
| Types status | **Generated-looking local types present** | `src/shared/db/types.ts` contains `tenants`, `staff`, `workstations`, `jobs`, `record_scan_event`, and `validate_employee_pin` surfaces. | Re-run `supabase gen types typescript` against the intended live project after final migration push if live schema changed. |
| CI/GitHub secrets | **CI present; secrets partially confirmed by names** | `.github/workflows/ci.yml` runs `pnpm type-check`, `pnpm lint`, `pnpm test`, and PR-only `supabase test db`. `gh secret list` showed `RESEND_API_KEY`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_ANON_KEY`, `SUPABASE_PROJECT_REF`, and `SUPABASE_SERVICE_ROLE_KEY`. | Confirm `SUPABASE_PROJECT_REF` is available in the place CI expects. The workflow references `vars.SUPABASE_PROJECT_REF`, while `gh secret list` showed it as a secret name. |

## Commands Run

```bash
pnpm --version
pnpm install --frozen-lockfile
pnpm type-check
pnpm lint
pnpm test
supabase --version
gh secret list --repo StuntmanDaver/Pop--Coating 2>/dev/null | awk '{print $1}'
vercel project ls
dig +short app.popsindustrial.com A
dig +short app.popsindustrial.com CNAME
dig +short track.popsindustrial.com A
dig +short track.popsindustrial.com CNAME
dig +short popsindustrial.com TXT
dig +short _dmarc.popsindustrial.com TXT
dig +short popsindustrial.com MX
dig +short send.popsindustrial.com MX
dig +short resend._domainkey.popsindustrial.com TXT
rg -n "jwt_expiry = 3600|custom_access_token|smtp.resend.com|app\\.popsindustrial\\.com|track\\.popsindustrial\\.com" supabase/config.toml .env.local.example src/proxy.ts .planning/intel/SESSION-MEMORY.md .cursor/rules/plan06-phase1-continuity.mdc
rg -n "UPSTASH_REDIS_REST_URL|UPSTASH_REDIS_REST_TOKEN|SENTRY_DSN|NEXT_PUBLIC_SENTRY_DSN|RESEND_API_KEY|SUPABASE_ACCESS_TOKEN|SUPABASE_PROJECT_REF|NEXT_PUBLIC_APP_HOST|NEXT_PUBLIC_PORTAL_HOST" .env.local.example .github/workflows/ci.yml package.json src/shared/rate-limit src/proxy.ts sentry.*.config.ts supabase/config.toml
```

## Verification Results

| Command | Result |
|---|---|
| `pnpm --version` | `10.28.0` |
| `pnpm install --frozen-lockfile` | Passed; lockfile was up to date. |
| `pnpm type-check` | Passed. |
| `pnpm lint` | Passed; madge found no circular dependencies. |
| `pnpm test` | Passed: 28 files, 213 tests. |
| `supabase --version` | `2.90.0`; CLI noted a newer version is available. |
| `vercel project ls` | No projects found under `stuntmandavers-projects`. |
| Public DNS for `app.popsindustrial.com` / `track.popsindustrial.com` | No A or CNAME records returned. |
| Public DNS for Resend-like records | Existing SPF/DMARC/Microsoft MX found; no `resend._domainkey` TXT found. |

## Manual Checklist Before Phase 1 Task 5

- Confirm live Supabase JWT expiry is `3600`.
- Confirm live Supabase Custom Access Token Hook points to `app.custom_access_token_hook`.
- Confirm all migrations are applied to the intended live Supabase project.
- Confirm `src/shared/db/types.ts` was generated from that same live schema after final migration push.
- Confirm Vercel project/team linkage, production env vars, and `app.popsindustrial.com` / `track.popsindustrial.com` domains.
- Confirm Upstash Redis REST URL/token exist in Vercel production env.
- Confirm Sentry DSNs exist in Vercel production env and local env where needed.
- Confirm Resend domain DNS is verified in Resend Dashboard.
- Confirm CI has `SUPABASE_PROJECT_REF` configured as a GitHub Actions variable or adjust workflow/docs to match secret usage.
