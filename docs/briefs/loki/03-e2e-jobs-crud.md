# Brief 03 — Playwright E2E Tests for Jobs CRUD

> **Batch:** A (safe parallel — touches only `tests/e2e/` + config files)
> **Complexity:** standard
> **Estimated RARV cycles:** 3–4

---

## 1. Surface

### Files to create

```
tests/e2e/
├── jobs-crud.spec.ts              # Main E2E spec — jobs lifecycle
├── fixtures/
│   └── auth.ts                    # Shared auth fixture (login helper)
playwright.config.ts                # Root config — Chromium only for now
```

**Naming note:** the project already has `test/stubs/` (singular) for the vitest
`server-only` stub. This brief uses `tests/` (plural) for Playwright E2E because
that's the Playwright convention. Keep the two roots separate; do not mix.

### Files you MUST edit (with constraints)

| File | Edit |
|------|------|
| `vitest.config.ts` | Add `exclude: ['tests/e2e/**']` to `test` block |

### Files you MAY read but MUST NOT edit

- `src/app/(office)/jobs/**` — understand the UI you're testing
- `src/app/sign-in/page.tsx` — understand sign-in flow for fixture
- `scripts/seed-tenant.ts` — understand seed data shape
- `package.json` — verify `@playwright/test` is already installed (Step 0)

---

## 2. PRD Anchor

- `docs/DESIGN.md` §9 — testing strategy
- `.loki/state/orchestrator.json` — `ui_surfaces_built` lists `/jobs` routes
- `.loki/memory/timeline.json` — session patterns for server action + query structure

---

## 3. Pre-flight Assumptions

Step 0 completed by operator before dispatch:

