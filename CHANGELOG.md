# Changelog

All notable changes to this repository are documented here. The format is inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### App / Office UI — Companies CRUD (2026-05-06)

- **`/(office)/companies/*` shipped** (Loki brief 01, RARV cycle 18, commit `8987da9`). Mirrors the jobs CRUD pattern exactly so the two surfaces stay structurally identical and easy to reason about side-by-side. UI-only — the CRM module API and its 27 vitest tests already existed; this brief built the staff-facing pages on top.
  - **List** (`/companies`) — server component with `q` (matches `name` via `.ilike`, single column so no `escapeForOr` needed) and `include_archived` checkbox filters. Empty state links to `/companies/new`. Native `<table>` with name / phone / email / status columns.
  - **Create** (`/companies/new`) — server-component wrapper renders `<NewCompanyForm />`. Form uses `useActionState(createCompanyFromForm)` posting `FormData` keyed to match the Zod schema in `src/modules/crm/actions/companies.ts`, redirects to detail on success.
  - **Detail** (`/companies/[id]`) — two-column layout: contact info + shipping/billing address cards on the left, inline contacts list (via `listContacts({ company_id })`) on the right. Empty state for "no contacts on file yet". `notFound()` guard for missing IDs. Edit button links to `/companies/[id]/edit`.
  - **Edit** (`/companies/[id]/edit`) — partial-update via the `assignIfDefined` bridge pattern — only fields the user actually entered are sent to `updateCompany`. Same shared `<CompanyFormFields />` from the create form, defaults populated from `getCompanyById`.
  - **Shared `CompanyFormFields`** under `_components/` — three sections (Customer details / Shipping address / Billing address / Notes) with field names matching the Zod schema 1:1 so a `FormData` round-trip reconstructs `CreateCompanyInput`/`UpdateCompanyInput` cleanly. State+ZIP rendered as a 2-column sub-grid for visual rhythm.
