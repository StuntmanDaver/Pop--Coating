# Ralph Agent Instructions — Pops Website Rebuild

You are an autonomous coding agent rebuilding popsindustrial.com as `apps/pops-website/` inside this monorepo. Each invocation completes ONE user story from `prd.json`.

## Your Task

1. Read the PRD at `prd.json` (in the same directory as this file)
2. Read the progress log at `progress.txt` (especially the `## Codebase Patterns` section at the top)
3. Read the comprehensive PRD at `../../docs/prd/POPS-WEBSITE-REBUILD.md` for full context
4. Read the design contract at `../../docs/design/popsindustrial-design-principles.md` — every UI story must respect it
5. Check you're on the correct branch from PRD `branchName` (`ralph/pops-website`). If not, check it out or create from `main`.
6. Pick the **lowest-priority** user story where `passes: false` (priority 1 first, then 2, then 3...)
7. Implement that single user story
8. Run quality checks: `pnpm --filter pops-website type-check`, `pnpm --filter pops-website build`, and any tests/lint that exist
9. For UI stories, **verify in the browser** using whatever browser MCP is available (Playwright MCP preferred)
10. Update CLAUDE.md files where appropriate (see below)
11. If checks pass, commit ALL changes with message: `feat(pops-website): [Story ID] - [Story Title]`
12. Update the PRD to set `passes: true` for the completed story
13. Append your progress to `progress.txt`

## Source materials (read these before any UI story)

| Source | Path | Use |
|---|---|---|
| **Design principles** | `../../docs/design/popsindustrial-design-principles.md` | Color tokens, type scale, spacing, component contracts. Quote section numbers in your progress notes. |
| **Comprehensive PRD** | `../../docs/prd/POPS-WEBSITE-REBUILD.md` | Project context, page-by-page content map, business facts, open questions |
| **Per-page clean markdown** | `../../.firecrawl/popsindustrial/pages/<slug>.md` | The body content for each page — frontmatter has url, title, description |
| **Per-page raw HTML** | `../../.firecrawl/popsindustrial/pages/<slug>.html` | Original markup if you need to disambiguate structure |
| **Reference screenshots** | `../../.firecrawl/popsindustrial/screenshots/{desktop,mobile}/<slug>.png` | Visual baseline — your rebuild improves on these but should not lose content |
| **Site globals** | `../../.firecrawl/popsindustrial/_raw/site-globals.json` | Footer text, nav columns, JSON-LD, slider, alt-text audit, filename typos |
| **Manifest** | `../../.firecrawl/popsindustrial/manifest.json` | Per-page artifact map, business facts, verification log |
| **Asset bundle** | `../../.firecrawl/popsindustrial/assets/{images,pdfs}/` | All static files (already copied to `apps/pops-website/public/` after US-004) |

## Stack guardrails (locked, no deviations)

These match the root [`CLAUDE.md`](../../CLAUDE.md):

- **Framework:** Next.js 16 App Router, TypeScript strict
- **Styling:** Tailwind v4 (CSS-first in `app/globals.css`), shadcn/ui primitives
- **Fonts:** `next/font/google` Archivo Black + Inter (subsets: `['latin']` only — English Wave 1)
- **Forms:** React Hook Form + Zod, Server Actions
- **Email:** Resend
- **Captcha:** Google reCAPTCHA v3
- **Hosting:** Vercel Pro
- **Package manager:** pnpm — NEVER `npm` or `yarn`
- **Sentry:** reuse `@sentry/nextjs` already in root package.json
- **NOT used in pops-website:** Supabase, Auth, RLS, i18n. Those are SaaS-app concerns at `src/`.

## Story sizing

Each story is sized for ONE iteration (one context window). If you find a story is too big to complete cleanly:
1. Stop, do NOT mark it `passes: true`
2. Append a note to `progress.txt` explaining where you stopped and why
3. Update the PRD to split the story (add new entries with sub-IDs like US-031a, US-031b)

## Verifying UI stories

Every story whose acceptance criteria includes "Verify in browser using dev-browser skill" must:
1. Start the dev server: `pnpm --filter pops-website dev` (in background)
2. Use Playwright MCP (preferred) or any available browser MCP to navigate to the relevant page
3. Confirm the visual change works
4. Take a screenshot and save it under `progress/screenshots/<story-id>.png` if helpful
5. Stop the dev server when done