- `pnpm add -D @playwright/test` already run
- `pnpm exec playwright install chromium` already run (add `--with-deps` only on Linux)
- Dev server can start via `pnpm dev` on port 3000
- Supabase local dev instance running (`supabase start`)
- Tenant seed data exists (via `scripts/seed-tenant.ts` or manual seed)
- A staff user with email/password credentials exists for sign-in
- `E2E_STAFF_EMAIL` + `E2E_STAFF_PASSWORD` env vars set (or rely on the test defaults)
- For host-aware sign-in, set `E2E_BASE_URL=http://app.localhost:3000` if you need
  the office form behavior to match production (otherwise plain `localhost` works
  because the host doesn't start with `track.`)

---

## 4. Module APIs to Consume

None directly — E2E tests interact through the browser, not module imports.

### Routes under test

| Route | Method | Behavior |
|-------|--------|----------|
| `/sign-in` | GET + POST | Office sign-in with email/password |
| `/jobs` | GET | Jobs list with filters |
| `/jobs/new` | GET + POST | Create job form → redirect to detail |
| `/jobs/{id}` | GET | Job detail page |
| `/jobs/{id}/edit` | GET + POST | Edit job form → redirect to detail |
| `/jobs/{id}/packet` | GET | PDF stream (response 200, content-type application/pdf) |

---

## 5. Pattern Anchors

### Sign-in flow (from `src/app/sign-in/page.tsx`)

The `/sign-in` page renders DIFFERENTLY based on `host`:
- `app.localhost:3000` (or `app.*` in prod) → office email + password form
- `track.localhost:3000` (or `track.*` in prod) → magic link form

For E2E we want the **office form**, so the test runner must hit `app.localhost:3000`
(or set `E2E_BASE_URL` to that). If `baseURL` is `http://localhost:3000` (no `app.`
prefix), the sign-in page may render the office form (host header doesn't start
with `track.`) — verify behavior.

Office sign-in selectors:
- `input#email` (also `input[name="email"]`, `getByLabel('Email')`)
- `input#password` (also `input[name="password"]`, `getByLabel('Password')`)
- Submit button: `getByRole('button', { name: 'Sign In' })`
- On success: redirects to `/` (which then redirects to `/dashboard` per the
  authenticated office route)
- On error: redirects to `/sign-in?error=...` and renders an `Alert` with `role="alert"`

### Auth fixture pattern

Create a reusable Playwright fixture that signs in once per test worker:

```typescript
// tests/e2e/fixtures/auth.ts
import { test as base, type Page } from '@playwright/test'

async function staffLogin(page: Page) {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(process.env.E2E_STAFF_EMAIL ?? 'admin@example.com')
  await page.getByLabel('Password').fill(process.env.E2E_STAFF_PASSWORD ?? 'password123')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL('**/dashboard')
}

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await staffLogin(page)
    await use(page)
  },
})

export { expect } from '@playwright/test'
```

### Jobs list page (from `src/app/(office)/jobs/page.tsx`)

Key selectors for E2E:
- Page heading: `h1` with text "Jobs"
- "New job" link: `a` with text "New job" → navigates to `/jobs/new`
- Search input: `input[name="q"]`
- Table rows: `tbody tr` — each row links to `/jobs/{id}`
- Empty state: text "No jobs yet"

### New job form (from `src/app/(office)/jobs/new/new-job-form.tsx`)

Key selectors:
- Customer select: `select[name="company_id"]`
- Job name: `input[name="job_name"]`
- Submit button: text "Create job"
- Cancel link: text "Cancel"
- Error alert: `[role="alert"]`

### Job detail page (from `src/app/(office)/jobs/[id]/page.tsx`)

Key selectors:
- Job number: `.font-mono` element
- Job name: `h1`
- "Print packet" link
- "Edit" link
- Badge elements for status/priority/hold

---

## 6. Hard Constraints

1. **Chromium only** — no multi-browser matrix in this brief; add later
2. **`baseURL` from env** — use `process.env.E2E_BASE_URL ?? 'http://localhost:3000'`
3. **Auth credentials from env** — `E2E_STAFF_EMAIL` + `E2E_STAFF_PASSWORD`; default fallbacks for local dev
4. **vitest exclude** — `tests/e2e/**` MUST be excluded from vitest so Playwright tests
   don't run in the vitest runner. Add to `vitest.config.ts`:
   ```typescript
   test: {
     environment: 'jsdom',
     globals: true,
     exclude: ['tests/e2e/**', 'node_modules/**'],
   }
   ```
5. **No `--headed` by default** — CI runs headless; add `use: { headless: true }` in config
6. **Deterministic test data** — each test should create its own data through the UI
   (don't depend on existing seed beyond the staff user account)
7. **Cleanup** — tests don't need to delete created records (RLS scopes by tenant; each
   test run uses the same tenant so later tests just see more data)

---

## 7. Out of Scope

- Scan flow E2E (Brief 05 owns that)
- Portal E2E (magic-link flow is harder to test; defer)
- Mobile viewport matrix
- Visual regression / screenshot comparison
- Performance budgets / Lighthouse
- CI GitHub Actions integration (operator handles)
- Parallelized test sharding
- Database reset between tests (tenant-scoped data is fine)

---

## 8. Conflict Surfaces

| File | Rule |
|------|------|
| `vitest.config.ts` | ALLOWED to edit — add `exclude` for `tests/e2e/**` ONLY |
| `package.json` | DO NOT edit — `@playwright/test` already installed in Step 0 |
| `pnpm-lock.yaml` | DO NOT edit |
| `src/**` | DO NOT edit any source files |
| `.gitignore` | MAY add `test-results/`, `playwright-report/` if needed |

---

## 9. Acceptance Criteria

- [ ] `playwright.config.ts` exists at repo root with Chromium project, `baseURL` from env
- [ ] `vitest.config.ts` excludes `tests/e2e/**` (no vitest collision)
- [ ] Auth fixture signs in a staff user and persists session across tests
- [ ] **Test: list jobs** — navigate to `/jobs`, verify heading renders
- [ ] **Test: create job** — click "New job" → fill form (company, name, priority) → submit →
      redirected to detail page → job number visible → job name matches input
- [ ] **Test: view detail** — from list, click a job row → detail page renders with
      job_number, job_name, status badges, "Print packet" link, "Edit" link
- [ ] **Test: edit job** — from detail, click "Edit" → change job name → submit →
      detail page shows updated name
- [ ] **Test: packet PDF** — from detail, click "Print packet" → response status 200,
      content-type contains `application/pdf` (or verify navigation doesn't 404)
- [ ] `pnpm exec playwright test` — all E2E tests pass
- [ ] `pnpm test` — all 161+ vitest tests still pass (zero regressions)
- [ ] `pnpm build` clean

---

## 10. Test Targets

### `playwright.config.ts` structure

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### `tests/e2e/jobs-crud.spec.ts` structure

```typescript
import { test, expect } from './fixtures/auth'

test.describe('Jobs CRUD', () => {
  test('can view jobs list', async ({ authenticatedPage: page }) => { ... })
  test('can create a job', async ({ authenticatedPage: page }) => { ... })
  test('can view job detail', async ({ authenticatedPage: page }) => { ... })
  test('can edit a job', async ({ authenticatedPage: page }) => { ... })
  test('can access packet PDF', async ({ authenticatedPage: page }) => { ... })
})
```

### Minimum bar

- 5 passing E2E tests
- Zero vitest regressions
- `pnpm build` clean

---

## 11. Compound Learning

After each RARV cycle, if you encounter a novel pattern (e.g., Playwright selector
strategy for Server Components, auth fixture nuance), append to
`.loki/memory/timeline.json`:

```json
{
  "n": <next>,
  "module": "e2e/jobs-crud",
  "tests": 5,
  "lessons": ["<what you learned>"]
}
```
