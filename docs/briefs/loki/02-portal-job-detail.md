# Brief 02 — Portal Job Detail Page

> **Batch:** A (safe parallel — isolated to `(portal)` route group, no shared edit surfaces)
> **Complexity:** simple
> **Estimated RARV cycles:** 1–2

---

## 1. Surface

### Files to create

```
src/app/(portal)/my/[jobId]/
└── page.tsx                # Server Component — job detail + timeline
```

One file. That's it.

### Files you MAY read but MUST NOT edit

- `src/app/(portal)/my/page.tsx` — existing placeholder; understand the pattern
- `src/app/(portal)/layout.tsx` — parent layout (pass-through)
- `src/modules/portal/index.ts` — barrel; all needed exports exist
- `src/modules/timeline/queries/timeline.ts` — understand `TimelineEvent` shape
- `src/proxy.ts` — understand host routing (portal = `track.*`)

---

## 2. PRD Anchor

- `docs/DESIGN.md` §4.3 Module 9 (Portal) — customer-facing read surface
- `docs/DESIGN.md` §4.3 Module 6 (Timeline) — `getCustomerVisibleTimeline` re-exported by portal
- `PRD.md` — customer portal is Wave 1 scope
- `.loki/state/orchestrator.json` — portal module: 7 tests passing

---

## 3. Pre-flight Assumptions

- Clean git working tree
- No new dependencies needed — portal module already exists
- `src/app/(portal)/my/page.tsx` already calls `requireCustomer()` — follow same pattern

---

## 4. Module APIs to Consume

All imports from `@/modules/portal` (single barrel entry):

| Export | Type | Signature |
|--------|------|-----------|
| `getMyJob` | query | `(input: { id: string }) => Promise<PortalJobDetail \| null>` |
| `getCustomerVisibleTimeline` | query | `(params: { job_id: string, limit?, offset? }) => Promise<TimelineEvent[]>` |

### `PortalJobDetail` fields (from `src/modules/portal/queries/portal.ts`)

```typescript
{
  id: string
  job_number: string
  job_name: string
  description: string | null
  customer_po_number: string | null
  intake_status: string
  production_status: string | null
  on_hold: boolean
  hold_reason: string | null
  due_date: string | null
  color: string | null
  created_at: string
}
```

### `TimelineEvent` fields (customer-visible subset)

```typescript
{
  id: string
  event_type: string
  from_status: string | null
  to_status: string | null
  is_rework: boolean
  is_unusual_transition: boolean
  shop_employee_id: string | null     // NEVER display this to customers
  workstation_id: string | null       // NEVER display this to customers
  attachment_id: string | null
  customer_visible: boolean           // always true in this query
  notes: string | null
  scanned_at: string
  duration_seconds: number | null
}
```

---

## 5. Pattern Anchors

### Existing portal list page → `src/app/(portal)/my/page.tsx`

```typescript
import { requireCustomer } from '@/shared/auth-helpers'

export default async function CustomerJobsPage() {
  await requireCustomer()
  // ... render
}
```

Follow this exact auth guard pattern. The `requireCustomer()` call MUST be the first
line in the component body.

### Job detail page pattern → `src/app/(office)/jobs/[id]/page.tsx`

Mirror the layout structure:
- `params` typed as `Promise<{ jobId: string }>` (Next.js 16 — `await params`)
- `notFound()` import from `next/navigation`
- Header with job number + name
- Badge for status
- Two-column grid: details left, timeline right (or full-width timeline below)
- `<dl>` for field display with label/value pairs

### Key structural difference from office detail

The portal page uses `getMyJob` (not `getJobById`) — this query is scoped to the
customer's `company_id` via JWT claims. If the job doesn't belong to the customer's
company, `getMyJob` returns `null` and you call `notFound()`.

---

## 6. Hard Constraints

