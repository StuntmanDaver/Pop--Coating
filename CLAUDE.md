# Claude Code — project guardrails

> Multi-tenant whitelabel SaaS for industrial finishing shops (powder coating, sandblasting, plating, galvanizing). **Pops Industrial Coatings** is the launch tenant (Tenant 1). Architected as multi-tenant from day 1. Built by **Cultr Ventures** for Pops; Pops is the customer.

## Canonical sources of truth (highest precedence)

These three documents are **law**. If anything in `.claude/agents/`, `.claude/skills/`, a generated suggestion, or an external tool conflicts with them — **follow the docs and surface the conflict to the user.** Do not silently override.

| Document | Role |
|---|---|
| [`PRD.md`](PRD.md) | What we're building, scope, success metrics. v3.0 (multi-tenant whitelabel pivot). |
| [`docs/DESIGN.md`](docs/DESIGN.md) | How we're building it. Architecture, full data model, modules, auth flows, roadmap, costs, risks, testing. v1.1. |
| [`docs/EXECUTION.md`](docs/EXECUTION.md) | How concurrent sub-agents accelerate the build. ~880 dispatches across 36 weeks. v1.0. |

When you start a task, **check whether it touches a decision in these docs**. If yes, follow the doc. If you think the doc is wrong, say so to the user before acting.

## Stack constraints (every agent must respect)

Hard rules — not preferences. Apply to all generated code.

