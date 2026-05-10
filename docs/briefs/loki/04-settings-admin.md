# Brief 04 — Settings Admin Pages

> **Batch:** B (dispatch after Batch A merges — may share shadcn primitives with Brief 01)
> **Complexity:** standard
> **Estimated RARV cycles:** 5–7

---

## 1. Surface

### Scope clarification — `staff` vs `shop_employees`

The `staff` table holds **office workers** (admins, managers, office, shop). They have
auth users (email + password or magic link), `app_metadata.audience = 'staff_office'`
or `'staff_shop'`, and use the `inviteStaff` flow.

The `shop_employees` table is **separate** — it holds **floor workers** identified
by 4-digit PIN at the workstation. They have `pin_hash`, `failed_pin_attempts`,
`locked_until`. They do NOT have auth users individually — they share the workstation's
synthetic auth user. **`shop_employees` admin (PIN reset, hire, deactivate) is OUT OF
SCOPE for this brief** — defer to a follow-up brief.

The `staff/*` pages in this brief are office-staff CRUD only.

### Files to create

```
src/app/(office)/settings/
├── layout.tsx                     # Settings sub-nav (tabs: Staff / Workstations / Shop)
├── page.tsx                       # Redirects to /settings/staff (default tab)
├── staff/
│   ├── page.tsx                   # Staff list + invite button
│   ├── invite/
│   │   ├── page.tsx               # Invite staff form wrapper
│   │   ├── actions.ts             # inviteStaffFromForm Server Action
│   │   └── invite-staff-form.tsx  # Client component — useActionState
│   └── [id]/
│       ├── page.tsx               # Staff detail / edit
│       ├── actions.ts             # updateStaffFromForm + deactivateStaffAction
│       └── edit-staff-form.tsx    # Client component
├── workstations/
│   └── page.tsx                   # Workstations list + create button
└── shop/
    ├── page.tsx                   # Shop settings form (with lock-state awareness)
    ├── actions.ts                 # updateShopSettingsFromForm
    └── shop-settings-form.tsx     # Client component — lock-aware fields
```

### Files you MAY read but MUST NOT edit

- `src/modules/settings/index.ts` — barrel; all needed exports exist
- `src/modules/settings/actions/staff.ts` — understand invite/update/deactivate flow
- `src/modules/settings/actions/shop-settings.ts` — understand lock invariant
- `src/modules/settings/queries/staff.ts` — understand `StaffListItem` shape
- `src/modules/settings/actions/workstation.ts` — understand `createWorkstation`
- `src/app/(office)/layout.tsx` — provides outer office nav shell
- `src/shared/ui/*` — existing shadcn primitives

---

## 2. PRD Anchor

- `docs/DESIGN.md` §4.3 Module 8 (Settings) — staff, workstations, shop_settings
- `docs/DESIGN.md` §3.3 shop_settings — lock invariant for timezone/currency/prefix
- `PRD.md` — settings is Wave 1 scope
- `.loki/state/orchestrator.json` — settings module: 24 tests passing

---

## 3. Pre-flight Assumptions

- Batch A merged — companies CRUD patterns established
- Clean git working tree
- **No new shadcn primitives required** — existing CRUD pattern uses native HTML
  elements; mirror that. If you genuinely need a Dialog primitive for the
  deactivate confirm, prefer a simple inline confirm form (separate `<form>` with
  a "Confirm deactivate" button) over installing new deps.

---

## 4. Module APIs to Consume

All imports from `@/modules/settings` (single barrel entry):

### Staff

| Export | Type | Signature |
|--------|------|-----------|
| `inviteStaff` | action | `(input: InviteStaffInput) => Promise<StaffInviteResult>` |
| `updateStaff` | action | `(input: UpdateStaffInput) => Promise<{ id, ... }>` |
| `deactivateStaff` | action | `(input: { id }) => Promise<{ id: string }>` |
| `listStaff` | query | `(params?: { include_inactive? }) => Promise<StaffListItem[]>` |

```typescript
// InviteStaffInput
{ email: string; name: string; role: 'admin'|'manager'|'office'|'shop'; phone?: string|null }

// StaffListItem
{ id: string; email: string; name: string; role: string; phone: string|null; is_active: boolean; created_at: string }

// StaffInviteResult
{ staff: { id, tenant_id, email, role }; auth_user_id: string; invite_link: string|null }
```

