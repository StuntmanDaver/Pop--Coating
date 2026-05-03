# Changelog

All notable changes to this repository are documented here. The format is inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Documentation

- Added this changelog and `.planning/intel/SESSION-MEMORY.md` for dated operational/session notes.
- Added always-on Cursor rule `.cursor/rules/plan06-phase1-continuity.mdc` so new Cursor sessions inherit the Phase 1 Plan 06 automated vs manual checklist (terminal 48 parity).
- Canonical checklist tables duplicated in SESSION-MEMORY; CLAUDE.md repo state updated to reference continuity docs and remove obsolete “no application code yet” line.

### Ops / discovery (2026-05-03)

- **Vercel:** Documented CLI check: scoped team `stuntmandavers-projects` showed no projects or deployments; `apps/pops-website` had no `.vercel` link locally. Deploy URL must be taken from the Vercel dashboard for the owning team/project, or after `vercel link` / deploy.
- **Phase 1 / Plan 06:** Captured Claude Code session outcomes: Turbopack route-group conflict addressed via unified root and `/sign-in` with host detection; `next.config` moved `typedRoutes` to stable option; migrations reported live on Supabase; additional GitHub Actions secrets added (no secret values recorded in-repo). Outstanding manual checkpoints: JWT expiry 3600s, Auth Hook registration in dashboard, marketplace/env gaps (Upstash, Sentry), production domains for `app` / `track` hosts, Resend DNS for tenant mail.
- **Git workflow note:** Branch `ralph/foundation-completion` diverged from `main` during parallel work; use explicit `git push origin <branch>` after `git branch --show-current` to avoid pushing the wrong upstream.