- **Next.js 16** — App Router, Server Actions, `src/proxy.ts` (renamed from `middleware.ts` in Next.js 16) for multi-domain + multi-tenant routing. No Pages Router. No client-side data fetching where a Server Action / RSC works.
- **Next.js 16 specifics (DESIGN.md §102):** `cookies()` from `next/headers` is **async** — `await cookies()`. For auth checks, **always** use `supabase.auth.getUser()` (validates with auth server). **Never** `getSession()` for auth decisions — it can return stale/forged data.
- **TypeScript strict** — `tsconfig` has `"strict": true`. No `any`. No non-null assertions (`!`) without justification in a comment. Discriminated unions over loose types.
- **Tailwind v4** + **shadcn/ui** — Tailwind v4 (CSS-first config in `app/globals.css`, no `tailwind.config.ts`). shadcn primitives via CLI. Per-tenant branding via CSS variables, not hardcoded colors.
- **Supabase** — Postgres + Auth + Realtime + Storage. Pro plan. Single instance. **Multi-tenant via `tenant_id` column on every business table + RLS policy that filters by tenant.** Auth uses Supabase Auth; `tenant_id` lives in JWT **`app_metadata`** (not raw token claims).
- **RLS is non-negotiable.** Every new business table gets `tenant_id uuid not null references public.tenants(id)` + an RLS policy filtering on the `app.tenant_id()` SECURITY DEFINER helper (defined in `docs/DESIGN.md` §3.2 — reads `app_metadata.tenant_id` from the request JWT). Use `tenant_id = app.tenant_id()` in policies, **never** parse JWT inline. Service-role usage is gated by ESLint `no-restricted-imports` to: `src/modules/{settings,portal,auth}/**`, `src/shared/audit/**`, `supabase/functions/**`. **Forbidden** in `src/modules/scanning/**`.
- **Vercel** — Pro plan. Deploys + custom domains + per-tenant SSL + edge runtime where appropriate.
- **Resend** for transactional email; per-tenant from-identity with SPF/DKIM/DMARC.
- **Upstash Redis** via Vercel Marketplace for rate limiting (`@upstash/ratelimit` sliding-window).
- **Sentry** for error tracking (cross-tenant; tag every event with `tenant_id`).
- **`@react-pdf/renderer`** + **`qrcode`** for job packet PDFs.
- **`@zxing/browser`** for camera-based QR scanning. Target: iPad Safari (workstation tablets).
- **`next-intl`** for i18n. **English-only Wave 1.** Spanish lands in Wave 2+.
- **Stripe** — Wave 4 only. Per-tenant billing.
- **Cross-cutting code** lives in `src/shared/`. The canonical tree (DESIGN.md §4.4) is exactly: `audit/`, `auth-helpers/`, `db/`, `rate-limit/`, `realtime/`, `storage/`, `ui/`. Don't invent new top-level dirs without a decision.
- **Modules** live in `src/modules/<name>/` with a strict layout (DESIGN.md §4.2): `index.ts` is the only public surface; cross-module imports go through `index.ts` only (enforced via ESLint `no-restricted-imports` + `madge --circular src/modules` in CI). Wave-1 modules: `auth`, `crm`, `jobs`, `packets`, `scanning`, `timeline`, `dashboard`, `settings`, `portal`, `tags`. Wave-2: `inventory`, `quality`, `alerts`, `notifications`. Wave-3: `quotes`, `invoices`, `messaging`, `analytics`. Wave-4: `tenant-config`, `workflow-templates`, `agency-console`.
- **App routing layout** (DESIGN.md §117): `src/app/(office)/` for staff CRM/dashboards, `src/app/scan/` (NOT a route group — explicit URL `/scan`) for shop-floor PIN+scanner, `src/app/(portal)/` for customer portal, `src/app/api/webhooks/` for inbound (Resend, Stripe).
- **Project SQL helpers (DESIGN.md §3.2):** `app.tenant_id()`, `app.audience()`, `app.role()`, `app.staff_id()`, `app.workstation_id()`, `app.company_id()`, `app.set_updated_at()`, `app.has_consent_for()` (Wave 4). Plus SECURITY DEFINER wrappers for shop-staff writes: `app.validate_employee_pin`, `app.claim_workstation`, `app.record_workstation_heartbeat`, `app.release_workstation`, `app.record_scan_event`.
- **Project app helpers (DESIGN.md §4.4):** `withAudit()` HOF from `src/shared/audit/`; `requireOfficeStaff()` / `requireShopStaff()` / `requireCustomer()` from `src/shared/auth-helpers/require.ts`; `getCurrentClaims()` from `src/shared/auth-helpers/claims.ts`.
- **Auth library:** `@supabase/ssr` for cookie storage (`httpOnly`, `secure`, `sameSite=lax`, scoped to host — separate cookies for `app.*` vs `track.*`). Session refresh windows: office + customer = 30 days; **workstation = 1 hour** (stolen-tablet mitigation; tablet re-authenticates silently).
- **Hidden invariants (silent-failure landmines):**
  - **`jobs.production_status` direct UPDATE is forbidden** (DESIGN.md §4.3 Module 3). Column-level grant `REVOKE UPDATE (production_status) ON jobs FROM authenticated` enforces it. Status changes go *only* through `app.record_scan_event()`.
  - **`supabase_auth_admin` role must keep `BYPASSRLS`** — the Auth Hook depends on it. Don't modify role attributes.
  - **`app.custom_access_token_hook` must not write to any tables** (Supabase Issue #29073 deadlock). User-row linking happens in a separate `AFTER INSERT` trigger.
- **Photo upload standard:** canvas → JPEG quality 0.7, max 1024px longest edge. Applies to scanner photos and any future image uploads. Same compression for offline-queued and online uploads.
- **Package manager:** `pnpm`. Use `pnpm install`, `pnpm test`, `pnpm gen:types`, etc. Never `npm` or `yarn`.

## Sub-agent dispatch convention

Source of truth: [`docs/EXECUTION.md` §1](docs/EXECUTION.md). Summary:

- The orchestrator (you/Claude or the user-as-orchestrator) batches `Agent` tool uses in a single message for parallel execution.
- Each agent's brief should be self-contained (the agent has no conversation history).
- Agents return findings/code; orchestrator integrates and commits.
- Agent type catalog: [`docs/EXECUTION.md` §2](docs/EXECUTION.md). Each named type has a definition file in [`.claude/agents/`](.claude/agents/).
- An agent definition is a **floor**, not a ceiling. Per-dispatch briefs may add task-specific constraints; they may not weaken stack constraints.

## Planning convention (`phase-planner` + briefs)

Before dispatching the first batch of any week's work:

1. Dispatch `phase-planner` to expand `docs/EXECUTION.md` week N into per-dispatch briefs.
2. Briefs land in `docs/briefs/WEEK-NN-BRIEFS.md` (one file per week, committed).
3. Orchestrator reviews briefs; dispatches builders by copy-pasting briefs into `Agent` tool calls.
4. Briefs are point-in-time records; not amended after dispatch.

Wave contracts (template at `docs/superpowers/templates/wave-contract.md`, filled instances at `docs/contracts/WAVE-N-CONTRACT.md`) are signed off by the user before any wave begins. Ship gate dispatches all three audit agents and requires PASS on each.

## Quality gates convention (verdict-driven)

Five evaluator agents act as merge/advance gates:

- `security-auditor` — blocks on **Critical** or **High** findings.
- `code-reviewer` — blocks on **Blocker** or **Major** findings.
- `performance-auditor` — blocks on any **Blocker** finding.
- `accessibility-auditor` — blocks on any **Blocker** (WCAG 2.1 AA fail).
- `dependency-auditor` — blocks on **Critical** or **High** advisories.

Each returns a verdict on the first line of output:

```
VERDICT: <PASS | FAIL | FAIL-WITH-FOLLOW-UP>
```

`FAIL-WITH-FOLLOW-UP` requires explicit user sign-off in the dispatch brief (issue + owner + deadline). Agents do not self-grant. PR/wave-advance is gated on PASS or signed-off `FAIL-WITH-FOLLOW-UP`. The wave contract (`docs/contracts/WAVE-N-CONTRACT.md`) specifies which auditors run when.

**Enforcement:** pipe evaluator output through [`scripts/check-verdict.sh`](scripts/check-verdict.sh) to verify the verdict line is well-formed before deciding to advance. Exit 0 = PASS, exit 1 = FAIL, exit 2 = format error (agent forgot the verdict line). See [`scripts/README.md`](scripts/README.md).

## Optional runtime: ruflo (memory + swarm)

The project optionally uses two [ruflo](https://github.com/ruvnet/ruflo) plugins for orchestration features. Installation is **user-side** (Claude Code plugin marketplace), not in the repo. See [`docs/runbooks/ruflo-install.md`](docs/runbooks/ruflo-install.md) for setup.

**Installed plugins (when used):**

- `ruflo-core` — provides `mcp__claude-flow__memory_usage` for persistent memory across dispatches.
- `ruflo-swarm` — provides `mcp__claude-flow__swarm_init` / `agent_spawn` / `task_orchestrate` / `swarm_status` for parallel batch coordination.

**Other ruflo plugins are deliberately not installed** (autopilot, intelligence, agentdb, aidefence, browser, jujutsu, wasm, workflows). Adding any of them requires a project decision (ADR).

**ruflo is optional.** All 23 agents in `.claude/agents/` work without ruflo. Use the MCP tools when one of these patterns applies (full guide in the runbook):

- **Memory:** caching expensive lookups across dispatches in a wave; carrying decisions from earlier dispatches forward; wave-to-wave continuity for things not captured in canonical docs.
- **Swarm:** parallel batches that need shared state (independent parallel batches use the standard `Agent` tool batching, not swarm).

**Don't put in ruflo memory** what belongs in canonical docs (PRD/DESIGN/EXECUTION), wave contracts, or weekly briefs. Memory is for ephemeral cross-dispatch hints, not source-of-truth content.

**Memory key namespace convention:** `<wave>/<week>/<agent>/<topic>` (e.g., `wave1/week4/schema-writer/jobs-table-decisions`). Wave-end retrospectives prune stale entries.

## Repo state

- **No application code yet.** Wave 1 Week 0 pre-flight is next.
- Git repo initialized; remote `origin` → `https://github.com/StuntmanDaver/Pop--Coating.git`. Default branch `main`.
- `.claude/skills/` — 93 design/UX/process skills (pre-loaded via Claude Code skill plugins; gitignored as plugin-managed).
- `.claude/agents/` — 23 project sub-agent definitions (committed): every agent type referenced in `docs/EXECUTION.md` (catalog in §2 plus `infrastructure-builder` / `devops` / `shadcn-installer` / `design-token-integrator` cited elsewhere) plus `phase-planner` from the Tier-1 harness work.
- `docs/superpowers/specs/` — design specs for cross-cutting decisions.
- `docs/superpowers/templates/` — reusable templates (wave contracts, etc.).
- `docs/briefs/` — per-week dispatch briefs produced by `phase-planner`.
- `docs/contracts/` — per-wave contracts (filled from template; user-signed before wave starts).
- `docs/runbooks/` — operational runbooks (ruflo install, future DR/incident-response).
- `scripts/` — bash utilities (verdict parser + tests).

## What NOT to do

- Don't introduce dependencies outside the stack listed above without surfacing it as a decision.
- Don't write code yet. The current phase is planning + tooling.
- Don't bypass RLS. Ever. If you think you need to, you don't — you need an audited admin path.
- Don't invent agent type names. Use the catalog in EXECUTION.md §2.