### Workstations

| Export | Type | Signature |
|--------|------|-----------|
| `createWorkstation` | action | `(input: { name, default_stage?, location? }) => Promise<{ workstation, enrollment_url }>` |

```typescript
// CreateWorkstation input
{
  name: string;          // required, 1-100, unique per tenant (UNIQUE constraint)
  default_stage?: string;  // e.g. 'coating', 'qc' — defaults to null
  location?: string;       // physical_location text, e.g. "Booth 2"
}

// Return shape
{
  workstation: {
    id: string;
    tenant_id: string;
    name: string;
    default_stage: string | null;
    physical_location: string | null;
    device_token: string;       // 48-char URL-safe random — sensitive, treat as password
    auth_user_id: string;
    version: number;
    is_active: boolean;
    // ...
  };
  enrollment_url: string;       // e.g. "http://app.localhost:3000/scan/enroll?token=..."
                                // Display this PROMINENTLY so the operator can set up the iPad.
                                // Do NOT log it; treat it like a one-time secret.
}
```

**CRITICAL UX:** the `enrollment_url` returned from `createWorkstation` is the only
way an iPad gets enrolled. After create succeeds, show the URL in a copy-friendly
dialog or page — once the operator dismisses it without copying, the workstation is
unusable until token rotation lands (out of scope for Wave 1).

**SECURITY — `device_token` is a password-equivalent secret.** The returned
`workstation` object includes a raw `device_token` field (48-char URL-safe random
string). It is also embedded in `enrollment_url` as a query parameter.
- DO display: `enrollment_url` (in a copy box)
- DO NOT display: the raw `device_token` field by itself
- DO NOT display: the entire `workstation` object (it includes `device_token`)
- DO NOT log: anything containing the token (no `console.log(workstation)`,
  no Sentry capture of the result, no audit row that includes the token)
- Display only the safe subset: `id`, `name`, `default_stage`, `physical_location`,
  `created_at`. The enrollment URL goes in its own one-time-display box.

#### Listing workstations

