# Changelog

All notable changes to the Pops Industrial Coatings platform and its Claude Code harness configuration.

---

## [Unreleased]

### Added
- `everything-claude-code` (ECC) harness installed globally and in project (2026-05-03)
  - **Global** (`~/.claude/`): 48 agents, 182 skills, 68 slash commands, rules for 15 language namespaces, `hooks/hooks.json` preflight dispatchers
  - **Project** (`.claude/rules/ecc/`): TypeScript, web, and common ECC rules scoped to this repo
  - Install state tracked at `~/.claude/ecc/install-state.json`
  - Source: https://github.com/affaan-m/everything-claude-code

---

## [pops-website rebuild] — 2026-05-02 → 2026-05-03

The popsindustrial.com marketing site rebuilt as `apps/pops-website/` — a separate pnpm workspace alongside the SaaS shell. Driven by the Ralph autonomous harness across two runs (rate-limit interrupted at 16/49 stories, restarted with cap=100, completed). 49/49 stories passing. Branch: `ralph/pops-website`.

### Added — Source materials
- Firecrawl scrape of the live popsindustrial.com captured at `.firecrawl/popsindustrial/` (308 files / 71 MB) — per-page clean markdown, raw HTML, desktop + mobile screenshots at 1440w / 375w, 194 image assets, 4 PDFs, site-globals JSON, manifest with company facts
- `docs/prd/POPS-WEBSITE-REBUILD.md` v1.0 — 49-story rebuild PRD with page-by-page content map, forms spec, SEO + performance budgets, definition of done
- `docs/design/popsindustrial-design-principles.md` — design contract (oklch palette, Pops yellow `#FECD08` accent, Archivo Black 56→28 / Inter 22→12 type scale, component contracts, accessibility floor)
- Ralph harness at `scripts/ralph-pops-website/` (`prd.json`, `progress.txt`, `CLAUDE.md`, `ralph.sh`)

### Added — Marketing site (apps/pops-website/)
- **Foundation:** pnpm workspace package, Next.js 16 App Router, strict TypeScript, Tailwind v4 (CSS-first `@theme`), Archivo Black + Inter via `next/font/google`, `content/company.ts` single source of truth for business facts, 194 images + 4 PDFs + multi-resolution favicon copied to `public/`
- **Primitives** (`components/`): Container, Section, EyebrowLabel, Button (4 variants × 2 sizes, asChild Slot, focus ring, loading state), Card, Input/Textarea/Label, FormField with aria-describedby wiring, Radix Checkbox (44×44 tap target), Header (with skip-to-content), Footer (3-column nav from site-globals.json), Hero (eyebrow + display H1 + lede + dual CTA + dark-overlay photo per principles §6.2), ServiceTile, MapEmbed
- **Pages:** all 18 production routes — home, about-us trio (about/history/leadership), request-a-quote quartet (quote/facilities/standards/terms), services index + 5 service detail pages (wet-paint, complex, abrasive, powder, large-capacity), contact (form + Google Maps embed), check-in, check-out, guest-safety-rules
- **Forms (Phase D):** `lib/email.ts` shared Resend helper; Server Actions for Quote, Contact, Check-In, Check-Out; Google reCAPTCHA v3 verification across all four
- **SEO + a11y (Phase E):** per-page `Metadata`, JSON-LD Organization + WebSite + Service schema on home + service pages, `app/sitemap.ts` + `app/robots.ts`, alt-text audit script, heading-order audit script
- **Quality (Phase F):** Playwright contrast lint (`scripts/contrast-lint.ts` — fails build on AA violations), Lighthouse CI budgets (`lighthouserc.json` — Perf ≥95 mobile, ≥98 desktop), mobile responsive audit script, Vercel deploy config (`vercel.ts` with cache headers, security headers, env-var template), `apps/pops-website/README.md` handoff documentation
- **Visual proof:** per-story Playwright screenshots committed at `scripts/ralph-pops-website/progress/screenshots/US-XX-*.png` (17 baselines)

