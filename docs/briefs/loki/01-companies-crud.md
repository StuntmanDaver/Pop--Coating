# Brief 01 — Companies CRUD Pages

> **Batch:** A (safe parallel — no shared edit surfaces with Briefs 02/03)
> **Complexity:** standard
> **Estimated RARV cycles:** 4–6

---

## 1. Surface

### Files to create

```
src/app/(office)/companies/
├── page.tsx                       # List — server component, searchParams filter
├── new/
│   ├── page.tsx                   # Server wrapper — pre-fetches nothing (no deps)
│   ├── actions.ts                 # createCompanyFromForm Server Action
│   └── new-company-form.tsx       # Client component — useActionState
├── [id]/
│   ├── page.tsx                   # Detail — company info + inline contacts list
│   └── edit/
│       ├── page.tsx               # Edit wrapper — fetches company by id
│       ├── actions.ts             # updateCompanyFromForm Server Action
│       └── edit-company-form.tsx   # Client component — useActionState
└── _components/
    └── company-form-fields.tsx     # Shared field set (create + edit)
```

### Files you MAY read but MUST NOT edit

- `src/modules/crm/index.ts` — barrel; all needed exports already exist
- `src/shared/db/postgrest.ts` — `escapeForOr()` import
- `src/shared/auth-helpers/require.ts` — `requireOfficeStaff()` import
- `src/shared/ui/badge.tsx` — `Badge` import
- `src/app/(office)/layout.tsx` — provides office nav shell; do NOT add a nav link (operator handles)

---

## 2. PRD Anchor

- `docs/DESIGN.md` §4.3 Module 2 (CRM) — companies, contacts, activities
- `PRD.md` — CRM is Wave 1 scope
- `.planning/STATE.md` — Phase 01, crm module complete (27 tests)

---

## 3. Pre-flight Assumptions

Step 0 completed by operator before dispatch:

- Clean git working tree — all dashboard/instrumentation work committed
- `pnpm install` up to date
- **No new shadcn primitives are required** — the existing jobs CRUD pattern uses
  native HTML elements (`<input>`, `<select>`, `<textarea>`, `<form>`). Mirror that
  pattern. Existing primitives in `src/shared/ui/` (alert, badge, button, card,
  form, input, label, table) cover all needs if you want them.

---

## 4. Module APIs to Consume

All imports come from `@/modules/crm` (single barrel entry per CLAUDE.md):

### Companies

| Export | Type | Signature |
|--------|------|-----------|
| `createCompany` | action | `(input: CreateCompanyInput) => Promise<{ id, tenant_id, name }>` |
| `updateCompany` | action | `(input: UpdateCompanyInput) => Promise<{ id, tenant_id, name }>` |
| `archiveCompany` | action | `(input: { id }) => Promise<{ id }>` |
| `listCompanies` | query | `(params: ListCompaniesParams) => Promise<CompanyListItem[]>` |
| `getCompanyById` | query | `(params: { id }) => Promise<{ ...full row } \| null>` (uses `select('*')`) |

#### `CreateCompanyInput` fields (from `src/modules/crm/actions/companies.ts`)

```typescript
{
  name: string;                // required, 1-200 chars
  phone?: string | null;       // max 50
  email?: string | null;       // valid email, max 200
  tax_id?: string | null;      // max 50
  payment_terms?: string | null;     // max 100, e.g. "Net 30"
  customer_since?: string | null;    // YYYY-MM-DD
  notes?: string | null;             // max 5000
  shipping_address?: string | null;  // max 500
  shipping_city?: string | null;     // max 100
  shipping_state?: string | null;    // max 50
  shipping_zip?: string | null;      // max 20
  billing_address?: string | null;
  billing_city?: string | null;
  billing_state?: string | null;
  billing_zip?: string | null;
}
```

`UpdateCompanyInput` is `CreateCompanySchema.partial().extend({ id: uuid })`.

#### `CompanyListItem` (returned by `listCompanies`)

```typescript
{
  id: string
  name: string
  phone: string | null
  email: string | null
  archived_at: string | null
  created_at: string
}
```

#### `ListCompaniesParams`

```typescript
{
  q?: string;                  // max 200; matched ilike against `name` only
  include_archived?: boolean;  // default false
  limit?: number;              // default 50, max 200
  offset?: number;             // default 0
}
```

### Contacts (consumed on detail page only)

| Export | Type | Signature |
|--------|------|-----------|
| `listContacts` | query | `(params: ListContactsParams) => Promise<ContactListItem[]>` |
| `getContactById` | query | `(params: { id }) => Promise<ContactListItem \| null>` |

