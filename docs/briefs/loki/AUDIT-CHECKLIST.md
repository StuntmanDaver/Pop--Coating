# Loki Brief Audit Checklist — 22 Dimensions

> Version 1.0 — authored 2026-05-05
> Run this checklist against every brief on every audit round.
> Record findings in AUDIT-HISTORY.md.
> Source-of-truth files are re-read fresh each round; do not use cached values.

---

## Scope

Five briefs + shared primer:
- `_shared-context.md`
- `01-companies-crud.md`
- `02-portal-job-detail.md`
- `03-e2e-jobs-crud.md`
- `04-settings-admin.md`
- `05-scan-pwa.md`

---

## Category 1 — Code-fact accuracy (verify against actual source files)

### Dimension A — API Signature

**What to check:** Every module export cited in the brief (function name, parameter type, return type) matches the actual export in `src/modules/<x>/index.ts` and the underlying implementation file.

**Source of truth:**
- `src/modules/crm/index.ts` + `actions/companies.ts` + `queries/companies.ts` + `queries/contacts.ts`
- `src/modules/portal/index.ts` + `queries/portal.ts`
- `src/modules/scanning/index.ts` + `actions/{pin,scan-event,workstation-lifecycle}.ts` + `queries/lookup.ts`
- `src/modules/settings/index.ts` + `actions/{staff,workstation,shop-settings}.ts` + `queries/staff.ts`
- `src/modules/dashboard/queries/dashboard.ts`
- `src/modules/timeline/queries/timeline.ts`

**Check for each citation:**
- [ ] Function name exactly matches export name (no typos, no old names)
- [ ] Parameter object shape matches Zod schema or TypeScript type
- [ ] Return type matches actual return (not assumed)
- [ ] Optional vs required fields correct
- [ ] Any `null | undefined` distinctions correct

**Common defect:** `new_version` vs `version` in ClaimResult; wrong field optionality.

---

### Dimension B — Database Schema

**What to check:** Every field, type, constraint, or index cited in a brief (e.g., from a direct query pattern) matches the actual schema in `supabase/migrations/*.sql`.

**Source of truth:**
- `supabase/migrations/0002_tenants_and_domains.sql` — shop_settings, tenant_domains
- `supabase/migrations/0003_auth_tables.sql` — staff, shop_employees, workstations, customer_users
- `supabase/migrations/0004_crm_tables.sql` — companies, contacts, activities, tags
- `supabase/migrations/0005_jobs_tables.sql` — jobs, job_status_history
- `supabase/migrations/0006_rls_policies.sql` — all RLS policies

**Check for each field-level citation:**
- [ ] Column name is exact (no aliasing, no pluralization differences)
- [ ] Nullable vs NOT NULL correct
- [ ] CHECK constraints (e.g., role IN ('admin','manager','office','shop','tenant_admin','agency_super_admin'))
- [ ] UNIQUE constraints noted where they affect UX (e.g., one_primary_per_company)
- [ ] Any DEFAULT values that affect create-form behavior

**Common defect:** Using wrong column name (`last_heartbeat_at` vs `last_activity_at`); missing `physical_location` vs `location` aliasing.

---

### Dimension C — SQL Function Contract

**What to check:** Every SECURITY DEFINER function cited — exact parameter names, return shape, error strings raised, and all side effects.

**Source of truth:**
- `supabase/migrations/0009_workstation_lifecycle_functions.sql` — claim_workstation, record_workstation_heartbeat, release_workstation
- `supabase/migrations/0015_validate_employee_pin.sql` — validate_employee_pin
- `supabase/migrations/0016_record_scan_event.sql` — record_scan_event
- `supabase/migrations/0017_jobs_packet_dirty_trigger.sql` — packet_dirty trigger

**Check for each SECURITY DEFINER call:**
- [ ] Exact `RAISE EXCEPTION` strings match what brief tells loki to surface
- [ ] Return shape (JSONB fields) exactly matches brief's TypeScript type
- [ ] All `DECLARE` block side effects (UPDATEs, INSERTs) documented
- [ ] SQL parameter names (`p_employee_id`) match what the wrapper passes
- [ ] `GRANT`/`REVOKE` audience gates documented (who can call this)

**Common defect:** Using `'version_stale'` when SQL says `'workstation_in_use_or_stale_version'`; missing the `intake_status` auto-promote side effect.

---