### Fixed
- Sentry install wizard had regressed deliberate project decisions; restored `process.env.SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` (was hardcoded literal in 3 files), `tracesSampleRate: 0.1` (was 1.0 — 10× cost), removed `sendDefaultPii: true` (multi-tenant privacy), restored `environment: process.env.VERCEL_ENV ?? 'development'`, restored tenant_id tagging hint comment in `sentry.server.config.ts`, deleted wizard smoke-test pages (`src/app/sentry-example-page/`, `src/app/api/sentry-example-api/`)

### Changed
- `pnpm-workspace.yaml` extended with `packages: ["apps/*"]` to enable the new workspace
- `package.json`: `@sentry/nextjs` bumped to `^10`, added `@sentry/cli` devDep, added `pnpm.allowBuild` allowlist
- `next.config.ts` (root SaaS app) — wrapped with `withSentryConfig` (org/project, widenClientFileUpload, automaticVercelMonitors, treeshake.removeDebugLogging)
- New `src/instrumentation.ts` (App Router instrumentation) and `src/instrumentation-client.ts` (with project-tuned values + Session Replay 10% session / 100% error)
- New `src/app/global-error.tsx` (Sentry-aware top-level error boundary)
- `.gitignore` refined: ignored `.playwright-mcp/`, `.claude/skills/`, `.claude/rules/`, `.agents/`, `scripts/ralph-*/{ralph.pid,ralph.log,.last-branch}`, stale `.firecrawl/*` (with `popsindustrial/` exception)
- `.claude/settings.json` enabled ~150 plugins from awesome-claude-skills + impeccable

### Documented
- `docs/prd/`, `docs/design/` populated
- `.planning/STATE.md` bumped to phase 01 verified (10/12 must-haves; 2 gaps flagged for live Supabase + Vercel domain wiring)
- `.planning/phases/01-foundation/01-VERIFICATION.md` GSD verification report

### Outstanding (operator steps Ralph cannot do)
- Set env vars per `apps/pops-website/.env.example` in Vercel + locally
- Link Vercel project to `apps/pops-website/` as project root; add `popsindustrial.com` apex + `www → 301`
- Resolve open question: shipping ZIP `33811` (PRD-locked) vs `33813` (live site footer) with client; update `apps/pops-website/content/company.ts` if needed
- Rename Sentry project slug from wizard default `'javascript-nextjs'` to something Pops-specific (label only, non-blocking)

---

## [Phase 01-06] — 2026-05-02

### Fixed
- `link_auth_user_to_actor` trigger made UPDATE-aware (previously only fired on INSERT)
- Renamed domain `popscoating.com` → `popsindustrial.com` across all source files and planning docs

### Changed
- Generated real `Database` TypeScript types from live Supabase schema (replaced placeholder stub)

### Tooling
- Installed `supabase@claude-plugins-official` v0.1.6
- Installed `impeccable@impeccable` v3.0.1 — advanced UI polish skill
- Synced ~40 new marketing/growth/CRO skills via GSD skill sync:
  `ab-test-setup`, `ad-creative`, `ai-seo`, `analytics-tracking`, `aso-audit`, `churn-prevention`,
  `cold-email`, `community-marketing`, `competitor-alternatives`, `competitor-profiling`,
  `content-strategy`, `copy-editing`, `copywriting`, `customer-research`, `directory-submissions`,
  `email-sequence`, `form-cro`, `free-tool-strategy`, `image`, `launch-strategy`, `lead-magnets`,
  `marketing-ideas`, `marketing-psychology`, `onboarding-cro`, `page-cro`, `paid-ads`,
  `paywall-upgrade-cro`, `popup-cro`, `pricing-strategy`, `product-marketing-context`,
  `programmatic-seo`, `referral-program`, `revops`, `sales-enablement`, `schema-markup`,
  `seo-audit`, `signup-flow-cro`, `site-architecture`, `social-content`, `video`
