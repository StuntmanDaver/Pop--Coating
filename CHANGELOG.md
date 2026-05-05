# Changelog

All notable changes to this repository are documented here. The format is inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Website / CRO (2026-05-05)

- **CRO Quick Wins shipped to popsindustrial.com (audit §9, items 1–9).** Phone-first conversion architecture across the marketing site:
  - Header phone number now visible from `sm:` breakpoint (was `lg:`) — surfaces the primary call CTA on tablets and most laptops; icon-only fallback retains 44×44 tap target on phones.
  - Homepage hero: secondary CTA swapped from "See our work" to `tel:` link "Call 863.644.7473"; lede now ends with "Quote in 24 hours."; weak "5 Services" stat replaced with "24 hours / Quote Turnaround" differentiator.
  - Quote form (`/request-a-quote`): submit copy "Submit Request" → "Get my 24-hour quote"; new "Need it fast? Call …" callout above the form; success state now shows phone fallback so the confirmation page isn't a dead end.
  - `?service=<slug>` deep-link prefill: all five service-detail page CTAs (hero + inline) now route to `/request-a-quote?service=<slug>`. Server-side `searchParams` resolution via new `SLUG_TO_SERVICE` map in `app/request-a-quote/schema.ts` → `prefillService` prop on `QuoteForm` → `react-hook-form` `defaultValues`. Avoids `useSearchParams` Suspense dance.
  - Contact page: `invoices@` demoted to small/gray with "(billing only)" qualifier so new prospects aren't choosing between two equally-weighted emails.
- Item #10 of the Quick Wins list (populate `SPECS_READY = true` in `components/marketing/capacity-specs.tsx` with real cure-oven / max-weight / blast-booth / throughput numbers) is non-code and tracked as a follow-up email to the client.
- Build verified: 28 static + 1 dynamic route (`/request-a-quote` flips to `ƒ` because of the new `searchParams` read — expected). Type-check clean.

### Documentation

- Added this changelog and `.planning/intel/SESSION-MEMORY.md` for dated operational/session notes.
- Added always-on Cursor rule `.cursor/rules/plan06-phase1-continuity.mdc` so new Cursor sessions inherit the Phase 1 Plan 06 automated vs manual checklist (terminal 48 parity).
- Canonical checklist tables duplicated in SESSION-MEMORY; CLAUDE.md repo state updated to reference continuity docs and remove obsolete “no application code yet” line.

### Ops / discovery (2026-05-03)

- **Vercel:** Documented CLI check: scoped team `stuntmandavers-projects` showed no projects or deployments; `apps/pops-website` had no `.vercel` link locally. Deploy URL must be taken from the Vercel dashboard for the owning team/project, or after `vercel link` / deploy.
- **Phase 1 / Plan 06:** Captured Claude Code session outcomes: Turbopack route-group conflict addressed via unified root and `/sign-in` with host detection; `next.config` moved `typedRoutes` to stable option; migrations reported live on Supabase; additional GitHub Actions secrets added (no secret values recorded in-repo). Outstanding manual checkpoints: JWT expiry 3600s, Auth Hook registration in dashboard, marketplace/env gaps (Upstash, Sentry), production domains for `app` / `track` hosts, Resend DNS for tenant mail.
- **Git workflow note:** Branch `ralph/foundation-completion` diverged from `main` during parallel work; use explicit `git push origin <branch>` after `git branch --show-current` to avoid pushing the wrong upstream.
