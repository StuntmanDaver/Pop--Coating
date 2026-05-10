# Sub-Agent Catalog — Design Spec & Build Log

**Date:** 2026-04-27
**Status:** ✅ Implemented (no plan phase needed; scope was small enough to execute inline)
**Author:** David Ketchel + Claude

> **Title note:** this spec was originally scoped as "ruflo agent integration" — adopting agents from [ruvnet/ruflo](https://github.com/ruvnet/ruflo) into `.claude/agents/`. After meticulous review (see §3), that approach was rejected in favor of authoring native agents matching the existing EXECUTION.md §2 catalog. The original ruflo plan is preserved in §3 as the rejected alternative.

---

## 1. Goal (final)

Author Pops--Coating's full sub-agent catalog as Claude Code subagent definition files in `.claude/agents/`, matching the agent type names used in `docs/EXECUTION.md`, before Week 0 begins. Plus a root `CLAUDE.md` with canonical-source guardrails and stack constraints every agent inherits.

## 2. Non-goals

- Importing ruflo's runtime, swarm coordination, MCP layer, or RAG infrastructure.
- Vendoring ruflo source into this repo.
- Adopting ruflo's agent definitions directly.
- Running any agent autonomously. The orchestration model from `docs/EXECUTION.md` §1 (orchestrator dispatches `Agent` tool batches) is unchanged.
- Inventing agent type names that aren't already referenced in `docs/EXECUTION.md`.

## 3. Decision history

### Original proposal (rejected)

Adopt ~15–25 ruflo agents from `/tmp/ruflo-research/.claude/agents/` (107 candidates) into this repo, plus author 8–12 Pops-native agents like `rls-policy-writer`, `scanner-component-builder`. **Rejected** during a "meticulous double-check" because:

1. **Inventing names creates EXECUTION.md drift.** EXECUTION.md §2 already names 18 agent types (`schema-writer`, `backend-builder`, `frontend-builder`, etc.). Inventing `rls-policy-writer` would make EXECUTION.md dispatch references unresolvable.
2. **Ruflo agent quality is uneven.** Many ruflo files are 5-line stubs (e.g., `database-specialist.md`); the polished ones are mostly generic best-practices already enforced by strict TS + ESLint + DESIGN.md.
3. **Spec drift surface.** Every adopted external agent is a small surface for conflict with PRD/DESIGN/EXECUTION over a 36-week build.
4. **Time pressure.** Pops is a paying Cultr Ventures customer with a Week 13 ship gate. 4–6 hours auditing third-party prompts before writing any code is yak-shaving.

### Final approach (executed)

- **No ruflo touch.** `/tmp/ruflo-research` deleted after research complete.
- **Author 19 agents** matching every agent-type name referenced in `docs/EXECUTION.md` (the 18 in §2's catalog table + `infrastructure-builder` referenced elsewhere).
- **Each agent file** is ~50–80 lines, behavior-focused, references `CLAUDE.md` for stack constraints rather than restating them.
- **Add `CLAUDE.md`** at repo root: canonical-source rule + stack constraints + dispatch convention pointer.

## 4. Agent catalog (final, shipped — 22 agents)

All in `.claude/agents/<name>.md`. Frequency = reference count in `docs/EXECUTION.md`.

| Agent | Frequency | Role |
|---|---:|---|
| `frontend-builder` | 101 | Next.js 16 pages/components, Server Actions, shadcn UI |
| `test-writer` | 85 | pgTAP / Vitest / Playwright, framework choice + CI policy baked in |
| `backend-builder` | 73 | Server Actions, Supabase queries, RLS-aware patterns, module structure |
| `schema-writer` | 25 | SQL migrations + RLS using `app.tenant_id()` helper |
| `docs-writer` | 12 | READMEs, runbooks, ADRs |
| `deployment-agent` | 12 | Vercel deploys, env vars, per-tenant domains |
| `performance-auditor` | 10 | Lighthouse, query EXPLAIN, bundle, Realtime channels |
| `security-auditor` | 9 | Service-role allowlist, RLS, tenant isolation, secrets, injection |
| `edge-function-builder` | 8 | Supabase Edge Functions in Deno (cron + webhooks) |
| `type-generator` | 7 | `pnpm gen:types` → `src/shared/db/types.ts` |
| `research-verifier` | 7 | Verifies vendor APIs against current docs (Context7, WebFetch) |
| `code-reviewer` | 4 | Quality + module-boundary enforcement (madge, ESLint barrel rule) |
| `migration-applier` | 3 | Applies migrations sequentially to dev DB |
| `accessibility-auditor` | 3 | WCAG 2.1 AA, keyboard, contrast, iPad ergonomics |
| `seed-script-writer` | 3 | Multi-tenant deterministic test fixtures |
| `devops` | 2 | Wave-4 tenant onboarding: seed, brand, template, domain, email identity |
| `i18n-extractor` | 2 | Pulls strings to `src/messages/en/<namespace>.json` |
| `dependency-auditor` | 2 | `pnpm audit`, version drift, license compatibility |
| `infrastructure-builder` | 2 | Cross-cutting libs in `src/shared/`: db, sentry, resend, rate-limit, audit |
| `screenshot-comparer` | 1 | Playwright visual regression in `e2e/visual/`, iPad/desktop viewports |
| `shadcn-installer` | 1 | Adds shadcn/ui primitives to `src/shared/ui/` via CLI, Tailwind v4-compatible |
| `design-token-integrator` | 1 | Translates brand into CSS variables + Tailwind v4 `@theme`; per-tenant in Wave 4 |

## 5. CLAUDE.md (shipped)

Path: `/CLAUDE.md`. Contents:

1. Project tagline + Cultr Ventures / Pops framing.
2. Canonical sources of truth: PRD.md / docs/DESIGN.md / docs/EXECUTION.md.
3. Agent-precedence rule: agents are tools, docs are law, surface conflicts.
4. **Stack constraints** block (the canonical block agents reference): Next.js 16 / TS strict / Tailwind v4 / shadcn / Supabase + RLS + `tenant_id` / Vercel / Resend / Upstash / Sentry / `@react-pdf/renderer` / `@zxing/browser` / `next-intl` / Stripe (Wave 4).
5. Sub-agent dispatch convention pointer to EXECUTION.md §1.
6. Repo state: no code yet, no `.git`, 93 skills loaded, agents catalog in `.claude/agents/`.
7. **What NOT to do** list: `git init` is Week 0 work; no new dependencies without surfacing; no code yet; never bypass RLS; don't invent agent type names.

## 6. Done state (achieved)

- ✅ `CLAUDE.md` at repo root.
- ✅ `.claude/agents/` populated with **22 agent files** (initial 19 + `devops` + `shadcn-installer` + `design-token-integrator` added during meticulous-audit passes).
- ✅ All 22 files have valid frontmatter (`name:` + `description:`) and substantive prompt bodies.
- ✅ Every agent name referenced in `docs/EXECUTION.md` resolves to a real file. Zero orphan references.
- ✅ Spec doc updated to reflect actual scope.
- ✅ `/tmp/ruflo-research` deleted.

## 6.1 Meticulous-audit findings (resolved)

After initial draft, a second-pass audit against PRD/DESIGN/EXECUTION found 12 issues. All resolved:

| # | Severity | Issue | Resolution |
|---|---|---|---|
| 1 | Critical | RLS pattern used inline `auth.jwt() ->> 'tenant_id'` | Switched to `app.tenant_id()` helper (DESIGN §3.2); `app_metadata` not raw claims |
| 2 | Critical | Path convention `src/lib/` invented | Replaced with `src/shared/` per DESIGN §4.4; updated db/sentry/resend/rate-limit/auth/audit/feature-flags surfaces |
| 3 | Critical | Service-role usage rule too vague ("audited admin paths") | Replaced with DESIGN §199 explicit allowlist: `settings`/`portal`/`auth` modules + `shared/audit` + `supabase/functions`; forbidden in `scanning` |
| 4 | Critical | Missing agent type `devops` (used in EXECUTION §5.5 Wave 4) | Added `.claude/agents/devops.md` |
| 4b | Critical | Missing `shadcn-installer` and `design-token-integrator` (cited in EXECUTION §6 always-on agents, escaped first regex pass) | Added both files; catalog grew 19 → 22 final |
| 5 | Major | Package manager `npm` used | Replaced with `pnpm` in test-writer, dependency-auditor, type-generator, infrastructure-builder, frontend-builder, backend-builder; CLAUDE.md asserts `pnpm` |
| 6 | Major | `tests/visual/baselines/` invented | Replaced with `e2e/visual/` per DESIGN §110 |
| 7 | Major | CI test policy not captured | test-writer now states: lint + typecheck + pgTAP + Vitest on every PR; Playwright nightly + main only |
| 8 | Major | Module-structure conventions missing | frontend-builder, backend-builder, code-reviewer now reference DESIGN §4.2: `index.ts` barrel, `actions.ts`, `queries.ts`, `schemas.ts`, internal `lib/`, ESLint `no-restricted-imports`, `madge --circular` in CI |
| 9 | Major | `set_updated_at()` missing schema prefix | Corrected to `app.set_updated_at()` per DESIGN §289 |
| 10 | Major | i18n path `messages/<locale>.json` wrong | Corrected to `src/messages/<locale>/<namespace>.json` (per-namespace files) per DESIGN §1768 |
| 11 | Minor | Phantom `tenant-routing-builder` reference in deployment-agent | Removed; routes to `infrastructure-builder` or escalation |
| 12 | Minor | CLAUDE.md service-role rule too loose | Tightened to explicit allowlist matching DESIGN §199 |

### 6.2 Round-4 deeper-audit findings (resolved)

After the user requested another deep pass, sampling §3.2, §4.4, §117, §161, §224, §2105, §2113, §1450:

| # | Severity | Issue | Resolution |
|---|---|---|---|
| 13 | Critical | `schema-writer` told to write 4 RLS policies including `delete` | DESIGN §224, §2105: hard deletes forbidden, soft-delete via `archived_at`. Switched to 3 policies (select/insert/update) + mandatory `archived_at` column |
| 14 | Critical | `infrastructure-builder` placed `proxy.ts` at repo root | DESIGN §161: `src/proxy.ts`. Fixed and added "renamed from middleware.ts" reference |
| 15 | Critical | `infrastructure-builder` invented `src/shared/` subdirs (`sentry/`, `resend/`, `auth/`, `feature-flags/`) | Replaced with canonical DESIGN §4.4 tree: `audit/`, `auth-helpers/`, `db/`, `rate-limit/`, `realtime/`, `storage/`, `ui/` |
| 16 | Major | Agents ignored project helpers (`withAudit`, `requireOfficeStaff`, `getCurrentClaims`, `app.audience`/`role`/`staff_id`/`workstation_id`/`company_id`) | Added to `CLAUDE.md` canonical helper list; cited in `backend-builder`, `schema-writer`, `security-auditor` |
| 17 | Major | SECURITY DEFINER wrapper pattern not surfaced | DESIGN §2113: shop-staff writes go through `app.claim_workstation`/`validate_employee_pin`/`record_scan_event`/etc. Added rule to `schema-writer` and `backend-builder` |
| 18 | Major | Missing Next.js 16 specifics: `await cookies()`, `getUser()` over `getSession()` | DESIGN §102. Added to `CLAUDE.md`, `backend-builder`, `security-auditor` |
| 19 | Major | Wrong rate-limiter names (`signinLimiter`, only 2 listed) | DESIGN: canonical four are `signInLimiter`, `magicLinkLimiter`, `scannerLimiter`, `publicLimiter`. Fixed in `infrastructure-builder` |
| 20 | Minor | Route-group structure missing | DESIGN §117: `(office)` route group, `scan/` (NOT a group), `(portal)` route group, `api/webhooks/`. Added to `frontend-builder` and `CLAUDE.md` |

### 6.3 Round-5 deeper-audit (§4.3 module deep-specs sweep)

| # | Severity | Issue | Resolution |
|---|---|---|---|
| 21 | Critical | Hidden invariant: `jobs.production_status` direct UPDATE forbidden (column-level grant revoked) — naive update would silent-fail at DB | Added to CLAUDE.md hidden-invariants block, backend-builder hard rules, security-auditor §3.5 (Critical finding) |
| 22 | Major | Auth library + session windows undocumented in agents | Added to CLAUDE.md: `@supabase/ssr`, 30-day office/customer, 1-hour workstation refresh |
| 23 | Major | Photo compression standard undocumented (canvas → JPEG q=0.7 / 1024px) | Added to CLAUDE.md and frontend-builder hard rules |
| 24 | Major | `supabase_auth_admin` BYPASSRLS dependency undocumented | Added to CLAUDE.md hidden-invariants and security-auditor §3.5 |
| 25 | Major | `app.custom_access_token_hook` no-table-writes constraint (Supabase Issue #29073) undocumented | Added to CLAUDE.md hidden-invariants and security-auditor §3.5 |
| 26 | Deferred | PWA service-worker scoping `/scan/*` only — module-5-specific, belongs in per-dispatch brief | Documented for Week-1 Module-5 dispatch brief; not added to agents |

## 7. What didn't ship (intentionally)

- **`docs/AGENTS.md` mapping doc** — unnecessary; `docs/EXECUTION.md` §2 + `.claude/agents/` filename match makes the lookup direct.
- **Smoke-test dispatch** — no code or env exists yet to dispatch against. First real dispatch happens in Week 1; that's the smoke test.
- **EXECUTION.md edits** — no agent rename happened (agent files match existing names exactly).
- **Git commit** — repo is not a git repo yet; init is deliberately a Week 0 step.

## 8. Risks & follow-ups

1. **Stack-constraint drift.** Agent files reference `CLAUDE.md` for stack rules. If `CLAUDE.md` evolves, the reference still resolves; if individual agents accumulate redundant restatements, they may drift. **Mitigation:** when editing an agent, prefer linking to `CLAUDE.md` over restating; add a periodic agent-file review to the runbook backlog.
2. **EXECUTION.md drift.** If a future EXECUTION.md edit invents a new agent type name, the catalog goes stale. **Mitigation:** add to the docs-update runbook: "When you add an agent type to EXECUTION.md §2, also create the corresponding `.claude/agents/<name>.md` file."
3. **Per-dispatch brief redundancy.** Orchestrators may re-explain stack rules in each dispatch. **Mitigation:** dispatch convention should reference `CLAUDE.md` + the agent file by name; brief stays task-focused.
4. **First-dispatch validation deferred.** The agents have not been tested in actual dispatches. First Week 1 batches will surface gaps. **Mitigation:** treat Week 1's first batch as a calibration pass; expect to refine 1–3 agent files based on actual output quality.

## 9. Files changed in this work

```
CLAUDE.md                                                              [new]
.claude/agents/accessibility-auditor.md                                [new]
.claude/agents/backend-builder.md                                      [new]
.claude/agents/code-reviewer.md                                        [new]
.claude/agents/dependency-auditor.md                                   [new]
.claude/agents/deployment-agent.md                                     [new]
.claude/agents/design-token-integrator.md                              [new]
.claude/agents/devops.md                                               [new]
.claude/agents/docs-writer.md                                          [new]
.claude/agents/edge-function-builder.md                                [new]
.claude/agents/frontend-builder.md                                     [new]
.claude/agents/i18n-extractor.md                                       [new]
.claude/agents/infrastructure-builder.md                               [new]
.claude/agents/migration-applier.md                                    [new]
.claude/agents/performance-auditor.md                                  [new]
.claude/agents/research-verifier.md                                    [new]
.claude/agents/schema-writer.md                                        [new]
.claude/agents/screenshot-comparer.md                                  [new]
.claude/agents/security-auditor.md                                     [new]
.claude/agents/seed-script-writer.md                                   [new]
.claude/agents/shadcn-installer.md                                     [new]
.claude/agents/test-writer.md                                          [new]
.claude/agents/type-generator.md                                       [new]
docs/superpowers/specs/2026-04-27-ruflo-agent-integration-design.md    [updated]
```
