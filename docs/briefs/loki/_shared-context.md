# Loki Dispatch — Shared Context Primer

> This file is for YOU (the operator), not for loki. Each per-surface brief is
> self-contained — loki never reads this file.

## Step 0 — Pre-flight checklist

Complete every item BEFORE dispatching any worktree:

### 0.1 Commit in-flight work

```bash
git status              # verify what's pending
git add -A && git commit -m "chore: commit dashboard WIP + instrumentation + table primitive + jobs labels"
```

Verify: `git status` shows clean working tree.

### 0.2 Install Playwright (for Brief 03)

```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
# On Linux only, add --with-deps for system libraries:
# pnpm exec playwright install --with-deps chromium
```

Verify: `pnpm exec playwright --version` prints a version number.

### 0.3 Install `@zxing/browser` (for Brief 05)

**Verified absent from package.json.** Brief 05 needs this.

```bash
pnpm add @zxing/browser @zxing/library
```

Verify: `cat package.json | grep zxing` shows both packages.

### 0.4 Shadcn primitives — none required

Verified the existing CRUD pattern (`src/app/(office)/jobs/**`) uses **native HTML
elements** (`<input>`, `<select>`, `<textarea>`, `<form>`), not shadcn primitives.
Briefs 01 (companies) and 04 (settings) mirror that pattern. The existing primitives
in `src/shared/ui/` (alert, badge, button, card, form, input, label, table) cover
all current needs.

If any brief discovers a missing primitive, loki will write
`.loki/signals/HUMAN_REVIEW_NEEDED` and stop — install at that point.

### 0.5 Push to remote

```bash
git push origin main
```

Worktrees branch off `HEAD`; remote must match.

## Dispatch commands

### Batch A — 3 safe-parallel worktrees

```bash
# Terminal 1
./autonomy/run.sh --provider claude --worktree companies-crud docs/briefs/loki/01-companies-crud.md

# Terminal 2
./autonomy/run.sh --provider claude --worktree portal-job-detail docs/briefs/loki/02-portal-job-detail.md

# Terminal 3
./autonomy/run.sh --provider claude --worktree e2e-jobs-crud docs/briefs/loki/03-e2e-jobs-crud.md
```

### Batch B — after Batch A merges

```bash
# Terminal 1
./autonomy/run.sh --provider claude --worktree settings-admin docs/briefs/loki/04-settings-admin.md

# Terminal 2 (longest-running — highest complexity)
./autonomy/run.sh --provider claude --worktree scan-pwa docs/briefs/loki/05-scan-pwa.md
```

## Canonical doc locations

Each brief embeds these inline so loki never depends on external state:

| Doc | Path |
|-----|------|
| PRD | `PRD.md` |
| Architecture | `docs/DESIGN.md` |
| Execution plan | `docs/EXECUTION.md` |
| Project state | `.planning/STATE.md` |
| Loki orchestrator | `.loki/state/orchestrator.json` |
| Session memory | `.loki/memory/timeline.json` |

## Repo invariants loki may not realize

These are stub-but-present infrastructure that briefs assume exists:

- **`src/shared/audit/index.ts`** — `logAuditEvent` is currently a no-op stub
  (returns nothing). Briefs cite it for forward-compat; do NOT block on audit
  rows being persisted in tests.
- **`src/shared/storage/index.ts`** — `getSignedUrl` returns empty string. No
  upload path is wired. Brief 05 explicitly defers photo upload.
- **`src/shared/db/types.ts`** — placeholder Database type until `pnpm gen:types`
  runs against live Supabase (Phase 1 Plan 06 manual checkpoint). Briefs may
  encounter `as unknown as ...` casts where types are missing.
- **`createServiceClient()`** in `src/shared/db/admin` is gated by ESLint
  `no-restricted-imports` to: `src/modules/{settings,portal,auth}/**`,
  `src/shared/audit/**`, `supabase/functions/**`. **Forbidden in `src/modules/scanning/**`.**

## Conflict-surface matrix

Files that more than one brief COULD touch. Each brief explicitly forbids editing
these without flagging `HUMAN_REVIEW_NEEDED`.

| File | Brief 01 | Brief 02 | Brief 03 | Brief 04 | Brief 05 |
|------|----------|----------|----------|----------|----------|
| `package.json` | — | — | yes (playwright, Step 0) | — | yes (zxing, Step 0) |
| `pnpm-lock.yaml` | — | — | yes (Step 0) | — | yes (Step 0) |
| `vitest.config.ts` | — | — | yes (exclude e2e) | — | — |
| `src/proxy.ts` | — | — | — | — | flag-only |
| `src/shared/ui/*` | read-only | read-only | — | read-only | read-only |
| `src/app/(office)/layout.tsx` | flag-only (nav link) | — | — | flag-only (nav link) | — |
| Module `index.ts` barrels | — | — | — | — | — |

**Rule:** if a brief says "do NOT edit," loki writes to
`.loki/signals/HUMAN_REVIEW_NEEDED` and stops instead.

## Post-merge checklist

After merging each worktree branch:

1. `pnpm test` — full vitest suite (must show 161+ passing, zero regressions)
2. `pnpm build` — TypeScript + Next.js build, zero errors
3. `pnpm lint` — ESLint clean
4. Update `.loki/state/orchestrator.json`:
   - Append to `ui_surfaces_built` array
   - Increment `tasksCompleted`
   - Move appropriate items from `next_session_pickup` to completed
5. Update `.loki/memory/timeline.json` if loki logged compound learnings
6. Delete the worktree: `git worktree remove <name>`
7. Add nav link in `src/app/(office)/layout.tsx` for new office surfaces (Briefs 01, 04)
