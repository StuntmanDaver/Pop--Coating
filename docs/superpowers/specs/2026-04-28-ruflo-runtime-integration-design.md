# ruflo Runtime Integration (Selective) — Design Spec

**Date:** 2026-04-28
**Status:** Approved (user explicitly approved memory + swarm features)
**Reference:** [ruvnet/ruflo](https://github.com/ruvnet/ruflo) — npm package `claude-flow` v3.6.5
**Author:** David Ketchel + Claude
**Related:** [`2026-04-27-ruflo-agent-integration-design.md`](2026-04-27-ruflo-agent-integration-design.md) — earlier decision to *not* adopt ruflo's agent definitions; this spec covers a *different* scope (runtime tools).

## 1. Goal

Add two ruflo capabilities to the project's orchestration toolkit:

- **Persistent memory across dispatches** (`mcp__claude-flow__memory_usage`) — useful in a 36-week build for caching expensive lookups, surfacing prior-dispatch decisions, wave-to-wave continuity.
- **Swarm coordination** (`mcp__claude-flow__swarm_init`, `agent_spawn`, `task_orchestrate`, `swarm_status`) — parallel batch dispatches with shared state.

## 2. Non-goals

- Adopting ruflo's 107 agent definitions. Our 23 native agents are tuned to the project; importing ruflo's agents was deliberately rejected on 2026-04-27 (see related spec §3).
- Installing other ruflo plugins (`ruflo-autopilot`, `ruflo-intelligence`, `ruflo-agentdb`, `ruflo-aidefence`, `ruflo-browser`, `ruflo-jujutsu`, `ruflo-wasm`, `ruflo-workflows`). Each adds capabilities + assumptions we haven't justified.
- Making any existing agent file *require* ruflo MCP tools. Existing 23 agents stay ruflo-optional.
- Replacing the orchestrator (human/Claude). Manual dispatch model from `docs/EXECUTION.md` §1 is unchanged.

## 3. Install scope

Two ruflo plugins, installed via Claude Code slash commands (user-side, not committed-to-repo):

```
/plugin marketplace add ruvnet/ruflo
/plugin install ruflo-core@ruflo      # MCP server + memory tools
/plugin install ruflo-swarm@ruflo     # swarm coordination
```

**Plugins are user-Claude-Code-level**, not project-local. The repo doesn't gain dependencies. Anyone cloning the repo and wanting to use ruflo features must run the install themselves (runbook walks them through).

## 4. Why these two and not more

| Plugin | Decision | Reason |
|---|---|---|
| `ruflo-core` | **Install** | Required for memory tools |
| `ruflo-swarm` | **Install** | User-requested |
| `ruflo-autopilot` | Skip | Autonomous `/loop` competes with manual orchestration |
| `ruflo-intelligence` | Skip | Self-learning patterns; speculative gain over our manual feedback loop |
| `ruflo-agentdb` | Skip | HNSW vector search; we don't have a knowledge corpus needing semantic retrieval at this stage |
| `ruflo-aidefence` | Skip | PII detection / prompt injection — useful but redundant with our `security-auditor` for code paths; can add later if surface expands |
| `ruflo-browser` | Skip | Playwright automation; we already use Playwright directly via `e2e/` |
| `ruflo-jujutsu` | Skip | Git diff analysis; we have `code-reviewer` |
| `ruflo-wasm` | Skip | Sandboxed agent creation; out of scope |
| `ruflo-workflows` | Skip | Workflow templates; we have `phase-planner` + `EXECUTION.md` |

Skipping these is reversible — install if a concrete use case emerges; document as ADR.

## 5. Deliverables (this spec)

- **`docs/runbooks/ruflo-install.md`** — install steps + verification + when-to-use guide for orchestrators.
- **`CLAUDE.md`** — short section on ruflo capabilities (post-install) and convention for using memory/swarm.
- **This design spec** capturing rationale + scope.

**No changes** to:
- The 23 agent files (stay ruflo-optional).
- `phase-planner`, `wave-contract` template, verdict parser (work unchanged with or without ruflo).
- `docs/EXECUTION.md` (orchestration model preserved).

## 6. Conventions for ruflo memory namespace

When using `mcp__claude-flow__memory_usage`:

- **Key format:** `<wave>/<week>/<agent>/<topic>` (e.g., `wave1/week4/schema-writer/jobs-table-decisions`).
- **TTL or explicit cleanup:** every entry has either an expiry or a documented cleanup trigger (wave-end retrospective).
- **Don't store** what belongs in canonical docs, wave contracts, weekly briefs, or anywhere else with permanent provenance. Memory is for ephemeral cross-dispatch hints.
- **Don't store** secrets or PII. Memory is local but not encrypted.

## 7. Conventions for swarm coordination

When using `mcp__claude-flow__swarm_init` / `agent_spawn` / `task_orchestrate`:

- **Use only when shared state across parallel agents is genuinely needed.** Independent parallel batches use the standard manual `Agent` tool batching.
- **Cap `maxAgents` at 5** in initial use; revisit after the first swarm batch retrospective.
- **Topology default:** `mesh` (article-recommended for most cases).
- **Single-agent dispatches use the standard `Agent` tool**, never swarm — overhead with no benefit.

## 8. Risks

| Risk | Mitigation |
|---|---|
| ruflo runtime drift (frequent releases) breaks our integration | Pin to a specific plugin version once we hit any breakage; document in runbook |
| Memory becomes a dumping ground; stale entries pollute future dispatches | Wave-end retrospective explicitly prunes; namespace convention forces structure |
| Swarm fans out to N agents and N× the API cost without N× the value | Cap `maxAgents`; review costs after first swarm dispatch; can disable swarm without affecting other work |
| Orchestrators learn ruflo + our model = cognitive overhead | Runbook explicitly says "use only when X applies"; default remains manual orchestration |
| Future contributor unaware ruflo is optional, builds dependency on its tools | All 23 agent files remain ruflo-optional; `code-reviewer` flags any agent that requires `mcp__claude-flow__*` without justification |

## 9. Continuous-simplification commitment

Per the article we integrated for Tier-1 harness work (§7 "Iterative harness simplification"):

> Every component in a harness encodes an assumption about what the model can't do on its own. Re-examine quarterly: remove what isn't load-bearing.

ruflo is added on the assumption that 36-week build will hit cross-dispatch coherence + parallel-batch coordination needs that warrant a runtime tool. **If Wave-1 retrospective shows we used neither memory nor swarm meaningfully**, we uninstall both plugins and remove this spec from the canon. No sunk-cost.

## 10. Done state

- [x] `docs/runbooks/ruflo-install.md` written.
- [x] `CLAUDE.md` updated with ruflo capabilities section.
- [x] This spec written.
- [ ] **User runs the three slash commands** (`/plugin marketplace add ruvnet/ruflo`, etc.) to install — this is user-side, not in the repo.
- [ ] **User runs the smoke test** in the runbook to verify the MCP tools are reachable.
- [ ] First real use of memory or swarm (in Week 1+) is captured in a brief or contract entry so we can evaluate at Wave-1 retro.

## 11. Files changed

```
docs/runbooks/ruflo-install.md                                          [new]
docs/superpowers/specs/2026-04-28-ruflo-runtime-integration-design.md   [new — this file]
CLAUDE.md                                                               [edit: add ruflo capabilities section]
```
