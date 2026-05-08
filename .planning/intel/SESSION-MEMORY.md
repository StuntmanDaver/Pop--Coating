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
| TypeScript types | Aligned with live schema once migrations applied (confirm on current `main`). |
| GitHub Actions config | Required CI secret/variable names were confirmed on 2026-05-08 without storing values in-repo. Added `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for E2E. |
| DB migrations | Live Supabase now has local migrations through `0020_security_definer_fail_closed.sql`; re-verify before sign-off. |

### Still requires manual action

| Item | Where |
|------|--------|
| JWT expiry → 3600s | Supabase Dashboard → Authentication → Settings → JWT Expiry |
| Auth Hook registration | Supabase Dashboard → Authentication → Hooks → Custom Access Token → `app.custom_access_token_hook` |
| Custom SMTP | Supabase Dashboard → Auth SMTP settings; use Resend SMTP with `noreply@popsindustrial.com` |
| Sentry DSN | Sentry project; `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` were not visible in Vercel CLI env inventory. |
| Resend webhook secret | `RESEND_WEBHOOK_SECRET` was not visible in Vercel CLI env inventory. |
| Vercel domains | `app.popsindustrial.com` + `track.popsindustrial.com`; CLI attach is blocked because both aliases are already assigned to another Vercel project. Move/remove them in the dashboard before attaching to `pops--coating`. |
| Resend DNS | DKIM / SPF / MX for `popsindustrial.com` (registrar). |

After branch push/sync and all human-only blockers in this table are complete or re-verified, Phase 1 **Task 5** (success criteria walkthrough) can run for Phase 1 sign-off.

---

## 2026-05-03

### Cursor session

- Confirmed production Vercel URL is **not** derivable from the repo alone (`.gitignore` drops `.vercel/`).
- `vercel project ls` / `vercel ls` under CLI scope **stuntmandavers-projects** returned no projects/deployments — deployment may live under another Vercel team or account linked in the dashboard/Git integration.

### Claude Code session (terminal 48 recap)

- **Build:** Resolved App Router conflict between `(office)` and `(portal)` by consolidating root + sign-in flows; host-based redirect for office vs portal; `pnpm build` reported passing after changes.
- **Config:** `typedRoutes` moved out of `experimental` in `next.config.ts` for Next 16 compatibility.
- **Infra checks:** Supabase project active; migrations count matched expectations in session; Vercel production env vars partially populated (later CLI check observed Supabase, Resend API, and Upstash names; Sentry DSNs and `RESEND_WEBHOOK_SECRET` were not visible).
- **GitHub:** GitHub Actions secret/variable names were confirmed on 2026-05-08 without pasting values into docs. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` were added for E2E.
- **Still manual (Plan 06):** Supabase Dashboard — JWT expiry **3600s**; register **Custom Access Token Hook** → `app.custom_access_token_hook`; configure Custom SMTP through Resend. Vercel — move/remove existing **app.*/track.*** aliases for `popsindustrial.com`, attach them to `pops--coating`, and set remaining env gaps. Resend — complete DNS (DKIM/SPF/MX) for sending domain. Sentry — set server and public DSNs in Vercel/local env.

### Phase gating (ralph / Phase 02)

- Phase 02 planning (`/gsd-plan-phase`) should not start until Phase 1 Plan 06 is fully verified (Tasks 2–5) per `.planning/phases/01-foundation/01-06-PLAN.md`.

---

## 2026-05-08

### QR packet automation decision

- Preserve the simple shop-floor workflow as the product spine: front desk creates job → system generates job number, opaque packet token, QR, and printable packet → paper packet travels with parts → worker scans at workstation and records stage → customer portal updates automatically.
- Packet QR codes must open the authenticated scanner flow with an opaque token, not a raw job-number URL. Wave 1 target: `https://app.popsindustrial.com/scan?packet=<packet_token>`.
- Customer-facing status belongs on `track.popsindustrial.com` via magic-link portal. The packet QR is for shop staff scanning, not public customer tracking.
- Implementation reminder: status changes still go only through `app.record_scan_event()`; direct `jobs.production_status` updates remain forbidden.

### Phase 1 gate implementation pass

- Normalized active planning/docs domain references from stale `popscoating.com` to canonical `popsindustrial.com`. Remaining `popscoating.com` mentions are warnings about stale domains or non-domain identifiers such as the `pops-coating` tenant slug/project id.
- Automated app gates passed locally: `pnpm type-check`, `pnpm lint`, `pnpm test` (33 files / 234 tests), and `pnpm build`.
- Applied `0018_security_and_hot_path_hardening.sql` to the linked Pops Supabase project with `supabase db push --linked --include-all --yes`; `supabase migration list --linked --debug` showed local and remote `0001` through `0018` aligned.
- Applied `0019_pgtap_test_schema_usage.sql` and verified local and remote migrations through `0019`.
- Applied `0020_security_definer_fail_closed.sql` and verified local and remote migrations through `0020`.
- Regenerated `src/shared/db/types.ts` from the linked schema with `supabase gen types typescript --linked > src/shared/db/types.ts`; `pnpm type-check`, `pnpm lint`, and `pnpm test` still pass afterward.
- `supabase test db --linked` now passes: 9 files / 87 tests. The SQL test files set `SET ROLE postgres` for fixture setup, then switch to `authenticated` where RLS behavior is being asserted.
- GitHub Actions secret/variable names were confirmed without printing values; `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` were added for E2E.
- Vercel project `stuntmandavers-projects/pops--coating` is linked and has ready production deployments, but canonical `app.popsindustrial.com` and `track.popsindustrial.com` cannot be attached until existing aliases are moved/removed from their current Vercel project. The production URL still shows stale `app.popscoating.com`.
- Vercel CLI env inventory showed Supabase, Resend API, and Upstash Redis/QStash names; `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, and `RESEND_WEBHOOK_SECRET` were not visible and remain gaps.
- `.env.local` contains most local service variables but does not include `SUPABASE_PROJECT_REF`, `RESEND_WEBHOOK_SECRET`, `E2E_STAFF_EMAIL`, or `E2E_STAFF_PASSWORD`; do not paste values into docs.
- `scripts/seed-tenant.ts` now generates but does not print the recovery action link; owner setup needs an approved secure handoff path. The live Tenant 1 seed run still needs the owner's real email/name.
