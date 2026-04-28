# Runbook — Install ruflo (selective)

**Audience:** anyone setting up this project for orchestrator work in Claude Code.
**Scope:** install only `ruflo-core` (MCP server + memory tools) and `ruflo-swarm` (swarm coordination). Other ruflo plugins are **not** in scope.
**Why:** persistent memory across dispatches and swarm coordination — see [`docs/superpowers/specs/2026-04-28-ruflo-runtime-integration-design.md`](../superpowers/specs/2026-04-28-ruflo-runtime-integration-design.md) for the rationale and what was rejected.

## Install steps

Run these slash commands in **your** Claude Code session (they configure your local Claude Code, not the repo):

```
/plugin marketplace add ruvnet/ruflo
/plugin install ruflo-core@ruflo
/plugin install ruflo-swarm@ruflo
```

**Do NOT install** other ruflo plugins (`ruflo-autopilot`, `ruflo-intelligence`, `ruflo-agentdb`, `ruflo-aidefence`, `ruflo-browser`, `ruflo-jujutsu`, `ruflo-wasm`, `ruflo-workflows`, etc.) without surfacing as a project decision (ADR). Each adds capabilities + assumptions; we deliberately scoped to the two we have a use case for.

## Verify the install

After plugins install, in a fresh Claude Code session in this repo:

1. Confirm the MCP server is reachable: `/status` should list ruflo plugins as active.
2. Confirm the new tools exist by name (Claude Code surfaces them as deferred tools you can fetch via `ToolSearch`):
   - `mcp__claude-flow__memory_usage` (memory operations)
   - `mcp__claude-flow__swarm_init`, `agent_spawn`, `task_orchestrate`, `swarm_status`
3. Run a smoke test of memory:
   - Write: `mcp__claude-flow__memory_usage` with `{ action: "store", key: "smoke-test", value: "hello" }`
   - Read back: `mcp__claude-flow__memory_usage` with `{ action: "retrieve", key: "smoke-test" }`
   - Delete: `mcp__claude-flow__memory_usage` with `{ action: "delete", key: "smoke-test" }`

If any step fails, see ruflo's docs at https://github.com/ruvnet/ruflo or run `/doctor` (provided by `ruflo-core`).

## When to use ruflo's tools (orchestrator guide)

The MCP tools become *available* after install. They are **not required** for any of our 23 agent dispatches — every agent works without ruflo. Use ruflo when one of these patterns applies:

### Persistent memory (`mcp__claude-flow__memory_usage`)

**Use it for:**
- Caching expensive lookups across dispatches in a wave (e.g., "ruflo's confirmed Supabase Auth Hook constraints in week 2 dispatch 2.A.3 — don't re-verify in week 5").
- Surfacing decisions made in earlier dispatches to later ones (e.g., "we picked option B for X in week 4 — week 6 builders should know").
- Wave-to-wave continuity for things not captured in PRD/DESIGN/EXECUTION (e.g., known-flaky tests, Pops-specific quirks discovered during build).

**Don't use it for:**
- Anything that belongs in canonical docs (PRD, DESIGN, EXECUTION) — write it there instead.
- Anything that belongs in a wave contract or weekly brief — those files are the source of truth.
- Storing secrets or PII — memory is local but not encrypted.

**Key conventions** (when you do use it):
- Namespace keys: `<wave>/<week>/<agent>/<topic>` (e.g., `wave1/week4/schema-writer/jobs-table-decisions`).
- Always include a TTL or explicit cleanup plan; don't let stale notes accumulate forever.
- After a wave ships, prune memory belonging to that wave that isn't worth carrying forward.

### Swarm coordination (`mcp__claude-flow__swarm_init`, `agent_spawn`, `task_orchestrate`)

**Use it for:**
- Parallel batches where agents need shared state (e.g., 5 frontend-builder dispatches building related modules — they can signal "I'm done with X" so a downstream test-writer knows when to start).
- Coordination that's awkward in our default "orchestrator manually batches Agent calls" model.

**Don't use it for:**
- Single-agent dispatches (overhead with no benefit).
- Truly independent parallel batches (our manual `Agent` tool batching already does this).
- Replacing the orchestrator's role — keep humans in the loop for go/no-go decisions.

**Honest caveat:** swarm coordination is the more speculative of the two features. We adopted it because the user explicitly asked for it; expect to evaluate after Wave-1 retrospective whether it earned its place (per the article's principle 7: continuous harness simplification).

## Uninstall

If you decide ruflo isn't earning its keep:

```
/plugin uninstall ruflo-swarm@ruflo
/plugin uninstall ruflo-core@ruflo
```

Then revert the relevant CLAUDE.md / agent file edits if you adopted any ruflo-aware patterns. Our 23 native agents continue to work unchanged because they were authored to be ruflo-optional.

## Failure modes and fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| `/plugin marketplace add` fails | Not running in Claude Code, or older version without plugin support | Update Claude Code to a version that supports plugin marketplaces |
| MCP tools missing after install | MCP server didn't start | `/doctor` from `ruflo-core`; restart Claude Code |
| `memory_usage` write succeeds but read returns empty | Different session/scope | Check ruflo's memory namespace docs; ours uses single-namespace per session |
| Tool calls cost-spiking unexpectedly | Swarm fan-out larger than expected | Reduce `maxAgents` in `swarm_init`; review swarm topology choice |

## References

- Design spec: [`docs/superpowers/specs/2026-04-28-ruflo-runtime-integration-design.md`](../superpowers/specs/2026-04-28-ruflo-runtime-integration-design.md)
- Upstream: https://github.com/ruvnet/ruflo
- Earlier rationale for *not* adopting ruflo's agent definitions: [`docs/superpowers/specs/2026-04-27-ruflo-agent-integration-design.md`](../superpowers/specs/2026-04-27-ruflo-agent-integration-design.md) §3 (rejected approach).