- Configured Firecrawl MCP server (`.firecrawl/`)
- Scraped popsindustrial.com via Firecrawl for design/content reference (`.firecrawl/pops-home.html`, `.firecrawl/pops-sitemap.json`)

---

## [Phase 01-05 / US-001–018] — 2026-04-29 → 2026-05-01

### Added
- Complete Wave 1 auth module: office sign-in Server Action + UI, portal magic-link, auth callback, workstation session management
- `createWorkstation` Server Action + Wave 1 module stubs (`crm`, `jobs`, `packets`, `scanning`, `timeline`, `dashboard`, `settings`, `portal`, `tags`)
- pgTAP RLS test suite — 31 tests green
- CI/CD workflow (GitHub Actions) + seed scripts verified passing
- Sentry initialization with `tenant_id` tagging (`src/instrumentation.ts`, `src/instrumentation-client.ts`, `sentry.*.config.ts`)

### Fixed
- Sentry config import paths in `instrumentation.ts`
- `instrumentation.ts` — added `onRequestError` handler per Sentry Next.js 16 SDK
- Auth guards: `throw` → `redirect` in guard functions; Sentry in `proxy.ts`; CI node 20
- Added `SECURITY DEFINER` to JWT helpers; fixed `production_status` REVOKE migration
- Closed audit gaps from meticulous AC audit

---

## [Phase 01-04] — 2026-04-28

### Tooling
- Installed `context7@claude-plugins-official` (docs lookup MCP)
- Installed `frontend-design@claude-plugins-official` (second frontend-design plugin source)

---

## [Phase 01-03] — 2026-04-10 → 2026-05-01

### Added
- Custom access token hook migration (0007)
- `production_status` column-level REVOKE migration (0008)
- Workstation lifecycle SECURITY DEFINER functions migration (0009)
- `link_auth_user_to_actor` trigger migration (0010)
- Supabase database clients in `src/shared/db/`
- Auth helper guards and claims accessor in `src/shared/auth-helpers/`
- `proxy.ts` routing + Upstash rate limiters
- `seed-tenant.ts` + GitHub Actions CI pipeline

### Tooling
- Installed `vercel@claude-plugins-official` v0.40.1 (updated to latest 2026-05-01)

---

## [Foundation / Week 0] — 2026-03-25 → 2026-04-13

### Tooling — Plugins Installed
| Plugin | Version | Installed |
|--------|---------|-----------|
| `claude-mem@thedotmack` | v10.5.2 | 2026-02-08 |
| `superpowers@claude-plugins-official` | v5.0.7 | 2026-03-25 |
| `frontend-design@claude-code-plugins` | v1.0.0 | 2026-03-26 |
| `figma@claude-plugins-official` | v2.1.30 | 2026-04-02 |
| `expo@expo-plugins` | v1.0.0 | 2026-04-05 |
| `ui-ux-pro-max@ui-ux-pro-max-skill` | v2.5.0 | 2026-04-05 |
| `react-best-practices@vercel-agent-skills` | v1.0.0 | 2026-04-05 |
| `accesslint@accesslint` | v0.1.1 | 2026-04-05 |
| `supabase@supabase-agent-skills` | v05a8f1a3a9f0 | 2026-04-13 |
| `postgres-best-practices@supabase-agent-skills` | v05a8f1a3a9f0 | 2026-04-13 |
| `supabase-complete@supabase-pentest-skills` | v0f9612276b49 | 2026-04-13 |

### Project Scaffolded
- Next.js 16 App Router, TypeScript strict, Tailwind v4, shadcn/ui
- Supabase project wired (migrations 0001–0010)
- Multi-tenant schema with RLS, `app.tenant_id()` SECURITY DEFINER helper
- GSD harness active: 33 agents, hooks, planning artifacts in `.planning/`
- Wave 1 roadmap, contracts, and briefs documented in `docs/`