### Test counts

- `src/modules/crm/actions/companies.test.ts` — 11 tests
- `src/modules/crm/actions/contacts.test.ts` — 10 tests
- `src/modules/crm/actions/activities.test.ts` — 6 tests
- Total: 27 passing

---

## 5. Pattern Anchors — Mirror These Exactly

The companies CRUD pages MUST follow the exact same architectural patterns as the
jobs CRUD pages. Study each file below and replicate the pattern:

### List page pattern → `src/app/(office)/jobs/page.tsx`
- Server Component (async function, NOT `'use client'`)
- `searchParams` typed as `Promise<{ q?: string; ... }>` (Next.js 16 — always `await searchParams`)
- `q` search filter: just pass through to `listCompanies({ q })`. The query uses
  `.ilike('name', '%${q}%')` against the `name` column only (NOT a `.or()` filter,
  so `escapeForOr()` is NOT needed for companies). Search matches company name only.
- Filter form: native `<form>` with `<select>` and `<input type="search">`, `<button type="submit">`
- Filters to expose: `q`, `include_archived` (toggle "Show archived")
- Empty state: dashed border `<div>` with link to `/companies/new`
- Table: semantic `<table>` with `<thead>` / `<tbody>`, hover row styles
- Link to detail: `<Link href={'/companies/${c.id}'}>`