## Progress Report Format

APPEND to progress.txt (never replace, always append):
```
## [Date/Time] — [Story ID] [Story Title]
- What was implemented
- Files changed (paths relative to apps/pops-website/)
- Quality checks: typecheck ✓ | build ✓ | browser ✓
- **Learnings for future iterations:**
  - Patterns discovered (e.g., "next/font variables are scoped to <html>, not <body>")
  - Gotchas (e.g., "shadcn install pulls in components/ui — already gitignored at /; remember to git add explicitly")
  - Useful context (e.g., "the contact page Map iframe URL is preserved verbatim from the scrape")
---
```

## Consolidate Patterns

If you discover a **reusable pattern** future iterations should know, add it to the `## Codebase Patterns` section at the TOP of progress.txt:

```
## Codebase Patterns
- next/font CSS vars (--font-display, --font-text) are set on <html>; reference via Tailwind theme `font-display` / `font-text`
- All page content sources from .firecrawl/popsindustrial/pages/<slug>.md — frontmatter has url/title/description
- company.ts is the single source of truth for business facts (addresses, phones, emails, hours)
- Footer is rendered from site-globals.json#footer.navigation_columns — DO NOT hardcode link arrays
- Image paths: /images/<filename> in apps/pops-website/public/images/
- The shipping ZIP is locked at 33811 (open question §12.1 in PRD)
```

Only add patterns that are **general and reusable**, not story-specific details.

## Update CLAUDE.md Files

Before committing, check if any edited directories have a CLAUDE.md you should update with non-obvious rules. Examples:
- `apps/pops-website/components/CLAUDE.md` — "Cards on dark surfaces need both shadow AND a 1px ink-600 border (per design principles §5.3)"
- `apps/pops-website/app/forms/CLAUDE.md` — "Every form must include reCAPTCHA token in formData; verify server-side via lib/recaptcha"

Only add CLAUDE.md content that is genuinely reusable and saves future iterations time.

## Quality Requirements

- ALL commits must pass `pnpm --filter pops-website type-check`
- ALL UI commits must pass browser verification
- Do NOT commit broken code
- Do NOT touch `src/` (the SaaS app) or `supabase/` — those are not part of this rebuild
- Keep changes focused: one story per commit, no drive-by refactors
- Follow existing patterns (check progress.txt's Codebase Patterns section first)

## Commit Convention

`feat(pops-website): [Story ID] - [Story Title]`

Examples:
- `feat(pops-website): US-001 - Add apps/pops-website pnpm workspace + Next.js 16 scaffold`
- `feat(pops-website): US-008 - Build Button component with 4 variants`

For follow-up commits within the same story (e.g., fixing a typecheck error), use `fix(pops-website): [Story ID] - <what>`.

## Open Questions (from PRD §12)

These are NOT yours to answer — flag them in progress.txt if any story bumps into one:

1. **Shipping ZIP discrepancy** (33813 footer vs 33811 contact). Locked at 33811 per PRD §7. Don't change.
2. **Photoshoot refresh.** Use existing photos from `.firecrawl/popsindustrial/assets/images/` for now.
3. **Logo lockup canon.** Locked at `Pops-no-border.png` per PRD §12.3.
4. **Resend API key + sender domain** — env var must be set before forms work. Document in story acceptance, don't try to provision keys.
5. **reCAPTCHA v3 site key** — same.

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete and passing, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end your response normally — the next iteration will pick up.

## Important Reminders

- Work on ONE story per iteration
- Read the Codebase Patterns section in progress.txt before starting
- For content faithfulness, ALWAYS read `.firecrawl/popsindustrial/pages/<slug>.md` before writing a page — don't paraphrase from memory
- For the design contract, ALWAYS read the relevant section of `docs/design/popsindustrial-design-principles.md` before building a component
- The 18 pages are listed in the PRD §6 — don't skip any
- The footer is THE place where the site's navigation lives (no header nav exists per scrape) — do not add a header nav menu in this rebuild without an explicit story for it
