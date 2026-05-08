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
| GitHub Actions config | CI exists; previous session reported `RESEND_API_KEY` and `SUPABASE_PROJECT_REF` configured for Actions — re-verify current secret/variable names before sign-off. |
| DB migrations | Live Supabase now has local migrations through `0018_security_and_hot_path_hardening.sql`; re-verify before sign-off. |

### Still requires manual action

| Item | Where |
|------|--------|
| JWT expiry → 3600s | Supabase Dashboard → Authentication → Settings → JWT Expiry |
| Auth Hook registration | Supabase Dashboard → Authentication → Hooks → Custom Access Token → `app.custom_access_token_hook` |
| Custom SMTP | Supabase Dashboard → Auth SMTP settings; use Resend SMTP with `noreply@popsindustrial.com` |
| Upstash credentials | Vercel Marketplace → Upstash; env: `UPSTASH_REDIS_REST_URL` + token |
| Sentry DSN | Sentry project; `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` on Vercel + `.env.local` |
| Vercel domains | `app.popsindustrial.com` + `track.popsindustrial.com` (remove stale `popscoating.com` hosts if present) |
| Resend DNS | DKIM / SPF / MX for `popsindustrial.com` (registrar). |
| GitHub Actions Supabase config | Confirm `SUPABASE_ACCESS_TOKEN` secret and `SUPABASE_PROJECT_REF` variable without storing values in-repo |

After branch push/sync and all human-only blockers in this table are complete or re-verified, Phase 1 **Task 5** (success criteria walkthrough) can run for Phase 1 sign-off. Linked pgTAP verification also needs Docker Desktop when run locally.

---

## 2026-05-03

### Cursor session

- Confirmed production Vercel URL is **not** derivable from the repo alone (`.gitignore` drops `.vercel/`).
- `vercel project ls` / `vercel ls` under CLI scope **stuntmandavers-projects** returned no projects/deployments — deployment may live under another Vercel team or account linked in the dashboard/Git integration.

### Claude Code session (terminal 48 recap)

- **Build:** Resolved App Router conflict between `(office)` and `(portal)` by consolidating root + sign-in flows; host-based redirect for office vs portal; `pnpm build` reported passing after changes.
- **Config:** `typedRoutes` moved out of `experimental` in `next.config.ts` for Next 16 compatibility.
- **Infra checks:** Supabase project active; migrations count matched expectations in session; Vercel production env vars partially populated (session noted gaps for Upstash/Sentry).
- **GitHub:** Previous session reported `RESEND_API_KEY` and `SUPABASE_PROJECT_REF` (or equivalent) set via `gh secret`; current gate still requires confirming `SUPABASE_ACCESS_TOKEN` secret and `SUPABASE_PROJECT_REF` variable in repo settings without pasting values into docs.
- **Still manual (Plan 06):** Supabase Dashboard — JWT expiry **3600s**; register **Custom Access Token Hook** → `app.custom_access_token_hook`; configure Custom SMTP through Resend. Vercel — attach **app.*/track.*** hostnames for `popsindustrial.com` (replace any stale `popscoating.com` references) and confirm production env vars. Resend — complete DNS (DKIM/SPF/MX) for sending domain. Upstash — provision via Vercel Marketplace and set Redis REST URL + token in env. Sentry — set server and public DSNs in Vercel/local env.

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
- Regenerated `src/shared/db/types.ts` from the linked schema with `supabase gen types typescript --linked > src/shared/db/types.ts`; `pnpm type-check`, `pnpm lint`, and `pnpm test` still pass afterward.
- `supabase test db` without flags failed because no local Supabase database was listening on `127.0.0.1:54332`.
- `supabase test db --linked` after sourcing `.env.local` reached the linked-project flow but failed because Docker Desktop was not running. pgTAP remains unverified in this session.
- `.env.local` contains most local service variables but does not include `SUPABASE_PROJECT_REF`, `RESEND_WEBHOOK_SECRET`, `E2E_STAFF_EMAIL`, or `E2E_STAFF_PASSWORD`; do not paste values into docs.
- `scripts/seed-tenant.ts` now generates but does not print the recovery action link; owner setup needs an approved secure handoff path. The live Tenant 1 seed run still needs the owner's real email/name.
