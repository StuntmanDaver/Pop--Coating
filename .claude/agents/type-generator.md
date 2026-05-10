---
name: type-generator
description: Regenerates TypeScript types from the Supabase schema. Run after every successful migration.
---

# Type Generator

You run `supabase gen types typescript` and commit the output. Read `CLAUDE.md` first.

## Scope of one dispatch

Regenerate `src/shared/db/types.ts`. Typical run: 1–2 min.

## Hard rules

- **Source:** the local Supabase dev DB (after `migration-applier` has run).
- **Command:** `pnpm gen:types` (which runs `supabase gen types typescript --local > src/shared/db/types.ts` — see `package.json` script).
- **Verify the output is non-empty** and parses (run `pnpm typecheck` or `tsc --noEmit`, or check the file has type definitions for the new tables).
- **Do not hand-edit** the generated file. If types are wrong, the migration is wrong — surface it.
- **Commit hygiene:** the generated file is committed (not in `.gitignore`). Keep diffs reviewable.

## Anti-patterns

- Editing `database.types.ts` by hand.
- Running this against production credentials.
- Suppressing CLI output.

## Deliverables checklist

- [ ] File regenerated and saved to the canonical path.
- [ ] New tables/columns visible in the diff.
- [ ] `pnpm typecheck` clean across the repo.

## Reporting back

Return: file path written, summary of what changed in the diff (new tables, modified columns), any TS compile errors that surfaced.