No `listWorkstations` query exists in the settings module. Two options:
1. **Direct query** in the server component — use `supabase.from('workstations').select(...)`
   directly. Do NOT call `requireOfficeStaff()` again — the `(office)` layout already
   handles auth (constraint #3). Call `await createClient()` and query. Mirror the
   query structure in `src/modules/dashboard/queries/dashboard.ts` (`getActiveWorkstations`).
2. **Add a query** to `src/modules/settings/queries/workstations.ts` and re-export from
   the barrel. Cleaner long-term but adds module-edit scope. **Prefer option 1** to
   keep the brief contained.

Workstation columns to display: `id`, `name`, `default_stage`, `physical_location`,
current employee display name (joined), `last_activity_at`, `is_active`.

**Joining `current_employee_id` → `shop_employees.display_name`** uses Supabase JS
embed syntax (PostgREST resource embedding):
```typescript
const { data, error } = await supabase
  .from('workstations')
  .select(`
    id, name, default_stage, physical_location, last_activity_at, is_active,
    current_employee:shop_employees!current_employee_id(display_name)
  `)
  .order('name', { ascending: true })

// Each row's data.current_employee is { display_name: string } | null
```

Note: `version` and `device_token` are sensitive operational fields — do NOT
include them in the listing UI (version is only for the scan flow's optimistic
concurrency; device_token is a secret).

### Shop Settings

| Export | Type | Signature |
|--------|------|-----------|
| `updateShopSettings` | action | `(input: UpdateShopSettingsInput) => Promise<{ tenant_id }>` |

```typescript
// UpdateShopSettingsInput — the ONLY editable fields
{
  timezone?: string;                  // 1-64 chars, LOCKED after first job
  currency?: string;                  // exactly 3 chars (ISO), LOCKED after first job
  job_number_prefix?: string;         // 1-20 chars, LOCKED after first job
  business_hours?: Record<string, unknown>;  // free-form JSON
  brand_color_hex?: string | null;    // /^#[0-9A-Fa-f]{6}$/
  default_due_days?: number;          // 1-365
  tablet_inactivity_hours?: number;   // 1-24
  pin_mode?: 'per_shift' | 'per_scan';
}
```

**Fields NOT editable through this action** (visible in DB but not in input schema):
`logo_storage_path`, `job_number_seq`, `job_number_year`, `is_first_job_created`,
`updated_at`. Do NOT include them as form fields — they would be silently dropped
on submit and create operator confusion.

No `getShopSettings` query exists — fetch directly in the page's server component:
```typescript
const supabase = await createClient()
const { data } = await supabase
  .from('shop_settings')
  .select('timezone, currency, job_number_prefix, business_hours, brand_color_hex, default_due_days, tablet_inactivity_hours, pin_mode, is_first_job_created')
  .single()
```

The `is_first_job_created` boolean drives the lock UI — fetch it explicitly.

---

## 5. Pattern Anchors

### Settings layout with tabs

Create `src/app/(office)/settings/layout.tsx` with a horizontal tab bar:

```
[Staff]  [Workstations]  [Shop]
```

Use `<Link>` + pathname matching for active state. Pattern: simple horizontal nav
inside a section container, not a full-page layout override.

### Staff list → mirror jobs list

Follow `src/app/(office)/jobs/page.tsx`:
- Server Component with `include_inactive` toggle (searchParams)
- Table with columns: Name, Email, Role, Status (active/inactive badge), Actions
- "Invite staff" button links to `/settings/staff/invite`

### Invite form → mirror jobs new form

Follow `src/app/(office)/jobs/new/new-job-form.tsx` + `actions.ts`:
- `useActionState(inviteStaffFromForm, INITIAL)`
- Fields: email (required), name (required), role (select: admin/manager/office/shop), phone
- On success: show invite link or "Invite sent" message, link back to staff list
- On error: show error alert

### Edit staff form → mirror jobs edit form

Follow `src/app/(office)/jobs/[id]/edit/edit-job-form.tsx`:
- `useActionState(updateStaffFromForm.bind(null, staffId), INITIAL)`
- Fields: name, phone, role
- Deactivate button (separate form with `deactivateStaffAction`)
- Deactivate shows confirmation dialog before executing

### Shop settings form — UNIQUE PATTERN (lock invariant)

This page has a pattern NOT seen elsewhere in the codebase. Pay close attention:

1. Server component fetches `shop_settings` row AND queries `jobs` count for this tenant
2. If `is_first_job_created === true` OR jobs count > 0, the fields `timezone`, `currency`,
   and `job_number_prefix` MUST render as **read-only** (disabled inputs with visual
   indicator that they're locked)
3. UI must explain WHY they're locked: "These fields cannot be changed after the first
   job has been created because they're embedded in existing job numbers and packets."
4. Other fields (`brand_color_hex`, `default_due_days`, `tablet_inactivity_hours`,
   `pin_mode`, `business_hours`) remain editable regardless

---

## 6. Hard Constraints

1. **`cookies()` is async** — always `await cookies()` (Next.js 16)
2. **Auth: always `getUser()`** — never `getSession()`
3. **`requireOfficeStaff()` is already enforced by `src/app/(office)/layout.tsx`** —
   you do NOT need to call it again in each page. Calling it again works but is a
   redundant `auth.getUser()` round-trip per render. Pages that need claims data
   should call `getCurrentClaims()` directly.
4. **Service-role allowed** — the settings module is one of the permitted modules per CLAUDE.md
5. **TypeScript strict** — no `any`, no unguarded assertions
6. **Tailwind v4** — utility classes only
7. **Lock invariant is non-negotiable** — `timezone/currency/job_number_prefix` MUST be
   read-only after first job. The server action already enforces this and throws an error,
   but the UI must prevent the user from even attempting the edit (disabled state)
8. **Staff roles** — only `admin | manager | office | shop` are UI-selectable.
   `tenant_admin` and `agency_super_admin` are provisioned out-of-band (DESIGN.md)
9. **No new shadcn primitives** — use what Step 0 installed. If missing, flag via
   `.loki/signals/HUMAN_REVIEW_NEEDED`
10. **Cross-module imports** — only import from `@/modules/settings` barrel

---

## 7. Out of Scope

- Workstation enrollment URL rotation (no rotation mechanism in Wave 1)
- **`shop_employees` admin** (the PIN-using floor workers — separate table, separate flow)
- Staff PIN management (no PIN field on `staff` table for Wave 1)
- **`inviteStaff` partial-failure recovery UI** — if `auth.admin.generateLink` fails
  AFTER `auth.admin.createUser` succeeds, the staff row + auth user exist but no
  invite link was generated. The action surfaces an error but provides no resend
  mechanism. Document the limitation; do not build a "regenerate invite" surface
  in this brief
- **`createWorkstation` partial-failure** — 3-step operation (INSERT workstations →
  createUser → UPDATE auth_user_id). If step 2 (createUser) fails, the workstation
  row exists but is unusable. Action throws; surface the error. No recovery UI needed —
  operator can delete the orphaned workstation row via Supabase dashboard if needed.
  This is an accepted limitation for Wave 1.
- Audit log viewer (`audit_log` table exists; viewer is a future surface)
- Staff permission matrix editor
- Tenant branding preview (brand_color_hex is just a hex input for now)
- Business hours visual editor (raw JSON input or key-value pairs is fine for Wave 1)
- Editing `logo_storage_path` / `job_number_seq` / `job_number_year` — not in action input
- Nav link in `src/app/(office)/layout.tsx` — operator adds post-merge
- Email template customization

---

## 8. Conflict Surfaces

| File | Rule |
|------|------|
| `src/app/(office)/layout.tsx` | DO NOT add nav link — operator handles |
| `src/shared/ui/*` | Read-only — import existing, never create new |
| `package.json` / `pnpm-lock.yaml` | DO NOT edit |
| `vitest.config.ts` | DO NOT edit |
| `src/proxy.ts` | DO NOT edit |
| Any `src/modules/*/index.ts` | DO NOT edit |

---

## 9. Acceptance Criteria

### Staff

- [ ] `/settings` redirects to `/settings/staff`
- [ ] `/settings/staff` lists staff with name, email, role, active status (badge)
- [ ] `/settings/staff` supports `include_inactive` toggle (defaults to false)
- [ ] `/settings/staff/invite` creates a staff invite via `inviteStaff`
- [ ] On invite success: **the returned `invite_link` (string | null) is displayed
      PROMINENTLY** with a "Copy link" affordance. This is the operator's fallback
      if the email doesn't arrive — without it they have no way to onboard the user.
      If `invite_link` is null, show "Invitation email sent" message instead
- [ ] `/settings/staff/{id}` shows staff detail, edit form, deactivate option
- [ ] Edit form fields: name, phone, role (role select limited to UI-allowed values)
- [ ] **Deactivation is one-way** — `deactivateStaff` sets `is_active=false` AND
      `archived_at=now()`; there is no reactivation method. Confirm step must say
      so explicitly: "Deactivating cannot be undone from this UI. Continue?"
- [ ] Role select only offers: admin, manager, office, shop (NOT tenant_admin or
      agency_super_admin — those are provisioned out-of-band)

### Workstations

- [ ] `/settings/workstations` lists workstations with: name, default_stage,
      physical_location, last_activity_at, is_active
- [ ] Create workstation form accepts: name (required), default_stage, location
- [ ] On create success, the returned `enrollment_url` is displayed PROMINENTLY
      with a "Copy URL" affordance and an explanation that this is the only way
      to enroll the iPad
- [ ] Inactive workstations visually distinguished (badge or muted row)

### Shop

- [ ] `/settings/shop` renders current shop_settings values in a form
- [ ] `timezone`, `currency`, `job_number_prefix` are read-only when `is_first_job_created = true`
- [ ] Read-only fields show clear visual indicator + explanation text
- [ ] Editable fields save via `updateShopSettings`
- [ ] `pin_mode` renders as select with `per_shift` / `per_scan` options
- [ ] `brand_color_hex` renders as color input or text input with hex validation

### General

- [ ] Settings tab layout renders correctly with active state
- [ ] `pnpm build` succeeds with zero TypeScript errors
- [ ] `pnpm test` — all existing tests still pass

---

## 10. Test Targets

### Pattern to mirror

No new vitest tests strictly required — module actions/queries have 24 tests already.
If the Server Actions in `settings/*/actions.ts` files warrant unit tests, follow the
pattern from `src/app/(office)/jobs/new/actions.ts`.

### Minimum bar

- Zero regressions in existing test suite
- `pnpm build` clean

---

## 11. Compound Learning

Append to `.loki/memory/timeline.json` after each cycle:

```json
{
  "n": <next>,
  "module": "settings/admin-ui",
  "tests": 0,
  "lessons": ["<what you learned>"]
}
```

The lock invariant pattern (read state → conditionally disable fields) is novel in this
codebase — definitely worth logging as a compound learning if you find a clean pattern.