- **Hard constraints respected:** no shadcn primitives added, no module edits, no nav-link change in `(office)/layout.tsx`, no `getSession()` calls, RLS via the `@/modules/crm` barrel only. `archiveCompany` deferred — it's one-way (no unarchive method) and shipping a destructive button without an undo violates the "no irreversible actions" hygiene.
- **Verified** via `pnpm tsc --noEmit` (clean) and `pnpm test --run` (161/161, zero regressions). `pnpm build` remains blocked on pre-existing parallel-route conflicts in operator-WIP `(office)/page.tsx` + `(office)/sign-in/` + `(portal)/page.tsx` + `(portal)/sign-in/` + `(portal)/jobs/`; that block predates this brief and needs a dedicated reconciliation brief (see `next_session_pickup` item 8 in `.loki/state/orchestrator.json`).
- **Compound learning** appended to `.loki/memory/timeline.json` cycle 18: typedRoutes manifest regen timing on newly created routes (cast `as Route` as the cheap fallback when the route isn't yet in the manifest); `mv source1 source2 dest_dir/` silently overwrites when sources share a basename (recovered the lost `(office)/page.tsx` via mem-search obs `#16016`); `email: z.string().email().nullish()` rejects empty string so `formDataString` must convert `""` to `null`/`undefined`.
- Loki state synced: `tasksCompleted` 21 → 22, `atomic_commits_this_session` 21 → 22, `files_created` 59 → 68, four new entries in `ui_surfaces_built`. State commit `ff15b1b`.

### Website / Accessibility + Content (2026-05-05)

- **Homepage gained four new sections** mapped from a competitive UX/UI audit (`nationalcoatingsinc.com`):
  - `IndustriesGrid` (6 cells) — self-identification widget for Aerospace & Defense, Heavy Equipment, Transportation & Trailers, Infrastructure & DOT, Marine & Outdoor, Manufacturing & Fabrication. Industries derived from existing hero lede, FDOT certification, and customer review-photo evidence.
  - `CapacitySpecs` — guarded behind `SPECS_READY` boolean. Default state renders a CTA card ("Cure oven, max part weight, blast booth, throughput — sized to your job. Tell us what you have and we'll confirm a fit.") so visitors never see TODO placeholders. Flip `SPECS_READY = true` once real numbers are sourced and the four-cell grid renders automatically.
  - `Testimonials` — four real Google reviews (David Wallace, Captain Ralph, Tunis Cooper, Lucas Pemberton) with attribution to "Verified Google Review · Local Guide" + year. Quotes lightly trimmed; meaning preserved. Sourced from the verified 4.7/68 Google rating.
  - `LocalBusiness` JSON-LD on `/` — `getLocalBusinessJsonLd()` in `lib/jsonld.ts` emits Schema.org LocalBusiness with PostalAddress (from `content/company.ts`), AggregateRating (4.7/68 from `content/testimonials.ts`), and Review[] for SERP rich-result eligibility. Per-review ratingValue=5 with comment explaining the inference.
- **Site-wide accessibility cleanup — zero axe violations across 18 routes** (WCAG 2.0/2.1/2.2 A + AA):
  - **BlurFade now respects `prefers-reduced-motion: reduce`** (`components/magicui/blur-fade.tsx`). `useReducedMotion()` from motion/react collapses both variants to identical visible state, snapping content to its final position with no animation. Site-wide effect.
  - **Header phone link tap target meets WCAG AAA (44×44)** at every breakpoint via `min-w-11 justify-center`. Phone label now visible from `sm:` (icon + number); icon-only floor on smaller phones.
  - **Trust-bar contrast + `<dl>` semantics** fixed on the homepage. `text-ink-400` → `text-ink-600` for dt labels; detail moved from a sibling `<p>` to a `<span>` inside the `<dd>` to satisfy axe's definition-list rule. Same visual layout, valid markup.
  - **ServiceRow contrast** — decorative numerals were `text-pops-yellow-500/35` resolving to 1.15:1 contrast; now `text-ink-400` (3.06:1, passes large-text 3:1) with brand yellow accent on row hover. "Learn more" label switched from `text-pops-yellow-600` (1.93:1) to `text-ink-900` (~13:1); arrow keeps the yellow accent as a decorative aria-hidden glyph.
  - **Button `ghost` variant** — default color bumped from `text-ink-400` to `text-ink-600` so secondary buttons read at 9:1 instead of 3:1.
  - **Quote-form inline `tel:` links** — both occurrences now use always-on `underline underline-offset-2` so they pass axe's `link-in-text-block` rule (color-only distinction was failing 1.08:1 vs surrounding text). Hover changes color (yellow-500 → yellow-300) instead of toggling underline.
  - **Contact page "(billing only)" sub-text** — `text-ink-500` (2.77:1 on dark) → `text-ink-300` (~9:1).
  - **iPad-portrait horizontal overflow** in the Standards column — `sm:flex-row` → `lg:flex-row` so the two compact buttons stack on iPad and only sit side-by-side at desktop. Drops `document.scrollWidth` from 786px to 753px on a 768px viewport.
- **Periodic accessibility audit script** added at `apps/pops-website/scripts/axe-audit.ts` and exposed as `pnpm a11y-audit`:
  - Walks every customer-facing route (currently 18), scrolls each top-to-bottom to wake `BlurFade` IntersectionObserver state, runs the full WCAG 2.0/2.1/2.2 A + AA rule set via `@axe-core/playwright`.
  - Exits non-zero on any violation so it can be wired into a ship gate alongside `contrast-lint`. Existing `contrast-lint` is now the narrow color-contrast-only check; `a11y-audit` is the broad regression gate.
  - Smoke-test result on 2026-05-05: 18/18 routes, zero violations.
- **GitHub Actions gate** at `.github/workflows/website-a11y.yml` runs the audit on every PR + main-push that touches `apps/pops-website/**`. Builds production, starts the server, waits for it to accept requests, runs `pnpm a11y-audit`, tears the server down. Currently in **warning-only mode** (`continue-on-error: true`) for the first two cycles so flake — if any — surfaces in CI logs without blocking unrelated marketing changes. Flip to `false` to promote to a blocking gate.
- **Tappable phone link added to the header** with content-driven E.164 formatting from `content/company.ts` (`+18636447473`). No hardcoded numbers; flips one breakpoint to show the visible number on tablets and up.
- **Sentry build-plugin auth token gitignored** — `.env.sentry-build-plugin` (file's own first line: "DO NOT commit this file") was protected only by remembering to never `git add -A`. Now explicitly listed in `.gitignore`.
- Build verified after every change: 29 routes prerender; type-check + lint + production build all green.
- All 19 commits live on `main` and pushed to origin.

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