1. **`requireCustomer()` first** — every portal page must call this before any data fetch
2. **`notFound()` on missing job — NEVER `403`** — returning 404 for cross-tenant prevents
   enumeration attacks (attacker can't distinguish "exists but not yours" from "doesn't exist")
3. **Customer-visible timeline ONLY** — the `getCustomerVisibleTimeline` query already
   filters `customer_visible = true` server-side. But in the UI, NEVER display:
   - `shop_employee_id` (employee names / IDs)
   - `workstation_id` (internal workstation names)
   - `duration_seconds` (internal processing time)
   These fields may be present in the `TimelineEvent` type — ignore them in rendering.
4. **Renders on `track.*` host** — `src/proxy.ts` handles audience-domain enforcement.
   If a staff JWT hits this page, proxy redirects to `app.*`. No code needed here.
5. **`cookies()` is async** — always `await cookies()` (Next.js 16)
6. **Auth: `getUser()` only** — never `getSession()` for auth decisions
7. **TypeScript strict** — no `any`, no unguarded assertions
8. **Tailwind v4** — utility classes only
9. **No new shadcn primitives** — use Badge from `@/shared/ui/badge` if needed; nothing else
10. **Back link** — include a `<Link href="/my">` back to the jobs list. Note that
    `/my` is currently a placeholder ("Wave 1 — coming soon") — that's expected and
    out of scope. The full portal jobs list lands in a follow-up brief.

---

## 7. Out of Scope

- Photos gallery (no attachment viewer yet)
- Customer messaging / comments
- Magic-link refresh UI
- Email notification opt-in
- Any editable state (customers are read-only in Wave 1)
- Contact information display (customer already knows their own info)
- Portal layout redesign (current pass-through layout is fine)

---

## 8. Conflict Surfaces

| File | Rule |
|------|------|
| `src/app/(portal)/my/page.tsx` | DO NOT edit — existing placeholder; yours is a sibling route |
| `src/app/(portal)/layout.tsx` | DO NOT edit |
| `src/proxy.ts` | DO NOT edit |
| `src/modules/portal/index.ts` | DO NOT edit — all needed exports exist |
| `package.json` / `pnpm-lock.yaml` | DO NOT edit |
| `vitest.config.ts` | DO NOT edit — Brief 03 (parallel) owns the single allowed edit |

---

## 9. Acceptance Criteria

- [ ] `/my/{jobId}` renders job detail with: job_number, job_name, description,
      customer_po_number, intake_status, production_status (human-readable label),
      on_hold + hold_reason, due_date, color, created_at
- [ ] Timeline section renders `getCustomerVisibleTimeline` events in reverse
      chronological order (most recent first)
- [ ] Timeline entries show: event_type, from_status → to_status transition,
      scanned_at timestamp, notes (if any)
- [ ] Timeline entries NEVER show: shop_employee_id, workstation_id, duration_seconds
- [ ] Non-existent or cross-tenant job IDs return 404 (via `notFound()`)
- [ ] `requireCustomer()` is called before any data access
- [ ] Page uses `await params` (not direct destructure)
- [ ] Back link to `/my` is present
- [ ] `pnpm build` succeeds with zero TypeScript errors
- [ ] `pnpm test` — all 161+ existing tests still pass

---

## 10. Test Targets

No new vitest tests are strictly needed — this is a single Server Component page with
no client-side logic. The underlying queries have 7 tests in
`src/modules/portal/queries/portal.test.ts` and 5 tests in
`src/modules/timeline/queries/timeline.test.ts`.

### Minimum bar

- Zero regressions in existing 161 tests
- `pnpm build` clean

---

## 11. Compound Learning

If you encounter a novel pattern (e.g., portal-specific auth edge case,
timeline rendering quirk), append to `.loki/memory/timeline.json`:

```json
{
  "n": <next>,
  "module": "portal/job-detail-ui",
  "tests": 0,
  "lessons": ["<what you learned>"]
}
```
