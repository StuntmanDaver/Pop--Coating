# Session memory — operations & continuity

Cross-session facts that belong in-repo (not ephemeral MCP memory). **Never store secret values here.**

Namespace convention (optional): align with CLAUDE.md → `wave1/week-<n>/<topic>`.

**Cursor picks this up automatically** via [`.cursor/rules/plan06-phase1-continuity.mdc`](../../.cursor/rules/plan06-phase1-continuity.mdc) (`alwaysApply: true`).

---

## Phase 1 Plan 06 checklist (canonical — matches Claude Code terminal 48 summary)

### Automated / verified

| Item | Notes |
|------|--------|
| Build error | Route conflict — `(office)` + `(portal)` root pages merged into `src/app/page.tsx` with host detection; both sign-in flows unified into `src/app/sign-in/page.tsx`. |
| `next.config.ts` | `typedRoutes` out of `experimental`; `disableLogger` removed. |
| TypeScript types | Regenerated against the linked schema through migration `0026` on 2026-05-12. |
| GitHub Actions config | Required CI secret/variable names were confirmed on 2026-05-08 without storing values in-repo. Added `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for E2E. |
| DB migrations | Live Supabase and local migrations align through `0026` as of 2026-05-12; re-verify before sign-off. |
| Vercel env names | Production env names from the Phase 1 inventory were observed on 2026-05-11 without recording values, including `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, and `RESEND_WEBHOOK_SECRET`. |
| Supabase Auth | JWT expiry is `3600`; the production Custom Access Token Hook is enabled via `public.dashboard_custom_access_token_hook`, a no-write wrapper delegating to canonical `app.custom_access_token_hook`. |
| Vercel domains | `app.popsindustrial.com` and `track.popsindustrial.com` are attached to `stuntmandavers-projects/pops--coating`; both remain invalid until registrar DNS records are added. |

### Still requires manual action

| Item | Where |
|------|--------|
| Vercel DNS | Registrar DNS for `app.popsindustrial.com` and `track.popsindustrial.com`; refresh Vercel after propagation until both are valid. |
| Resend DNS | DKIM / SPF / MX for `popsindustrial.com`; copy the exact records from Resend. |
| Custom SMTP | Supabase Dashboard → Auth SMTP settings; use Resend SMTP with `noreply@popsindustrial.com` only after Resend DNS verifies. |
| Tenant seed | Run `pnpm seed:tenant` only after DNS/SMTP prerequisites and real owner email/name are ready. |

After branch push/sync and all human-only blockers in this table are complete or re-verified, Phase 1 **Task 5** (success criteria walkthrough) can run for Phase 1 sign-off.

## 2026-05-20

### New-location git/GitHub and production-gate pass

- Verified local Git and GitHub connectivity from `/Users/davidk/Documents/Borg Interface/PhaseOne/Pops--Coating`: `origin` points to `https://github.com/StuntmanDaver/Pop--Coating.git`, GitHub CLI auth works for `StuntmanDaver`, and branch `codex/demo-readiness` tracks `origin/codex/demo-readiness`.
- Opened draft PR #6: `https://github.com/StuntmanDaver/Pop--Coating/pull/6`.
- Applied linked Supabase migration `0027_drop_legacy_auth_user_created_trigger.sql`; linked migrations align through `0027`.
- Installed Node `20.20.2` via `mise` and added `.mise.toml`; use `mise exec -- pnpm ...` in this repo when the host Node is outside the package `engines` range.
- Fixed Vercel/GitHub blockers on the PR: removed tracked stale duplicate `* 2.*` files, aligned pnpm setup with `packageManager: pnpm@10.33.4`, fixed website lint issues, merged `origin/main`, and made the CI pgTAP branch-DB job create a missing Supabase preview branch instead of waiting on a missing `Supabase Preview` check.
- Created Supabase preview branch `codex/demo-readiness`, pushed migrations into it, and verified `supabase test db --db-url ...` passes 9 files / 94 tests.
- GitHub PR checks are green as of commit `4c0c9d5`: type-check/lint/Vitest, pgTAP RLS Suite (Branch DB), Playwright E2E Smoke, WCAG A + AA axe sweep, Vercel Preview Comments, and Vercel previews for `pops--coating`, `pops-website`, and `unit-portal`.
- Public DNS still blocks production sign-off: `app.popsindustrial.com` and `track.popsindustrial.com` return no records; visible TXT/MX for `popsindustrial.com` are not Resend-ready from this shell.
- Do not run the live Tenant 1 seed or Phase 1 Task 5 walkthrough until registrar DNS, Resend DNS, Supabase Custom SMTP, and real owner email/name are ready.

