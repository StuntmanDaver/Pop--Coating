# Phase 1: Foundation - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Repo scaffold, multi-tenant schema, and all three auth audiences (office / workstation / customer portal) — the platform skeleton every subsequent phase builds on. No business logic, no CRM, no scanner UI. Phase 1 ends when a developer can run `pnpm install && pnpm dev`, all three auth audiences can sign in with correct JWT claims, cross-tenant RLS is enforced, and Tenant 1 (Pops Industrial Coatings) exists in the live Supabase Cloud project.

**Requirements in scope:** INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05

</domain>

<decisions>
## Implementation Decisions

### Resend + Auth Email Routing

- **D-01:** Supabase Auth routes ALL its own emails (magic links, staff invites, password resets) through Resend SMTP — not Supabase's built-in email service. Configure Supabase Auth SMTP settings to point to Resend in Phase 1.
- **D-02:** From address for all auth emails: `noreply@popscoating.com`. SPF/DKIM/DMARC verified via Resend for this address.
- **D-03:** Single Resend API key for all environments (local dev, preview, production). No test-mode/live-mode split. RESEND_API_KEY in `.env.local` and Vercel environment variables.

### Phase 1 Workstation Auth Scope

- **D-04:** Phase 1 delivers three layers for workstation auth:
  1. **DB schema:** `workstations` table (schema per `docs/DESIGN.md §3.3`)
  2. **SECURITY DEFINER functions:** `app.claim_workstation()`, `app.record_workstation_heartbeat()`, `app.release_workstation()` (per `docs/DESIGN.md §3.2`)
  3. **Server action:** `createWorkstation` in `src/modules/settings/` — creates the synthetic Supabase user (`workstation-{uuid}@workstations.{tenant.slug}.local`), inserts the `workstations` row, and returns an enrollment token/QR data for later use by the ceremony UI in Phase 3
  - The tablet-side ceremony UI (tablet scans admin QR, confirms enrollment) is **Phase 3** (SCAN-03). Phase 1 success criterion AUTH-02 is verified by running `createWorkstation` via test/script, not through a UI.
- **D-05:** Workstation session refresh: **silent via `@supabase/ssr`** — near-expiry detected automatically, refresh token used to extend the session without any UI interruption on the shop floor.
- **D-06:** PIN idle timeout (4-hour idle per shift) is **Phase 3** — lives with the scanner UI and scan event attribution logic, not Phase 1 infrastructure.

### Branch DB + CI Setup

- **D-07:** Supabase branch databases are set up in Phase 1 for every PR. Each PR gets an isolated Supabase branch DB with migrations applied. Tests in CI run against real Supabase infrastructure (Auth, RLS, SECURITY DEFINER functions). Requires Supabase Pro branch feature.
- **D-08:** Required CI merge gates (all must pass before merge):
  1. `pnpm type-check` — TypeScript strict compilation
  2. `pnpm lint` — ESLint rules + `madge --circular src/modules` circular dependency check
  3. `pnpm test` — Vitest unit tests
  4. pgTAP RLS test suite — runs against the PR's Supabase branch DB; covers cross-tenant isolation and audience separation from Phase 1 onward
- **D-09:** Playwright E2E tests: **Phase 2+ only** — no E2E in Phase 1 CI. Phase 1 has no meaningful UI to drive (only auth scaffolding). Playwright added to CI when CRM pages exist in Phase 2.

### Tenant 1 Bootstrap Scope

- **D-10:** `scripts/seed-tenant.ts` is **written AND run** as part of Phase 1 deliverables. Running it against the Supabase Cloud project creates Tenant 1 (Pops Industrial Coatings) with: a `tenants` row, a `shop_settings` row, and a `staff` row `{role='admin', is_active=true, auth_user_id=NULL}`. This makes Phase 1 success criteria verifiable against live data.
- **D-11:** First admin credentials: `seed-tenant.ts` calls `auth.admin.inviteUserByEmail(owner_email)` after creating the staff row. Admin receives an invite email via Resend (from `noreply@popscoating.com`) and sets their password on first sign-in. This requires Resend and Supabase Auth SMTP to be configured first.
- **D-12:** `supabase/seed.sql` (local dev — runs with `supabase db reset`) includes:
  - 1 test tenant with a **fixed known UUID** (so tests can reference it as a constant)
  - 1 test office staff user: `auth.users` row + `staff` row, `audience=office`, `role='admin'`
  - 1 test workstation: synthetic `auth.users` row + `workstations` row
  - Sample companies, contacts, and jobs for visual testing (unused in Phase 1 but available for Phase 2+ UI development without re-seeding)

### Claude's Discretion