### Dimension D — File Path Existence

**What to check:** Every file path cited as "exists" (pattern anchor, test file, shared util, etc.) actually exists in the repo. Every file cited as "to create" does NOT already exist.

**Source of truth:** `find src/ supabase/ test/ tests/ scripts/ -type f` output.

**Check for each path:**
- [ ] Files cited as pattern anchors exist
- [ ] Files cited as "to create" do not already exist (would cause conflict)
- [ ] Import paths (`@/modules/crm`, `@/shared/db/server`) resolve per `tsconfig.json` path aliases
- [ ] Route paths cited match actual Next.js file structure

**Common defect:** Citing `tests/e2e/` when project uses `test/` for vitest stubs.

---

### Dimension E — Pattern Anchor Accuracy

**What to check:** When a brief says "mirror this file exactly," the cited file actually has the pattern described.

**Source of truth:** Read the cited anchor file directly.

**Check for each pattern claim:**
- [ ] The "useActionState" pattern is actually in the cited file (not assumed)
- [ ] The FormState type described matches the actual file
- [ ] The redirect behavior described matches actual code
- [ ] Quoted code snippets are syntactically valid and match the version in repo

**Common defect:** Describing a pattern that changed in a later commit; quoting an old field name.

---

### Dimension U — Test Target Reality

**What to check:** Every test file cited for "mirror this pattern" actually exists with the described structure.

**Source of truth:**
- `src/modules/crm/actions/companies.test.ts`
- `src/modules/scanning/actions/pin.test.ts`
- `src/modules/portal/queries/portal.test.ts`
- `src/modules/settings/actions/staff.test.ts`
- `src/modules/jobs/actions/jobs.test.ts`
- `src/app/(office)/jobs/[id]/packet/route.test.ts`

**Check for each test reference:**
- [ ] Test file exists at cited path
- [ ] Mock structure described (`vi.mock('@/shared/db/server', ...)`) is present
- [ ] Test count cited (e.g., "27 tests") matches actual file (run `grep "it(" | wc -l`)
- [ ] Test file exports the described pattern (not just the module under test)

**Common defect:** Stating wrong test count; citing a test structure that was refactored.

---

## Category 2 — Constraint Provenance

### Dimension F — Constraint Citation Traceability

**What to check:** Every "hard constraint" or "MUST" in the brief traces to a specific, real source.

**Source of truth:** `CLAUDE.md`, `docs/DESIGN.md`, `eslint.config.js`, migration SQL files.

**Check for each hard constraint:**
- [ ] `CLAUDE.md` constraints: photo compression JPEG 0.7/1024px, `@zxing/browser`, workstation 1hr TTL, service-role gating, production_status write prohibition
- [ ] `docs/DESIGN.md` constraints: heartbeat 30s (§2267), EmployeePicker (§1427/§2007-2009), manifest scope (§1433), any-to-any transitions, 8-char suffix suffix for manual entry
- [ ] `eslint.config.js` constraints: no-restricted-imports block 1 (barrel only) and block 2 (service-role gating)
- [ ] Whether a constraint is documented or just assumed by the brief author

**Common defect:** Saying "per CLAUDE.md" for something that's actually in DESIGN.md, or vice versa.

---

### Dimension G — Dependency Availability

**What to check:** Every package imported in code snippets or described as a requirement exists in `package.json` or is explicitly flagged as Step 0.

**Source of truth:** `package.json` (dependencies + devDependencies).

**Installed packages to verify against:**
```
@hookform/resolvers, @radix-ui/react-label, @radix-ui/react-slot, @react-pdf/renderer,
@sentry/nextjs, @supabase/ssr, @supabase/supabase-js, @upstash/ratelimit, @upstash/redis,
class-variance-authority, clsx, lucide-react, next, next-intl, qrcode, react, react-dom,
react-hook-form, resend, server-only, tailwind-merge, zod
devDeps: @playwright/test (NOT installed, must be Step 0), @vitejs/plugin-react, vitest
```

**NOT installed — require Step 0 flag:**
- `@zxing/browser`, `@zxing/library` — must be in Step 0 install
- `@playwright/test` — must be in Step 0 install

**Check:**
- [ ] Every `import` in brief code snippets uses an installed package or flags Step 0
- [ ] Step 0 commands are copy-pasteable (`pnpm add @zxing/browser @zxing/library`)
- [ ] No `npm install` or `yarn add` anywhere — project uses `pnpm` only