### New page pattern → `src/app/(office)/jobs/new/page.tsx`
- Server Component wrapper — NO data pre-fetch needed (companies don't need a picker)
- Renders `<NewCompanyForm />`

### Create form pattern → `src/app/(office)/jobs/new/new-job-form.tsx`
- `'use client'`
- `useActionState(createCompanyFromForm, INITIAL)` where `INITIAL = { error: null }`
- Error alert with `role="alert"`
- Shared `<CompanyFormFields />` component
- Cancel link + Submit button in footer

### Create action pattern → `src/app/(office)/jobs/new/actions.ts`
- `'use server'`
- `FormState` type with `error: string | null`
- FormData → typed input via `stringOrNull` helpers
- Call module action (`createCompany`)
- `redirect('/companies/${id}')` on success

### Detail page pattern → `src/app/(office)/jobs/[id]/page.tsx`
- Server Component
- `params` typed as `Promise<{ id: string }>` (Next.js 16 — always `await params`)
- `notFound()` if company is null
- Two-column grid: company fields left, contacts list right
- Contacts listed inline using `listContacts({ company_id: id })`
- Edit button links to `/companies/${id}/edit`

### Edit page pattern → `src/app/(office)/jobs/[id]/edit/page.tsx`
- Server Component wrapper — fetches company by id
- `notFound()` if null
- Renders `<EditCompanyForm companyId={...} defaults={...} />`

### Edit form pattern → `src/app/(office)/jobs/[id]/edit/edit-job-form.tsx`
- `'use client'`
- `useActionState(updateCompanyFromForm.bind(null, companyId), INITIAL)`
- Same form structure as create but with `defaults` prop

### Edit action pattern → `src/app/(office)/jobs/[id]/edit/actions.ts`
- `'use server'`
- `updateCompanyFromForm(companyId, _prev, formData)` — partial update
- Uses `formDataString` + `assignIfDefined` helper pattern
- `redirect('/companies/${companyId}')` on success

### Shared form fields pattern → `src/app/(office)/jobs/_components/job-form-fields.tsx`
- `'use client'`
- Exports `CompanyFormFields`, `CompanyFormDefaults` interface
- **Field names MUST match the Zod schema exactly** so `FormData` round-trips into
  `CreateCompanyInput`. Required fields: `name`. Optional fields:
  - `phone`, `email`, `tax_id`, `payment_terms` (text inputs)
  - `customer_since` (date input — YYYY-MM-DD)
  - `notes` (textarea)
  - **Shipping address group**: `shipping_address`, `shipping_city`, `shipping_state`, `shipping_zip`
  - **Billing address group**: `billing_address`, `billing_city`, `billing_state`, `billing_zip`
- Group the shipping and billing addresses visually in two sub-sections (or a
  "Same as shipping" toggle if you want to be helpful — optional)
- Grid layout: `grid gap-6 lg:grid-cols-2`
- Input classes: `w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`

---

## 6. Hard Constraints

These are NON-NEGOTIABLE. Violating any one is a blocking defect.

1. **`cookies()` is async** — always `await cookies()` in any server-side code (Next.js 16)
2. **Auth: always `supabase.auth.getUser()`** — NEVER `getSession()` for auth decisions
3. **RLS** — all data access is through the tenant-scoped Supabase client; no service-role usage in this module
4. **Cross-module imports** — only import from `@/modules/crm` barrel (`index.ts`), never deep paths
5. **`escapeForOr()`** — only relevant for queries that compose multi-column `.or()` filter
   strings (like `listContacts`). `listCompanies` matches a single column with `.ilike`,
   so escaping is not needed. If you add a new contact-search surface, escape via
   `@/shared/db/postgrest`
6. **TypeScript strict** — no `any`, no non-null assertions without justification comment
7. **Tailwind v4** — utility classes only, no `tailwind.config.ts`
8. **No new shadcn primitives** — use only what Step 0 installed. If you need something missing, write to `.loki/signals/HUMAN_REVIEW_NEEDED` and stop

---

## 7. Out of Scope

Do NOT build any of these:

- Activities timeline UI on company detail (defer to later brief)
- Company merge / deduplicate
- Bulk CSV import
- Contact create/edit forms (defer — just list contacts on detail page)
- New nav link in `src/app/(office)/layout.tsx` — operator adds post-merge
- Any new shadcn primitives not already installed
- Any changes to `package.json` or `pnpm-lock.yaml`

**`archiveCompany` scoping note:** The API table above lists `archiveCompany` for completeness.
Do NOT build an archive button in this brief unless you explicitly choose to — there is no
acceptance criterion for it and no dequeue/unarchive path. The `include_archived` filter
on the list page will show archived companies if the flag is set, but the archive action
itself can be deferred to a follow-up. If you do build it: `archiveCompany` is one-way
(sets `archived_at = now()`, no unarchive method exists).

---

## 8. Conflict Surfaces

These files may collide with parallel Batch A worktrees. Do NOT edit them.

| File | Rule |
|------|------|
| `src/app/(office)/layout.tsx` | DO NOT add nav link — operator handles |
| `src/shared/ui/*` | Read-only — import existing, never create new |
| `package.json` / `pnpm-lock.yaml` | DO NOT edit |
| `vitest.config.ts` | DO NOT edit |
| `src/proxy.ts` | DO NOT edit |
| Any `src/modules/*/index.ts` | DO NOT edit — all needed exports exist |

If you determine any of these MUST be edited, write to `.loki/signals/HUMAN_REVIEW_NEEDED`
with justification and STOP.

---

## 9. Acceptance Criteria

All must pass for the task to be considered complete:

- [ ] `/companies` renders a filterable table of companies (q search, archived filter)
- [ ] `/companies/new` creates a company via `createCompany` and redirects to detail
- [ ] `/companies/{id}` shows company fields + inline contacts list
- [ ] `/companies/{id}/edit` updates a company via `updateCompany` and redirects to detail
- [ ] Empty states render correctly (no companies, no contacts)
- [ ] `notFound()` returned for non-existent company IDs
- [ ] All Server Components use `await searchParams` / `await params` (Next.js 16)
- [ ] No `getSession()` calls anywhere
- [ ] `pnpm build` succeeds with zero TypeScript errors
- [ ] `pnpm test` — all 161+ existing tests still pass (zero regressions)

---

## 10. Test Targets

### Pattern to mirror

Study `src/modules/crm/actions/companies.test.ts` for the mock structure:

```
vi.mock('@/shared/db/server', ...)
vi.mock('@/shared/auth-helpers/require', ...)
vi.mock('@/shared/auth-helpers/claims', ...)
vi.mock('@/shared/audit', ...)
```

### New tests to write

No new module-level tests are needed — the module has 27 tests already. This brief
is UI-only. If the Server Actions in `companies/new/actions.ts` and
`companies/[id]/edit/actions.ts` warrant unit tests, follow the exact pattern from
`src/app/(office)/jobs/new/actions.ts` — but these are thin bridges (FormData →
module action → redirect) and the module tests already cover the core logic.

### Minimum bar

- Zero regressions in existing 161 tests
- `pnpm build` clean

---

## 11. Compound Learning

After completing each RARV cycle, if you encounter a novel pattern (bug fix,
non-obvious solution, reusable approach), append an entry to
`.loki/memory/timeline.json` following the existing format:

```json
{
  "n": <next_cycle_number>,
  "module": "crm/companies-ui",
  "tests": 0,
  "lessons": ["<what you learned>"]
}
```
