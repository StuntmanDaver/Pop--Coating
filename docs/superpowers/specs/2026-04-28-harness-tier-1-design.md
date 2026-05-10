# Harness Tier 1 — Design Spec

**Date:** 2026-04-28
**Status:** Approved
**Reference:** [Anthropic — Harness Design Principles for Long-Running AI Agent Applications](https://www.anthropic.com/engineering/harness-design-long-running-apps)
**Author:** David Ketchel + Claude

## 1. Goal

Reduce orchestrator (human/Claude) cognitive load and tighten quality gates around the ~880 sub-agent dispatches planned in `docs/EXECUTION.md`. Three concrete additions:

- **A. `phase-planner` agent** — expands a week's bullet-list dispatches into full, self-contained per-dispatch briefs.
- **B. Wave contract template** — explicit ship-gate criteria + pass/fail tests + out-of-scope per wave.
- **C. Audit agents promoted to gates** — `code-reviewer`, `security-auditor`, `performance-auditor` return PASS / FAIL / FAIL-WITH-FOLLOW-UP verdicts; merges gated on the verdict.

## 2. Non-goals

- Autonomous orchestrator loop. Humans still drive batch dispatches.
- 5–15 iteration cycles per dispatch (article pattern; wrong shape for our 15–40 min dispatches).
- Context-reset protocol with formal handoff files. Defer until session-length pain shows up.
- Modifying `docs/EXECUTION.md`. The catalog stays as-is; new agents are net-additive.

## 3. Article principles adopted vs deferred

| Principle | Status | Why |
|---|---|---|
| Context resets w/ structured handoff | Deferred | Need real session-length pain before designing format |
| Generator/evaluator separation | **Adopted (C)** | Audit agents already exist as advisory; promoting to gates is cheap |
| Gradable criteria | **Partially adopted (C)** | Verdict scheme is the minimum viable gradable layer |
| Iterative feedback loops | Adapted | 1 retry on FAIL, not 5–15 cycles |
| Sprint contracts | **Adopted (B)** | Wave contracts = sprint contracts at the right granularity for us |
| Planner agent | **Adopted (A)** | Highest leverage; eliminates manual brief-writing |
| Continuous harness simplification | Process commitment | Quarterly retro on what's still load-bearing |

## 4. Deliverables

### 4.1 `phase-planner` agent

Path: `.claude/agents/phase-planner.md`

**Role:** Read week N's bullet list in `docs/EXECUTION.md` plus relevant DESIGN.md/PRD sections; output a per-dispatch brief file the orchestrator can copy-paste into Agent tool calls.

**Output path:** `docs/briefs/WEEK-NN-BRIEFS.md` (committed to repo for traceability).

**Brief shape (per dispatch):**

- Dispatch ID matching EXECUTION.md (e.g., `AGENT 4.A.1`).
- Agent type from EXECUTION.md §2 catalog.
- Goal (one paragraph, self-contained — agent has no conversation history).
- Inputs: file paths to read, DESIGN.md sections, related decisions.
- Outputs: file paths to write, expected shape.
- Acceptance criteria the dispatch must satisfy (PASS condition).
- Stack constraints reminder (link to CLAUDE.md, no restating).
- Dependencies on prior dispatches (what must already exist).

**When to dispatch `phase-planner`:** before the first batch of each week's work; orchestrator reviews the briefs file before dispatching.

**Estimated impact:** turns ~2 hr of manual per-week brief writing into ~15 min of review.

### 4.2 Wave contract template

Path: `docs/superpowers/templates/wave-contract.md` (template).
Filled instances: `docs/contracts/WAVE-N-CONTRACT.md` (per wave; written before the wave starts).

**Sections in the template:**

- Wave identifier + dates.
- Ship-gate criteria (copied from PRD §10 / DESIGN.md §6).
- Out-of-scope (explicit anti-list to prevent scope creep).
- Pass/fail tests — concrete, runnable assertions (e.g., "pgTAP RLS suite passes for every Wave-N table").
- Dependencies on prior waves.
- Risk mitigations active during this wave.
- Sign-off: who approves contract before dispatching, who approves ship at end.

**Process:** orchestrator generates draft from template; user reviews and signs off; wave begins. Contract amended only via explicit decision (logged as ADR).

### 4.3 Audit agents → gates (verdict output)

All **five** evaluator agents updated: `code-reviewer.md`, `security-auditor.md`, `performance-auditor.md`, `accessibility-auditor.md`, `dependency-auditor.md`. (Initially specced as three; extended to five during Round-6 audit — the article's evaluator pattern applies to every grading agent, and partial coverage was a consistency bug.)

Each gets a top-of-output **Verdict** section before findings:

- **PASS** — no findings at the agent's blocking severity. Safe to merge / advance.
- **FAIL** — at least one finding at blocking severity. Do not merge / advance until resolved.
- **FAIL-WITH-FOLLOW-UP** — blocking findings exist but explicit user override accepts them with tracked follow-ups (issue created, owner assigned, deadline). Allowed only with user sign-off; agent does not self-grant this verdict.

**Blocking severities per agent:**

- `security-auditor`: any **Critical** or **High**.
- `code-reviewer`: any **Blocker** or **Major**.
- `performance-auditor`: any **Blocker** (added explicit severity scale during Round-6 — wasn't defined before).
- `accessibility-auditor`: any **Blocker** (WCAG 2.1 AA fail).
- `dependency-auditor`: any **Critical** or **High** advisory (added explicit severity scale during Round-6).

**Convention:** before any wave ship gate, dispatch all five; require PASS (or FAIL-WITH-FOLLOW-UP signed off by user). Per-batch / per-module gates use a subset (see wave contract template's "Quality-gate dispatch plan").

## 5. CLAUDE.md updates

Add two short sections:

- **Planning convention** — pointer to `phase-planner` + `docs/briefs/<week>` location.
- **Quality gates convention** — verdict scheme + which auditors gate which decisions.

## 6. Done state

- `.claude/agents/phase-planner.md` exists.
- `docs/superpowers/templates/wave-contract.md` exists.
- `code-reviewer.md`, `security-auditor.md`, `performance-auditor.md` each output a Verdict at the top.
- `CLAUDE.md` references the planner + verdict conventions.
- Spec committed and pushed.
- 23 agents in `.claude/agents/` (was 22).

## 7. Risks

1. **Premature scaffolding.** No code exists yet; we're guessing at the orchestrator's bottleneck. Mitigation: revisit after Week 1; remove what isn't load-bearing per article principle 7.
2. **Brief-file drift.** Briefs in `docs/briefs/` reflect the orchestrator's intent at dispatch time; if EXECUTION.md changes after dispatching, briefs lag. Mitigation: briefs are point-in-time records, not living docs; rewrite for next iteration.
3. **Verdict gaming.** Agents could grade leniently to declare PASS. Mitigation: blocking severity thresholds are objective (Critical / High / Blocker), not subjective. User retains override.

## 8. Out of scope

- Modifying `docs/EXECUTION.md`.
- Changing the `.claude/agents/` files for builders (`frontend-builder`, etc.).
- Autonomous loops or context resets.
- Adding metrics dashboards or telemetry.

## 8.1 Round-7 hardening — verdict parser

The Round-6 verdict scheme was a soft contract: if an evaluator forgot the `VERDICT:` line, the orchestrator might miss it. Round-7 adds a parser to enforce the contract.

**Added:**

- `scripts/check-verdict.sh` — bash parser. Reads stdin or file; verifies first non-empty line matches `VERDICT: PASS | FAIL | FAIL-WITH-FOLLOW-UP`. Exit codes: 0 PASS, 1 FAIL, 2 format error, 64 usage error. Strips `\r` for CRLF tolerance. Disambiguates `FAIL-WITH-FOLLOW-UP` from `FAIL` via pattern ordering. Never auto-grants `FAIL-WITH-FOLLOW-UP` — requires `--accept-followup` (caller opt-in, gated by user sign-off in dispatch brief).
- `scripts/test-check-verdict.sh` — 22-case test suite covering all valid verdicts, malformed inputs (empty, lowercase, unknown word, missing space, PASSED variant), Windows line endings, file mode, stdin mode, multi-arg/usage errors. All 22 pass.
- `scripts/README.md` — usage, exit codes, integration points.

**Updated:**

- All 5 evaluator agents — explicit "your output is parsed by `scripts/check-verdict.sh`" reminder added so the contract isn't silently broken.
- `CLAUDE.md` — Quality-gates section now references the parser as the enforcement layer.
- `docs/superpowers/templates/wave-contract.md` — Quality-gate dispatch plan now states orchestrator pipes outputs through the parser.

**Why bash and not TypeScript:** no `package.json` exists yet (no code as of Wave-1 Week-0). Bash works without setup. Future port to a `pnpm`-runnable script is fine but not required.

**Test discipline:** any change to `check-verdict.sh` must keep `bash scripts/test-check-verdict.sh` green. The test file is the regression suite.

## 9. Files changed

```
.claude/agents/phase-planner.md                                            [new]
.claude/agents/code-reviewer.md                                            [edit: add Verdict]
.claude/agents/security-auditor.md                                         [edit: add Verdict]
.claude/agents/performance-auditor.md                                      [edit: add Verdict + severity scale (Round 6)]
.claude/agents/accessibility-auditor.md                                    [edit: add Verdict (Round 6)]
.claude/agents/dependency-auditor.md                                       [edit: add Verdict + severity scale (Round 6)]
docs/superpowers/templates/wave-contract.md                                [new]
docs/superpowers/specs/2026-04-28-harness-tier-1-design.md                 [new — this file]
CLAUDE.md                                                                  [edit: planner + verdict sections]
docs/briefs/.gitkeep                                                       [new]
docs/contracts/.gitkeep                                                    [new]
scripts/check-verdict.sh                                                   [new — Round 7]
scripts/test-check-verdict.sh                                              [new — Round 7]
scripts/README.md                                                          [new — Round 7]
```

## 10. Round-6 audit findings (resolved)

After initial commit, deeper audit found 9 issues:

| # | Severity | Issue | Resolution |
|---|---|---|---|
| 1 | Critical | `performance-auditor` verdict referenced "Blocker" but no severity scale defined | Added explicit Blocker/Major/Minor/Nit scale |
| 2 | Major | `accessibility-auditor` is an evaluator but had no verdict | Added verdict block (PASS/FAIL/FAIL-WITH-FOLLOW-UP) |
| 3 | Major | `dependency-auditor` is an evaluator but had no formal severity scale or verdict | Added Critical/High/Medium/Low scale + verdict block |
| 4 | Major | Wave-contract template only mentioned 3 of 5 evaluators | Updated "Quality-gate dispatch plan" table to cover all 5 with timing |
| 5 | Major | Spec §4.3 listed only 3 audit agents updated | Updated to 5; documented as Round-6 extension |
| 6 | Major | All 5 audit agents' "Deliverables format" sections didn't reference verdict-first ordering | Each section now opens with "first line is the VERDICT: line" |
| 7 | Minor | `phase-planner` brief-length cap of 30 lines too tight for realistic dispatches | Adjusted to 60 lines |
| 8 | Minor | `phase-planner` didn't address always-on agents | Added "What you don't brief" section listing `dependency-auditor`, `research-verifier`, `migration-applier`, `type-generator` |
| 9 | Minor | CLAUDE.md repo-state phrasing "EXECUTION.md §2 + phase-planner" was inaccurate (§2 lists only 18) | Rewrote: "every agent type referenced in EXECUTION.md (catalog in §2 plus 4 cited elsewhere) plus phase-planner" |