**Common defect:** Assuming `@zxing/browser` is installed; using `npm` instead of `pnpm`.

---

### Dimension H — Next.js 16 Conventions

**What to check:** All Next.js-specific patterns follow Next.js 16 + App Router rules.

**Source of truth:** `src/app/**/*.tsx` existing patterns; `next.config.ts`; `CLAUDE.md` §Next.js 16 specifics.

**Check:**
- [ ] `params` always typed as `Promise<{ id: string }>` and awaited
- [ ] `searchParams` always typed as `Promise<{...}>` and awaited
- [ ] `cookies()` from `next/headers` called with `await`
- [ ] `headers()` from `next/headers` called with `await` (as in sign-in page)
- [ ] `manifest.ts` only valid at `src/app/manifest.ts` (not subdirectories)
- [ ] Server Actions marked with `'use server'` at top of file or function
- [ ] Client components marked with `'use client'` at top of file
- [ ] No Page Router patterns (`getServerSideProps`, `getStaticProps`)
- [ ] `Route` type from `next` used for typed `redirect()` and `<Link href>`
- [ ] `notFound()` from `next/navigation` (not custom 404)
- [ ] No `src/middleware.ts` — project uses `src/proxy.ts` per CLAUDE.md

**Common defect:** Non-async `params` in Next.js 16; using `middleware.ts` name.

---

### Dimension I — Auth and RLS Correctness

**What to check:** Every auth guard and data access matches actual RLS policies and `require*` helper behavior.

**Source of truth:** `src/shared/auth-helpers/require.ts`, `supabase/migrations/0006_rls_policies.sql`.

**RLS audience gates (from 0006):**
- `companies/contacts/activities/tags/jobs` — staff_office + staff_shop SELECT; office-only INSERT/UPDATE
- `shop_employees` — staff_office + staff_shop SELECT; office-only INSERT/UPDATE
- `workstations` — staff_office + staff_shop SELECT; office-only INSERT; office + shop UPDATE
- `job_status_history` — staff SELECT; customer SELECT (customer_visible=true only); shop INSERT

**require* helper behavior:**
- `requireOfficeStaff()` — redirects to `/sign-in` if not audience `staff_office`
- `requireShopStaff()` — redirects to `/scan` if not audience `staff_shop`
- `requireCustomer()` — redirects to `/sign-in` if not audience `customer`
- Layout `(office)` already calls `requireOfficeStaff()` — page-level call is redundant

**Check:**
- [ ] Every portal page calls `requireCustomer()` as first body line
- [ ] Every scan page calls `requireShopStaff()` or inherits from layout
- [ ] RLS allows the query being made (e.g., shop_employees SELECT is ok for shop audience)
- [ ] No page calls `requireOfficeStaff()` that should call `requireShopStaff()`
- [ ] Brief does not attempt customer-audience access to non-customer-visible data

**Common defect:** Calling `requireOfficeStaff()` on scan pages; forgetting RLS allows shop to SELECT shop_employees.

---

### Dimension J — Service-Role Gating

**What to check:** No brief instructs loki to import `@/shared/db/admin` from a module where ESLint blocks it.

**Source of truth:** `eslint.config.js` — block 2:
```
files: ['src/modules/!(settings|portal|auth)/**', 'src/shared/!(audit|auth-helpers|db)/**', 'src/app/**', 'src/proxy.ts']
```
Allowed modules: `settings`, `portal`, `auth`. Shared: `audit`, `auth-helpers`, `db`. All others BLOCKED.