---

## 2026-05-03

### Cursor session

- Confirmed production Vercel URL is **not** derivable from the repo alone (`.gitignore` drops `.vercel/`).
- `vercel project ls` / `vercel ls` under CLI scope **stuntmandavers-projects** returned no projects/deployments — deployment may live under another Vercel team or account linked in the dashboard/Git integration.

### Claude Code session (terminal 48 recap)

- **Build:** Resolved App Router conflict between `(office)` and `(portal)` by consolidating root + sign-in flows; host-based redirect for office vs portal; `pnpm build` reported passing after changes.
- **Config:** `typedRoutes` moved out of `experimental` in `next.config.ts` for Next 16 compatibility.
- **Infra checks:** Supabase project active; migrations count matched expectations in session; Vercel production env vars partially populated in the original recap. The 2026-05-11 re-check later observed the previously missing Sentry DSNs and `RESEND_WEBHOOK_SECRET` names.
- **GitHub:** GitHub Actions secret/variable names were confirmed on 2026-05-08 without pasting values into docs. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` were added for E2E.
- **Still manual (Plan 06):** Supabase Dashboard — JWT expiry **3600s**; register **Custom Access Token Hook** → `app.custom_access_token_hook`; configure Custom SMTP through Resend. Vercel — move/remove existing **app.*/track.*** aliases for `popsindustrial.com` and attach them to `pops--coating`. Resend — complete DNS (DKIM/SPF/MX) for sending domain.

### Phase gating (ralph / Phase 02)

- Phase 02 planning (`/gsd-plan-phase`) should not start until Phase 1 Plan 06 is fully verified (Tasks 2–5) per `.planning/phases/01-foundation/01-06-PLAN.md`.

---

## 2026-05-08

### 2026-05-10 Pops marketing deployment continuity

- `origin/main` contained the latest Pops marketing commits, but `https://popsindustrial.com` was still serving the legacy WordPress/LiteSpeed site (`server: LiteSpeed`, `wp-json` headers) rather than a Vercel deployment. Do not diagnose "GitHub did not push" from that domain until DNS/Vercel domain cutover is confirmed.
- For Pops marketing website work, verify the actual production host before claiming changes are live: check response headers for Vercel (`server: Vercel` / `x-vercel-*`) and confirm the Vercel production deployment is assigned to `popsindustrial.com`.
- Vercel's pnpm 10 install warned that native build scripts were ignored for `@parcel/watcher`, `@sentry/cli`, `@swc/core`, and `esbuild`. The repo now pins `packageManager: pnpm@10.33.4` and allows those build scripts through `pnpm-workspace.yaml` `onlyBuiltDependencies` so future Vercel builds use deterministic pnpm behavior.

---

### Repo sync note

- Worktree was clean on `main` before the requested memory/changelog update; no implementation files were pending.
- This sync records the Phase 1 gate implementation context before pushing to GitHub: migrations are aligned through `0020`, local automated gates passed after type regeneration, and remaining blockers are manual infrastructure actions rather than code changes.
- Push target remains `origin` → `https://github.com/StuntmanDaver/Pop--Coating.git`; keep using explicit branch pushes from `main` unless a future phase branch is created.

### QR packet automation decision

- Preserve the simple shop-floor workflow as the product spine: front desk creates job → system generates job number, opaque packet token, QR, and printable packet → paper packet travels with parts → worker scans at workstation and records stage → customer portal updates automatically.
- Packet QR codes must open the authenticated scanner flow with an opaque token, not a raw job-number URL. Wave 1 target: `https://app.popsindustrial.com/scan?packet=<packet_token>`.
- Customer-facing status belongs on `track.popsindustrial.com` via magic-link portal. The packet QR is for shop staff scanning, not public customer tracking.
- Implementation reminder: status changes still go only through `app.record_scan_event()`; direct `jobs.production_status` updates remain forbidden.

### Phase 1 gate implementation pass

