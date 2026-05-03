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
| GitHub secrets | `RESEND_API_KEY` and `SUPABASE_PROJECT_REF` added for Actions — no values in-repo. |
| DB migrations | All migrations applied on live Supabase — re-verify before sign-off. |

### Still requires manual action

| Item | Where |
|------|--------|
| JWT expiry → 3600s | Supabase Dashboard → Authentication → Settings → JWT Expiry |
| Auth Hook registration | Supabase Dashboard → Authentication → Hooks → Custom Access Token → `app.custom_access_token_hook` |
| Upstash credentials | Vercel Marketplace → Upstash; env: `UPSTASH_REDIS_REST_URL` + token |
| Sentry DSN | Sentry project; `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` on Vercel + `.env.local` |
| Vercel domains | `app.popsindustrial.com` + `track.popsindustrial.com` (remove stale `popscoating.com` if present) |
| Resend DNS | DKIM / SPF / MX for `popsindustrial.com` (registrar). |

After push/sync and the **two Supabase Dashboard** steps (JWT + Auth Hook), Phase 1 **Task 5** (success criteria walkthrough) can run for Phase 1 sign-off.

---

## 2026-05-03

### Cursor session

- Confirmed production Vercel URL is **not** derivable from the repo alone (`.gitignore` drops `.vercel/`).
- `vercel project ls` / `vercel ls` under CLI scope **stuntmandavers-projects** returned no projects/deployments — deployment may live under another Vercel team or account linked in the dashboard/Git integration.

### Claude Code session (terminal 48 recap)

- **Build:** Resolved App Router conflict between `(office)` and `(portal)` by consolidating root + sign-in flows; host-based redirect for office vs portal; `pnpm build` reported passing after changes.
- **Config:** `typedRoutes` moved out of `experimental` in `next.config.ts` for Next 16 compatibility.
- **Infra checks:** Supabase project active; migrations count matched expectations in session; Vercel production env vars partially populated (session noted gaps for Upstash/Sentry).
- **GitHub:** `RESEND_API_KEY` and `SUPABASE_PROJECT_REF` (or equivalent) set via `gh secret` in session — verify in repo **Settings → Secrets** without pasting values into docs.
- **Still manual (Plan 06):** Supabase Dashboard — JWT expiry **3600s**; register **Custom Access Token Hook** → `app.custom_access_token_hook`. Vercel — attach **app.*/track.*** hostnames for `popsindustrial.com` (replace any stale `popscoating.com` references). Resend — complete DNS (DKIM/SPF/MX) for sending domain. Upstash — provision via Vercel Marketplace and set Redis REST URL + token in env.

### Phase gating (ralph / Phase 02)

- Phase 02 planning (`/gsd-plan-phase`) should not start until Phase 1 Plan 06 is fully verified (Tasks 2–5) per `.planning/phases/01-foundation/01-06-PLAN.md`.
