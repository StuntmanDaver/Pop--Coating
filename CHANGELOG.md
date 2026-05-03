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