No "you decide" selections — all gray areas were answered explicitly.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Data Model
- `docs/DESIGN.md` — Full architecture: module structure, data model (all tables + columns + RLS policies), auth flows, SECURITY DEFINER function signatures, SQL helper definitions, tenant domain routing. **Primary reference for all Phase 1 implementation.**
- `docs/DESIGN.md §3.2` — `app.tenant_id()`, `app.audience()`, `app.role()`, `app.staff_id()`, `app.workstation_id()`, `app.company_id()`, `app.set_updated_at()` SECURITY DEFINER definitions; `app.custom_access_token_hook` spec (must NOT write to tables); `app.validate_employee_pin`, `app.claim_workstation`, `app.record_workstation_heartbeat`, `app.release_workstation` function specs; `supabase_auth_admin` BYPASSRLS dependency warning.
- `docs/DESIGN.md §3.3` — `tenants`, `tenant_domains`, `shop_settings`, `workstations` table schemas and RLS policies; multi-domain routing via `src/proxy.ts`.
- `docs/DESIGN.md §4.2` — Module layout (`src/modules/<name>/`) with `index.ts` as sole public surface; Wave-1 module list.
- `docs/DESIGN.md §4.4` — Shared utilities canonical tree: `src/shared/{audit,auth-helpers,db,rate-limit,realtime,storage,ui}/`; `withAudit()`, `requireOfficeStaff()`, `requireShopStaff()`, `requireCustomer()`, `getCurrentClaims()` definitions.
- `docs/DESIGN.md §102` — Next.js 16 specifics: `cookies()` is async (`await cookies()`); always `supabase.auth.getUser()`, never `getSession()`; `src/proxy.ts` (not `middleware.ts`).

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — Canonical requirement specs INFRA-01 through AUTH-05 with acceptance criteria. All Phase 1 requirements are here.
- `.planning/ROADMAP.md §Phase 1` — Phase 1 success criteria (5 items) that define what "done" looks like. Agents must verify against all 5.
- `PRD.md` — Product scope, out-of-scope list, core constraints. Check before adding anything not in the requirements.

### Infrastructure
- `docs/DESIGN.md §2836-2843` — Testing strategy: Supabase branch databases for PR CI; `supabase start` for local development; pgTAP for RLS tests; Vitest for unit tests; Playwright for E2E (Phase 2+).
- `docs/DESIGN.md §3087-3107` — `scripts/seed-tenant.ts` spec (programmatic tenant bootstrap) and `supabase/seed.sql` spec (local dev fixtures).
- `docs/DESIGN.md §3294` — Local dev domain routing: `app.localhost:3000` and `track.localhost:3000` via `*.localhost` TLD (no `/etc/hosts` edits needed).

### Auth
- `docs/DESIGN.md §1905-1987` — Staff invite flow, customer magic-link flow, `custom_access_token_hook` implementation notes, `link_auth_user_to_actor` trigger, `assert_email_unique_across_actor_tables` migration ordering warning.
- `docs/DESIGN.md §1658` — Synthetic workstation user email format: `workstation-{uuid}@workstations.{tenant.slug}.local`; `createWorkstation` server action reference implementation.
- `CLAUDE.md` — Hard stack constraints, hidden invariants (hook must not write to tables, `supabase_auth_admin` BYPASSRLS, `production_status` REVOKE), service-role gating rules, ESLint enforcement scope.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No application code exists yet. This is a greenfield project. Phase 1 is the first code written.

### Established Patterns
- **Module structure** is prescribed by `docs/DESIGN.md §4.2`: `src/modules/<name>/{index.ts, actions/, components/, hooks/, types.ts}`. Phase 1 establishes this pattern for `auth` and `settings` modules.
- **Shared utilities** location is prescribed by `docs/DESIGN.md §4.4`: `src/shared/{audit,auth-helpers,db,rate-limit,realtime,storage,ui}/`. Phase 1 creates `auth-helpers/` (require.ts, claims.ts) and `db/` (supabase clients).
- **SQL migration pattern**: All migrations go in `supabase/migrations/`. Every new table immediately gets: `tenant_id uuid not null references public.tenants(id)`, an RLS policy using `app.tenant_id()`, and `app.set_updated_at()` trigger if it has `updated_at`.

### Integration Points
- `src/proxy.ts` → routes `app.*` to `src/app/(office)/`, `track.*` to `src/app/(portal)/`; `src/app/scan/` is not a route group (explicit `/scan` URL)
- `app.custom_access_token_hook` → reads `staff`, `customer_users`, `workstations` tables; `supabase_auth_admin` BYPASSRLS required; hook registered in Supabase Dashboard

</code_context>

<specifics>
## Specific Ideas

- `createWorkstation` returns enrollment QR data (token) even in Phase 1 so the server action is complete and Phase 3 only needs to build the UI around it.
- `supabase/seed.sql` uses a fixed UUID for the test tenant (not randomly generated) so test files can import it as a constant without needing to query the DB first.
- Phase 1 pgTAP suite runs in CI against branch DB from day 1 — not deferred to Phase 4 (OPS-02). OPS-02 formalizes and expands the suite; Phase 1 starts it.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Foundation*
*Context gathered: 2026-04-29*