- Normalized active planning/docs domain references from stale `popscoating.com` to canonical `popsindustrial.com`. Remaining `popscoating.com` mentions are warnings about stale domains or non-domain identifiers such as the `pops-coating` tenant slug/project id.
- Automated app gates passed locally: `pnpm type-check`, `pnpm lint`, `pnpm test` (34 files / 242 tests), and `pnpm build`.
- Applied `0018_security_and_hot_path_hardening.sql` to the linked Pops Supabase project with `supabase db push --linked --include-all --yes`; `supabase migration list --linked --debug` showed local and remote `0001` through `0018` aligned.
- Applied `0019_pgtap_test_schema_usage.sql` and verified local and remote migrations through `0019`.
- Applied `0020_security_definer_fail_closed.sql` and verified local and remote migrations through `0020`.
- Regenerated `src/shared/db/types.ts` from the linked schema with `supabase gen types typescript --linked > src/shared/db/types.ts`; `pnpm type-check`, `pnpm lint`, and `pnpm test` still pass afterward.
- `supabase test db --linked` now passes: 9 files / 87 tests. The SQL test files set `SET ROLE postgres` for fixture setup, then switch to `authenticated` where RLS behavior is being asserted.
- GitHub Actions secret/variable names were confirmed without printing values; `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` were added for E2E.
- Vercel project `stuntmandavers-projects/pops--coating` is linked and has ready production deployments, but canonical `app.popsindustrial.com` and `track.popsindustrial.com` cannot be attached until existing aliases are moved/removed from their current Vercel project. The production URL still shows stale `app.popscoating.com`.
- Vercel CLI env inventory showed Supabase, Resend API, and Upstash Redis/QStash names; `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, and `RESEND_WEBHOOK_SECRET` were not visible and remain gaps.
- `.env.local` contains most local service variables but does not include `SUPABASE_PROJECT_REF`, `RESEND_WEBHOOK_SECRET`, `E2E_STAFF_EMAIL`, or `E2E_STAFF_PASSWORD`; do not paste values into docs.
- `scripts/seed-tenant.ts` now generates but does not print the recovery action link; owner setup needs an approved secure handoff path. The script also verifies/repairs seed Auth metadata for owner, customer, and workstation smoke users; domain ownership fails closed; packet QR remains `https://app.popsindustrial.com/scan?packet=<packet_token>`. The live Tenant 1 seed run still needs the owner's real email/name.

## 2026-05-11

### Phase 1 gate re-check

- `pnpm type-check` passed.
- `pnpm lint` passed.
- `pnpm test` passed: 34 files / 242 tests.
- `pnpm build` passed.
- No-secret Playwright smoke passed: `pnpm exec playwright test tests/e2e/phase1-auth-smoke.spec.ts --grep "office host|customer portal renders"` (2 tests).
- `supabase test db --linked` passed: 9 files / 89 tests.
- Fetched missing remote migration `0021_scan_event_idempotency.sql` into the local migrations directory, removed the identical duplicate local `supabase/migrations/0022_auth_hook_security_definer 2.sql`, and verified `supabase migration list --linked` aligns local/remote through `0022`.
- Vercel Production env names from the Phase 1 inventory are present as of 2026-05-11, including the previously missing Sentry DSNs and Resend webhook secret. Values were not recorded.
- Vercel canonical domain work remains blocked/incomplete: `popsindustrial.com` exists under the team, but `app.popsindustrial.com` and `track.popsindustrial.com` are not accessible/attached for the current project, `vercel alias ls` returns no aliases, and `pops--coating` still reports latest production URL `app.popscoating.com`.

## 2026-05-12

### DNS-deferred production readiness pass

- DNS/registrar work is intentionally deferred until client registrar access is available. Do not run the live tenant seed or Phase 1 Task 5 sign-off before DNS and SMTP are verified.
- Supabase JWT expiry was confirmed in Dashboard as `3600`.
- Supabase production Custom Access Token Hook is enabled through `public.dashboard_custom_access_token_hook`. This wrapper is an operational Supabase Dashboard workaround: it is `STABLE`, `SECURITY DEFINER`, delegates to canonical `app.custom_access_token_hook(event)`, and must not write to tables.
- Added `supabase/migrations/0026_dashboard_auth_hook_wrapper.sql` so the Dashboard-created wrapper is represented in migrations and grants only `supabase_auth_admin` execution.
- Regenerated `src/shared/db/types.ts` from the linked schema after applying migrations through `0026`.
- Expanded `supabase/tests/rls/test_auth_hook_invariants.sql` to cover the public Dashboard wrapper's volatility, security mode, execute grant, and delegation-only/no-write body.
- Re-ran the gate after the DNS-deferred updates and after rebasing onto `origin/main`: `pnpm type-check`, `pnpm lint`, `pnpm test` (41 files / 300 tests), `pnpm build`, `supabase migration list --linked` (through `0026`), `supabase test db --linked` (9 files / 93 tests), and no-secret Playwright host-form smoke (2 tests) all pass.
- Vercel canonical domains are attached to `stuntmandavers-projects/pops--coating` but invalid until registrar DNS records are added. The stale `app.popscoating.com` and `track.popscoating.com` domains are removal-only after canonical domains are healthy.
- Tomorrow-ready DNS checklist lives in `docs/runbooks/dns-email-verification.md`.