**Check:**
- [ ] No scan module code imports `@/shared/db/admin`
- [ ] No CRM module code imports `@/shared/db/admin`
- [ ] No app/* code imports `@/shared/db/admin`
- [ ] Settings module: service-role allowed — verify brief correctly notes this
- [ ] Brief does not tell loki to add `createServiceClient()` in a forbidden location

**Common defect:** Scan page doing a direct admin client call "just for the workstation lookup."

---

### Dimension P — Sensitive Data Handling

**What to check:** Sensitive values are never described as rendered/logged/stored insecurely.

**Sensitive values in this project:**
- `device_token` (workstation row) — a password-equivalent 48-char secret
- `pin_hash` (shop_employees) — bcrypt hash, never selected/displayed
- `invite_link` (inviteStaff return) — one-time magic link, treat as secret
- `enrollment_url` (createWorkstation return) — contains device_token as query param

**Check:**
- [ ] No brief says to `console.log` or Sentry-capture any of these
- [ ] No brief says to show the full workstation row (would expose device_token)
- [ ] `device_token` column NOT included in any SELECT list in brief code snippets
- [ ] `invite_link` described as "copy-friendly one-time display" not "store in DB"
- [ ] Brief explicitly lists safe subset of fields to display for workstations

**Common defect:** `supabase.from('workstations').select('*')` includes device_token.

---

## Category 3 — Brief Integrity

### Dimension K — Cross-Brief Consistency

**What to check:** Cross-references between briefs are bidirectionally accurate.

**Check:**
- [ ] Brief 04 mentions `enrollment_url` → Brief 05 says `/scan/enroll` consumes it — these must agree
- [ ] Batch assignments (A vs B) consistent across all briefs
- [ ] Conflict surface matrix in `_shared-context.md` matches the "DO NOT EDIT" lists in individual briefs
- [ ] Step 0 prereqs in shared primer match pre-flight sections in individual briefs
- [ ] Post-merge nav-link addition responsibility consistent (shared primer says operator, briefs say same)

**Common defect:** Shared primer says one pre-flight; individual brief says different.

---

### Dimension L — Internal Consistency

**What to check:** Within a single brief, the flow diagram, acceptance criteria, file surface, and API consume section all describe the same system.

**Check for each brief:**
- [ ] Every route in the file surface appears in the flow diagram
- [ ] Every flow step has an acceptance criterion
- [ ] Every module API listed in §4 is actually called somewhere in the flow
- [ ] Component names in `_components/` match names used in the flow diagram
- [ ] File created as `page.tsx` matches the Server/Client Component designation described

**Common defect:** `_components/employee-picker.tsx` listed but never referenced in flow.

---

### Dimension M — Out-of-Scope Clarity

**What to check:** Known stubs and deferred surfaces are explicitly named in the Out of Scope section.

**Known stubs (verified from source):**
- `src/shared/storage/index.ts` — returns `''` for all paths
- `src/shared/audit/index.ts` — `logAuditEvent` is a no-op
- `/scan/enroll` route — does not exist; referenced in `src/proxy.ts` line 86 but unbuilt
- `@playwright/test` — not installed in package.json
- `@zxing/browser` — not installed in package.json
- `pnpm gen:types` — blocked until Plan 06 manual DB checkpoints

**Check:**
- [ ] Brief 05 explicitly defers photo upload (storage stub)
- [ ] Brief 05 explicitly defers `/scan/enroll`
- [ ] Brief 04 explicitly defers `shop_employees` admin
- [ ] Audit trail behavior acknowledges `logAuditEvent` is a stub

**Common defect:** Telling loki to check for audit_log rows in tests when `logAuditEvent` returns nothing.

---

### Dimension N — Conflict Surface Integrity

**What to check:** The "DO NOT EDIT" list in each brief covers all files that parallel batch members edit.

**Shared-primer conflict matrix (verified):**
- `package.json`/`pnpm-lock.yaml` — Brief 03 (playwright), Brief 05 (zxing); Briefs 01/02/04 must NOT edit
- `vitest.config.ts` — Brief 03 only (e2e exclude); others must NOT edit
- `src/proxy.ts` — Brief 05 flag-only; others must NOT edit
- `src/shared/ui/*` — read-only for all briefs
- `src/app/(office)/layout.tsx` — nav link: operator post-merge only; both Brief 01 and 04 must NOT add nav link
- Module `index.ts` barrels — only Brief 05 allowed one edit (listShopEmployees export)

**Check:**
- [ ] Briefs 01, 02, 04 explicitly list `vitest.config.ts` as DO NOT EDIT
- [ ] Briefs 01, 02, 04 explicitly list `package.json` as DO NOT EDIT
- [ ] Brief 04 explicitly lists `src/modules/scanning/index.ts` as DO NOT EDIT
- [ ] Brief 01 explicitly lists `src/modules/settings/index.ts` as DO NOT EDIT
- [ ] No brief omits a file that a parallel brief may touch

**Common defect:** A brief missing vitest.config.ts from its DO NOT EDIT list.

---

### Dimension O — Self-Containment

**What to check:** A loki agent starting from zero conversation context can execute the brief without reading additional docs beyond what's cited inline.

**Check for each brief:**
- [ ] All hard constraints are quoted inline, not just referenced by section number
- [ ] API signatures are reproduced inline, not just referenced as "see module"
- [ ] Error strings are quoted verbatim, not described vaguely
- [ ] Pattern-mirror examples include enough code that loki could write the new version

**Common defect:** "Follow the pattern from DESIGN.md §4.3" without reproducing the relevant excerpt.

---

### Dimension W — Navigation Closure

**What to check:** Every route URL cited in a brief either (a) is in the brief's own file surface, (b) is an existing route in the codebase, or (c) is explicitly deferred.

**Existing routes (verified from `src/app/`):**
- `(office)`: `/dashboard`, `/jobs`, `/jobs/new`, `/jobs/[id]`, `/jobs/[id]/edit`, `/jobs/[id]/packet`
- `(portal)`: `/my` (placeholder), `/auth/callback`
- Scan: `/scan` (stub only)
- Root: `/`, `/sign-in`

**Check:**
- [ ] No brief cites a route that doesn't exist and isn't in the brief's surface
- [ ] Internal navigation between the brief's own new routes is consistent
- [ ] Back/cancel links point to valid destinations
- [ ] `/scan/enroll` is explicitly "OUT OF SCOPE" in Brief 05, not a dangling reference

**Common defect:** Back link to `/my` from portal detail — `/my` is a placeholder but that's documented.

---

## Category 4 — Operational Completeness

### Dimension Q — Optimistic Concurrency Completeness

**What to check:** Every operation that uses a `version` field specifies the full read→pass→retry→fail path.

**Locations in this codebase:**
- `claimWorkstation` — `version` field on workstations row; SQL reason `'workstation_in_use_or_stale_version'`

**Check:**
- [ ] Brief 05 specifies where `version` is initially read (workstation direct query at boot)
- [ ] Brief 05 specifies how `version` is passed (URL param)
- [ ] Brief 05 specifies retry strategy (refetch once, then give up)
- [ ] Brief 05 specifies the exact reason string to match
- [ ] Brief 05 specifies the UI when both attempts fail (bounce to /scan with toast)

**Common defect:** Specifying retry without specifying how to get the new version.

---

### Dimension R — Side Effects Coverage

**What to check:** Every state-mutating call lists all downstream DB and UI side effects.

**Known side effects (verified from SQL):**

`record_scan_event`:
1. INSERT job_status_history (event_type='stage_change')
2. UPDATE jobs.production_status = p_to_status
3. If intake_status='scheduled' → auto-promote to 'in_production' (one-way)
4. If to_status='picked_up' AND picked_up_at IS NULL → stamp picked_up_at = now()
5. compute_status_event_metadata trigger fires (duration_seconds, is_rework)

`claim_workstation`:
1. UPDATE workstations SET current_employee_id, current_employee_id_set_at, last_activity_at, version

`release_workstation`:
1. UPDATE workstations SET current_employee_id=NULL, current_employee_id_set_at=NULL, version+1

`validate_employee_pin` (on success):
1. UPDATE shop_employees SET failed_pin_attempts=0, locked_until=NULL

`validate_employee_pin` (on failure):
1. UPDATE shop_employees SET failed_pin_attempts+1, locked_until (if ≥5 attempts)

`createWorkstation`:
1. INSERT workstations
2. auth.admin.createUser (synthetic auth user)
3. UPDATE workstations SET auth_user_id

`inviteStaff`:
1. INSERT staff (auth_user_id=NULL)
2. auth.admin.createUser
3. auth.admin.generateLink
(Partial failure: createUser succeeds → staff + auth user orphaned if generateLink fails)

**Check for each action cited in briefs:**
- [ ] All INSERT/UPDATE side effects are listed or acknowledged
- [ ] Trigger-fired side effects are mentioned where relevant
- [ ] UI consequences of side effects described (e.g., job transitions from "Scheduled" to "In Production")

**Common defect:** Missing the intake_status auto-promote from record_scan_event.

---

### Dimension S — Error State Coverage

**What to check:** Common error paths have explicit UX guidance so loki doesn't have to invent behavior.

**Errors to verify coverage for:**

Brief 01 (companies):
- `createCompany` fails (e.g., duplicate name within tenant via RLS, not UNIQUE constraint) → form error
- `archiveCompany` — no recovery (one-way like deactivateStaff?)

Brief 02 (portal):
- `getMyJob` returns null → notFound() (documented)
- `getCustomerVisibleTimeline` empty → empty state message

Brief 04 (settings):
- `inviteStaff` partial failure (documented)
- `deactivateStaff` irreversibility (documented)
- `updateShopSettings` with locked fields → error message

Brief 05 (scan):
- PIN: all 4 reason variants (documented)
- `claimWorkstation` reason variants (documented)
- `lookupJobByPacketToken` returns null → "not found" (documented)
- `lookupJobByPacketToken` throws "Ambiguous" → "enter more characters" (documented)
- `recordScanEvent` error variants (documented)
- Heartbeat failure → session expired (documented)

**Check:**
- [ ] `archiveCompany` in Brief 01 — is this exposed? Is it one-way? Clarify.
- [ ] Empty timeline in Brief 02 — empty state message specified?
- [ ] `updateShopSettings` lock-violation UI — what happens when submit fires anyway?

**Common defect:** Not handling the case where a form action throws and the error is not shown.

---

### Dimension T — Naming Convention Consistency

**What to check:** File names in briefs match the conventions established by existing code.

**Existing conventions (verified):**
- Page files: `page.tsx`
- Client form components: `new-{entity}-form.tsx`, `edit-{entity}-form.tsx`
- Shared field sets: `{entity}-form-fields.tsx`
- Server actions co-located: `actions.ts` (not `actions/` directory inside route)
- Test files: `{module}.test.ts` co-located with source
- Component directories: `_components/` prefix for private route-scoped components

**Check:**
- [ ] Brief 01 uses `company-form-fields.tsx` (not `CompanyFormFields.tsx`)
- [ ] Brief 01 actions are in `actions.ts` files (matches jobs pattern)
- [ ] Brief 04 settings components follow the same kebab-case naming
- [ ] Brief 05 scan components use kebab-case (`employee-picker.tsx` not `EmployeePicker.tsx`)
- [ ] New query file Brief 05 adds: `employees.ts` (matches `lookup.ts`, `portal.ts`)

**Common defect:** Using PascalCase for filenames; `actions/` directory vs `actions.ts`.

---

### Dimension V — Pre-flight Enforceability

**What to check:** Every Step 0 command in `_shared-context.md` is copy-pasteable, correct, and has a verify step.

**Source of truth:** `package.json` scripts; pnpm conventions.

**Check for each Step 0 command:**
- [ ] Uses `pnpm` not `npm` or `yarn`
- [ ] `pnpm add @zxing/browser @zxing/library` — both packages needed (library is the core, browser is the wrapper)
- [ ] `pnpm add -D @playwright/test` then `pnpm exec playwright install chromium` — correct sequence
- [ ] `--with-deps` flag for playwright is Linux-only; macOS doesn't need it
- [ ] Each Step 0 has a verify: `git status` shows clean; `pnpm exec playwright --version`
- [ ] `git push origin main` step has verify: remote is up to date

**Common defect:** Missing verify steps; Linux-specific flags applied globally.

---

## Audit Loop Rules

### Pass criteria

A round is **clean** when every cell in the following matrix is checked:

| Brief | A | B | C | D | E | U | F | G | H | I | J | P | K | L | M | N | O | W | Q | R | S | T | V |
|-------|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| shared | — | — | — | ✓ | — | — | ✓ | ✓ | — | — | — | — | ✓ | ✓ | — | ✓ | ✓ | — | — | — | — | — | ✓ |
| 01 | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | — |
| 02 | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | — |
| 03 | — | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ |
| 04 | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | — |
| 05 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |

(— = dimension not applicable to this brief)

### Severity levels

| Level | Definition | Action |
|-------|-----------|--------|
| CRITICAL | Would cause runtime crash or silent security failure | Fix before ending round |
| HIGH | Would cause wrong behavior or dangerously wrong loki decision | Fix before ending round |
| MEDIUM | Would cause unnecessary loki confusion, backtrack, or wasted cycle | Fix before ending round |
| LOW | Ambiguity or style issue that reduces brief quality | Fix if no CRITICAL/HIGH remain |

### Termination

- **Continue:** any CRITICAL, HIGH, or MEDIUM findings
- **Second clean round:** two consecutive rounds with zero findings of any severity
- **Escalate:** round 8 reached and findings remain — document as known issues
