# Brief 05 — Scan PWA (Shop Floor)

> **Batch:** B (dispatch after Batch A merges — highest complexity surface)
> **Complexity:** complex
> **Estimated RARV cycles:** 8–12

---

## 1. Surface

### Architectural premise (DESIGN.md §1422, §2007-2009)

**Each iPad is permanently bound to ONE workstation** via its synthetic Supabase user.
The `workstation_id` lives in JWT `app_metadata` (`getCurrentClaims().workstation_id`).
There is NO workstation-picker UI. The tablet boots straight into the EmployeePicker.

### Files to create

```
src/app/scan/
├── page.tsx                        # REPLACE existing stub — EmployeePicker entry (boot screen)
├── pin/
│   └── page.tsx                    # PIN pad for the picked employee → validate + claim
├── station/
│   └── page.tsx                    # Active station dashboard — ready to scan or manual entry
├── lookup/
│   └── page.tsx                    # Job found — pick target stage, optional photo, confirm
├── _components/
│   ├── employee-picker.tsx         # Employee tile grid (filter input if >12) — DESIGN.md §1427
│   ├── pin-pad.tsx                 # Numeric PIN pad (touch-optimized for iPad)
│   ├── scanner.tsx                 # @zxing/browser camera QR scanner
│   ├── manual-entry.tsx            # 8-16 char manual code input (min 8, max 16 per lookup schema)
│   ├── stage-picker.tsx            # Select target production stage
│   ├── photo-capture.tsx           # Camera → canvas → JPEG 0.7, max 1024px (capture only — no upload)
│   ├── heartbeat-provider.tsx      # Wraps children; fires heartbeat every 30s (DESIGN.md §2267)
│   └── offline-queue.tsx           # IndexedDB queue for offline scan events
└── layout.tsx                      # Scan-specific layout (no office nav; shows workstation name in header)

src/app/scan/manifest.webmanifest/
└── route.ts                        # PWA manifest route handler (returns JSON; Next.js 16 only auto-serves manifest.ts at app root)
```

**`manifest.ts` placement note:** Next.js 16 only auto-serves `app/manifest.{ts,json}`
from the app root, NOT subdirectories. Putting `src/app/scan/manifest.ts` would be
a no-op file. Two acceptable approaches:

1. **Route handler at `src/app/scan/manifest.webmanifest/route.ts`** (recommended for
   this brief — keeps PWA scoped to /scan):
   ```typescript
   export function GET() {
     return Response.json({
       name: 'Scan Station',
       short_name: 'Scan',
       start_url: '/scan',
       scope: '/scan/',
       display: 'standalone',
       background_color: '#000000',
       theme_color: '#000000',
       icons: [{ src: '/icon.png', sizes: '512x512', type: 'image/png' }],
     })
   }
   ```
   Then in `src/app/scan/layout.tsx`, add the link:
   `<link rel="manifest" href="/scan/manifest.webmanifest" />`

2. Global `src/app/manifest.ts` with `scope: '/scan/'` and `start_url: '/scan'` —
   simpler but installs PWA prompt on office routes too. **Not recommended.**

### File to REPLACE

| File | Action |
|------|--------|
| `src/app/scan/page.tsx` | DELETE the 1-line stub; replace with EmployeePicker boot screen |

### `/scan/enroll` is OUT OF SCOPE — known prerequisite

`/scan/enroll?token=...` is the workstation **enrollment** flow (token-based device
sign-in after `createWorkstation` returns an `enrollment_url`). It's a separate
auth surface that signs the iPad into the workstation's synthetic Supabase user.
It is referenced in `src/proxy.ts` line 86 but not yet built. Defer to a follow-up brief.

**Known consequence:** `requireShopStaff()` (used by every `/scan/*` page in this
brief) redirects unauthenticated users to `/scan` — and `/scan` itself calls
`requireShopStaff()`. Without `/scan/enroll`, an unauthenticated visitor will
see an infinite redirect loop. That's an accepted limitation: this brief produces
shippable UI for enrolled iPads but is not E2E-runnable until `/scan/enroll` lands.

For local testing in this brief, the operator can manually create a workstation
session by signing in as the workstation user via Supabase admin, or by
running an enrolled iPad against the dev server.

### Files you MAY read but MUST NOT edit

- `src/modules/scanning/index.ts` — barrel; all needed exports exist
- `src/modules/scanning/actions/*.ts` — understand API signatures
- `src/modules/scanning/queries/lookup.ts` — understand token lookup logic
- `src/shared/auth-helpers/require.ts` — `requireShopStaff()` import
- `src/shared/auth-helpers/claims.ts` — `getCurrentClaims()` for workstation_id
- `src/proxy.ts` — DO NOT EDIT; understand host routing

---

## 2. PRD Anchor

- `docs/DESIGN.md` §4.3 Module 5 (Scanning) — scan loop architecture
- `docs/DESIGN.md` §3.3 workstations — synthetic user, claim/release lifecycle
- `docs/DESIGN.md` §117 — `src/app/scan/` is NOT a route group (explicit `/scan` URL)
- `PRD.md` — QR scan loop is the core value proposition
- `CLAUDE.md` — workstation 1-hour TTL, photo compression standard, `@zxing/browser`, service-role FORBIDDEN in scanning
- `.loki/state/orchestrator.json` — scanning module: 30 tests passing

---

## 3. Pre-flight Assumptions

- Batch A merged; Batch B can proceed
- **`@zxing/browser` and `@zxing/library` installed in Step 0** (they were NOT in
  `package.json` as of brief authoring — operator must add them before dispatch)
- Clean git working tree

If `@zxing/browser` is still absent, write `.loki/signals/HUMAN_REVIEW_NEEDED` and stop.

---

## 4. Module APIs to Consume

All imports from `@/modules/scanning` (single barrel entry):

### Workstation Lifecycle

| Export | Type | Signature |
|--------|------|-----------|
| `claimWorkstation` | action | `(input: ClaimWorkstationInput) => Promise<ClaimResult>` |
| `recordWorkstationHeartbeat` | action | `() => Promise<{ ok: true }>` (no args) |
| `releaseWorkstation` | action | `() => Promise<{ ok: true }>` (no args) |

```typescript
// ClaimWorkstationInput
{ workstation_id: string; employee_id: string; expected_version: number }

// ClaimResult
{ ok: boolean; new_version?: number; reason?: string }
```

**`expected_version` flow** (optimistic concurrency on the workstation row):
1. `/scan` page reads the iPad's own workstation from `getCurrentClaims().workstation_id` (JWT)
2. Direct query loads `version` from that workstation row
3. Pass `version` into `/scan/pin?emp={id}&v={version}` as a URL param
4. PIN-validates → calls `claimWorkstation({ workstation_id: <from JWT>, employee_id, expected_version: version })`
5. If `ok: false` and `reason === 'workstation_in_use_or_stale_version'`: refetch the
   workstation row to get the new version, then retry once. If it fails again, bounce
   to `/scan` and tell the user to try again.
6. On success: the SQL returns `{ ok: true, version: <new_version> }` (note: SQL field
   name is `version`, not `new_version`).

**CRITICAL — `workstation_id` must match the JWT claim.** `claim_workstation` enforces
`p_workstation_id == app.workstation_id()` server-side. Passing any other workstation_id
raises `access_denied: can only claim own workstation`. ALWAYS read workstation_id from
`getCurrentClaims()`, never from URL params or user input.

**Wrapper type quirk to be aware of:** `src/modules/scanning/actions/workstation-lifecycle.ts`
declares `ClaimResult` with `new_version?: number` but the SQL function actually returns
the field as `version`. If you check for the new version in TypeScript, prefer accessing
`(result as { version?: number }).version` or just don't depend on the field — the only
field your UI logic needs is `ok` and `reason`. Filing a tracking issue to align the type
with the SQL is in operator scope, not loki scope.

**Stale-occupant auto-release:** `claim_workstation` succeeds (without release) if the
previous occupant's `last_activity_at` is older than `shop_settings.tablet_inactivity_hours`
(defaults to 4 hours). So after a shift ends, the next employee can claim the workstation
even if no one explicitly released it. Don't add UI for "force release" — that's already
implicit.

### PIN Validation

| Export | Type | Signature |
|--------|------|-----------|
| `validateEmployeePin` | action | `(input: ValidatePinInput) => Promise<ValidatePinResult>` |

```typescript
// ValidatePinInput
{ employee_id: string; pin: string }

// ValidatePinResult — discriminated union, switch on `ok` then `reason`
| { ok: true; employee_id: string }
| { ok: false; reason: 'tenant_mismatch' }
| { ok: false; reason: 'inactive' }
| { ok: false; reason: 'locked'; until: string }
| { ok: false; reason: 'invalid_pin'; attempts_remaining: number }
```

### Scan Event

| Export | Type | Signature |
|--------|------|-----------|
| `recordScanEvent` | action | `(input: RecordScanEventInput) => Promise<RecordScanEventResult>` |

```typescript
// RecordScanEventInput
{
  job_id: string;
  to_status: 'received'|'prep'|'coating'|'curing'|'qc'|'completed'|'picked_up';
  employee_id: string;
  workstation_id: string;
  notes?: string;
  attachment_id?: string;
}

// RecordScanEventResult
{ event_id: string; job_id: string; to_status: string }
```

**Side effects loki must understand** (verified against `0016_record_scan_event.sql`):

1. Inserts a `job_status_history` row with `event_type='stage_change'`, attribution
   to `(employee_id, workstation_id)`, and the from/to statuses.
2. Updates `jobs.production_status = to_status`.
3. **Auto-promotes `intake_status` from `'scheduled'` to `'in_production'`** on the
   FIRST scan (one-way). The job will visibly transition from "Scheduled" to
   "In Production" the moment a scan happens.
4. **Stamps `picked_up_at = now()`** the first time `to_status === 'picked_up'`.
   Later transitions away from `picked_up` do NOT clear it (history preserved
   in `job_status_history`).
5. The `compute_status_event_metadata` trigger (from migration 0005) fills
   `duration_seconds` and `is_rework` automatically — no caller action.

The wrapper raises a JS Error wrapping the SQL exception. Possible exceptions:
- `access_denied: scan requires staff session` (audience gate)
- `invalid_to_status: <status>` (not in the 7-stage enum)
- `job_not_found`
- `access_denied: cross-tenant scan blocked`
- `employee_not_found`
- `workstation_not_found`
- `access_denied: cross-tenant employee/workstation`

### Listing `shop_employees` for the EmployeePicker

**No existing module query exposes `shop_employees`.** The `staff` table (used by
Brief 04) is for office workers; `shop_employees` is the floor-worker PIN table.
You need a way to render a tile grid of employees on `/scan/pin` (the boot screen navigates there after an employee is selected).

**Recommended approach (in-brief):** add `src/modules/scanning/queries/employees.ts`
with a `listShopEmployees()` query. Pattern:

```typescript
import 'server-only'
import { createClient } from '@/shared/db/server'
import { requireShopStaff } from '@/shared/auth-helpers/require'

export interface ShopEmployeeTile {
  id: string
  display_name: string
  avatar_url: string | null
  is_active: boolean
}

export async function listShopEmployees(): Promise<ShopEmployeeTile[]> {
  await requireShopStaff()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shop_employees')
    .select('id, display_name, avatar_url, is_active')
    .eq('is_active', true)
    .is('archived_at', null)
    .order('display_name', { ascending: true })
  if (error) throw new Error(`Employee list failed: ${error.message}`)
  return data ?? []
}
```

Then re-export from `src/modules/scanning/index.ts`:
```typescript
export { listShopEmployees } from './queries/employees'
export type { ShopEmployeeTile } from './queries/employees'
```

This is the **one allowed module-barrel edit** in this brief. RLS already filters
`shop_employees` by tenant, so no app-side tenant filter needed.

### Job Lookup (scanner/manual entry step)

| Export | Type | Signature |
|--------|------|-----------|
| `lookupJobByPacketToken` | query | `(input: { token_or_prefix: string }) => Promise<ScannedJob \| null>` |

```typescript
// ScannedJob — returned by lookupJobByPacketToken (scanner/manual entry)
{
  id: string;
  job_number: string;
  job_name: string;
  intake_status: string;
  production_status: string | null;
  on_hold: boolean;
  packet_token: string;
  // NOTE: hold_reason is NOT in ScannedJob — see /scan/lookup page note below
}
```

**Ambiguity handling:** if `lookupJobByPacketToken` throws "Ambiguous packet token,"
prompt the user to enter more characters.

### `/scan/lookup` page — additional data fetch required

The scanner/manual entry calls `lookupJobByPacketToken` to get the job ID, then
navigates to `/scan/lookup?job={id}`. **The lookup page itself must do a fresh direct
query to get the full job row**, because `ScannedJob` does not include `hold_reason`
(and the data shouldn't be serialized through URL params).

Add a server component query on `/scan/lookup/page.tsx`:

```typescript
// Direct query — requireShopStaff() already called by this point
const supabase = await createClient()
const { data: job, error } = await supabase
  .from('jobs')
  .select('id, job_number, job_name, production_status, intake_status, on_hold, hold_reason')
  .eq('id', jobId)
  .maybeSingle()
if (!job) notFound()
```

The `jobs` RLS policy grants `staff_shop` SELECT access. No service-role needed.

---

## 5. Pattern Anchors

### There is NO existing pattern for this surface

The scan flow is architecturally unique in the codebase:
- It uses `requireShopStaff()` (not `requireOfficeStaff()`)
- It runs under the workstation's synthetic JWT (audience = `staff_shop`)
- It requires a PIN per scan (or per shift, depending on `pin_mode`)
- It's touch-optimized for iPad Safari
- It has offline capability

Do NOT mirror the office CRUD patterns. Instead, design a state-machine flow:

```
/scan (boot screen)
  ↳ Server Component: getCurrentClaims() → workstation_id from JWT
  ↳ Direct query: SELECT id, name, version FROM workstations WHERE id = workstation_id
  ↳ Header shows workstation name (e.g., "Booth 2 — Coating")
  ↳ <EmployeePicker> tile grid from listShopEmployees()
       ↳ filter input appears when count > 12
  ↳ tap employee tile → navigate /scan/pin?emp={id}&v={workstation_version}

/scan/pin?emp={id}&v={version}
  ↳ <PinPad> for 4-digit PIN
  ↳ submit → validateEmployeePin({ employee_id: emp, pin })
       ↳ ok:false reason='invalid_pin' → show "Wrong PIN. N attempts remaining"
       ↳ ok:false reason='locked' → show "Locked until HH:MM"
       ↳ ok:false reason='inactive' → show "Account inactive"
       ↳ ok:true → claimWorkstation({ workstation_id: <from JWT>, employee_id: emp, expected_version: v })
            ↳ ok:true → navigate /scan/station
            ↳ ok:false → refetch workstation row (new version), retry once, then bounce to /scan
  ↳ "Cancel" button → back to /scan

/scan/station
  ↳ <HeartbeatProvider> fires recordWorkstationHeartbeat() every 30s (DESIGN.md §2267)
  ↳ shows: workstation name, claimed employee display_name, "Scan QR" / "Manual entry" / "Switch user"
  ↳ "Switch user" → releaseWorkstation() → navigate /scan
  ↳ on heartbeat failure (auth error) → clear local state → navigate /scan ("Session expired")
  ↳ tap "Scan QR" → open <Scanner> overlay
  ↳ tap "Manual entry" → open <ManualEntry> overlay
  ↳ both paths → lookupJobByPacketToken({ token_or_prefix }) → /scan/lookup?job={id}

/scan/lookup?job={id}
  ↳ Server Component: direct query to `jobs` table for full row (including hold_reason)
  ↳ shows job: number, name, current stage, on_hold warning (with hold_reason)
  ↳ <StagePicker> 7 large buttons for production stages
  ↳ optional <PhotoCapture> (compress preview only — see "Photo upload deferred")
  ↳ optional notes textarea (max 2000 chars per Zod)
  ↳ Confirm → recordScanEvent({ job_id, to_status, employee_id, workstation_id, notes })
       ↳ success → navigate /scan/station with success toast
       ↳ error (DB function raises) → show inline error
```

### Key design decisions

1. **Client-heavy pages** — most `/scan/*` pages will be `'use client'` because they
   involve camera, PIN pad, IndexedDB, and heartbeat. Server Components fetch initial
   data (workstation row, employee list) and pass to Client Components as props.
   The pattern looks like:
   ```typescript
   // page.tsx (Server Component)
   import { listShopEmployees } from '@/modules/scanning'
   import { getCurrentClaims } from '@/shared/auth-helpers/claims'   // existing scan module convention uses deep path
   import { ClientPicker } from './client-picker'
   export default async function Page() {
     const claims = await getCurrentClaims()
     if (!claims.workstation_id) return <NotEnrolledMessage />
     const employees = await listShopEmployees()
     return <ClientPicker employees={employees} workstationId={claims.workstation_id} />
   }

   // client-picker.tsx ('use client')
   import { startTransition } from 'react'
   import { recordWorkstationHeartbeat } from '@/modules/scanning'
   // call as: startTransition(() => { recordWorkstationHeartbeat() })
   ```

2. **State management** — workstation session state (employee_id, claimed_at) should
   be held in React state + sessionStorage for persistence across tab refreshes. Do
   NOT put workstation_id in localStorage — it's already in JWT. sessionStorage (not
   localStorage) is preferred for employee context so a power cycle clears it.

3. **Heartbeat** — `heartbeat-provider.tsx` is a Client Component. Call
   `recordWorkstationHeartbeat()` (a Server Action) inside `setInterval` wrapped in
   `startTransition` (so the heartbeat doesn't block UI updates):
   ```typescript
   useEffect(() => {
     const id = setInterval(() => {
       startTransition(() => {
         recordWorkstationHeartbeat().catch((err) => {
           // 401/403 → session expired; clear local state and redirect
           router.replace('/scan')
         })
       })
     }, 30_000)
     return () => clearInterval(id)
   }, [])
   ```

---

## 6. Hard Constraints

### NON-NEGOTIABLE — violating any one is a blocking defect

1. **Service-role FORBIDDEN** — per CLAUDE.md, `src/modules/scanning/**` MUST NOT use
   service-role. All RPCs run in the workstation JWT context. The SECURITY DEFINER
   functions enforce identity/tenant/audience gates server-side.

2. **`jobs.production_status` direct UPDATE is FORBIDDEN** — column-level REVOKE enforces
   this (DESIGN.md §4.3 Module 3). Status changes go ONLY through `recordScanEvent`,
   which calls `app.record_scan_event()` SECURITY DEFINER.

3. **Workstation session = 1-hour TTL** — the workstation JWT expires after 1 hour.
   The heartbeat updates `workstations.last_activity_at` server-side (which prevents
   stale-occupant auto-release), but the JWT itself doesn't extend. When the
   heartbeat fails with an auth error, the UI must:
   - Clear local state
   - Redirect to `/scan` for re-authentication
   - Show a clear "Session expired" message
   - **Heartbeat interval = 30 seconds** (per DESIGN.md line 2267 + the `app.record_workstation_heartbeat`
     SQL function comment). Use `setInterval(..., 30_000)` in `<HeartbeatProvider>`.

4. **iPad Safari is the target device** — all touch interactions must work on Safari
   iOS. Test with:
   - Touch events (not just click)
   - Viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">`
   - No hover-dependent UI (no tooltips as primary info surface)
   - Camera access via `getUserMedia` (works on Safari 14.5+)

5. **`@zxing/browser` for QR scanning** — use `BrowserQRCodeReader` from `@zxing/browser`.
   Start video stream → decode → extract packet_token from QR data → call
   `lookupJobByPacketToken`. Handle camera permission denial gracefully (fall back to
   manual entry).

6. **Photo capture and compression — UPLOAD IS DEFERRED.** `src/shared/storage/index.ts`
   is currently a stub (`getSignedUrl` returns `''`). The actual storage upload
   pipeline lands in a follow-up brief. For THIS brief:
   - Implement camera capture + canvas compression (JPEG quality 0.7, max 1024px
     longest edge)
   - Show compressed preview in the UI
   - DO NOT attempt to upload to Supabase Storage — the upload helpers don't exist
   - DO NOT pass `attachment_id` to `recordScanEvent` (the field is optional —
     omit it; scan event still records successfully without a photo)
   - Stash the compressed Blob in component state for now; it'll be wired to upload
     in the follow-up brief
   - Compression standard (when upload lands later, must match):
   ```typescript
   function compressPhoto(file: File): Promise<Blob> {
     const img = new Image()
     const url = URL.createObjectURL(file)
     img.src = url
     await new Promise(r => img.onload = r)
     const { width, height } = img
     const maxDim = 1024
     const scale = Math.min(maxDim / width, maxDim / height, 1)
     const canvas = document.createElement('canvas')
     canvas.width = width * scale
     canvas.height = height * scale
     const ctx = canvas.getContext('2d')!
     ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
     URL.revokeObjectURL(url)
     return new Promise<Blob>((resolve, reject) => {
       canvas.toBlob((b) => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpeg', 0.7)
     })
   }
   ```

7. **PIN lockout** — 5 strikes then 15-min lockout, enforced by `app.validate_employee_pin`
   (migration 0015). The UI just surfaces the result:
   - `ok: true` → proceed
   - `reason: 'invalid_pin'` → show "Wrong PIN. N attempts remaining."
   - `reason: 'locked'` → show "Account locked until HH:MM. Contact a manager."
   - `reason: 'inactive'` → show "Account inactive."
   - `reason: 'tenant_mismatch'` → show generic "Unable to verify" (don't leak info)

8. **`cookies()` is async** — always `await cookies()` (Next.js 16)

9. **Auth: always `getUser()`** — never `getSession()`

10. **TypeScript strict** — no `any`, no non-null assertions without justification

11. **Production stages** — the valid `to_status` values are:
    `received | prep | coating | curing | qc | completed | picked_up`
    Show these as large, touch-friendly buttons in the stage picker.

12. **Any-to-any transitions** — DESIGN.md allows any production stage transition
    (supports rework, corrections). Do NOT enforce a linear sequence in the UI.
    Show all stages; the DB function validates what's allowed.

---

## 7. Out of Scope

- **`/scan/enroll`** — workstation device-enrollment token flow (referenced in
  `src/proxy.ts` line 86). Separate auth surface that signs the iPad into the
  workstation's synthetic Supabase user. Defer to a follow-up brief.
- **Photo upload to Supabase Storage** — `src/shared/storage/index.ts` is a stub.
  Compression in scope; upload is a follow-up brief.
- **`shop_employees` admin** (PIN reset, hire, deactivate) — that's a follow-up
  on Brief 04 settings work.
- Workflow template editor (Wave 4)
- Multi-stage batch scanning (scan 1 job → pick multiple stages at once)
- Customer notification triggers on stage transition
- Photo gallery / attachment viewer (no `attachment_id` available yet)
- Offline-first service worker with full background sync (IndexedDB queue for events
  is in scope; full SW registration is optional — implement if time permits)
- Push notifications
- Sound effects / haptic feedback
- Multi-camera selection UI (use default/environment camera)
- Admin view of active workstations (that's `/settings/workstations` in Brief 04)
- `src/proxy.ts` edits — if scan host needs routing, flag via `.loki/signals/HUMAN_REVIEW_NEEDED`

---

## 8. Conflict Surfaces

| File | Rule |
|------|------|
| `src/proxy.ts` | DO NOT EDIT — flag if needed |
| `src/app/(office)/layout.tsx` | DO NOT EDIT |
| `src/shared/ui/*` | Read-only — import existing only |
| `package.json` / `pnpm-lock.yaml` | DO NOT EDIT — `@zxing/browser` installed in Step 0 |
| `vitest.config.ts` | DO NOT EDIT |
| `src/modules/scanning/index.ts` | **One allowed edit:** add `listShopEmployees` re-export (see §4) |
| Other `src/modules/*/index.ts` | DO NOT EDIT |
| `src/shared/storage/index.ts` | DO NOT EDIT — upload pipeline is a follow-up brief |
| `src/shared/db/admin.ts` (`createServiceClient`) | **DO NOT IMPORT** — `eslint.config.js` block 2 explicitly blocks `@/shared/db/admin` from `src/app/**` and from non-`{settings,portal,auth}` modules. ESLint will fail if you try. |

If `@zxing/browser` is NOT in `package.json`, write to `.loki/signals/HUMAN_REVIEW_NEEDED`
and stop — the operator must install it.

---

## 9. Acceptance Criteria

### Boot — EmployeePicker (`/scan`)

- [ ] Server Component calls `requireShopStaff()` then `getCurrentClaims()`
- [ ] **Handle undefined `workstation_id` gracefully** — `JWTClaims.workstation_id`
      is typed as optional. If missing, the iPad isn't enrolled to a workstation.
      Render an "iPad not enrolled — visit /scan/enroll with the token from your
      shop admin" message rather than crashing
- [ ] If `workstation_id` present: direct query loads workstation row by id —
      gets `name`, `default_stage`, `physical_location`, `version`
- [ ] Header shows workstation name (e.g., "Booth 2 — Coating")
- [ ] `<EmployeePicker>` tile grid from `listShopEmployees()` — each tile shows
      `display_name` + `avatar_url` (if present)
- [ ] Filter input appears when employee count > 12 (DESIGN.md §1427, §2007)
- [ ] Empty employee list state: friendly message + "Contact a manager to add employees"
- [ ] Tapping an employee navigates to `/scan/pin?emp={id}&v={workstation_version}`

### PIN entry (`/scan/pin?emp={id}&v={version}`)

- [ ] Reads `emp` and `v` from query params
- [ ] `<PinPad>` with large touch targets (min 48x48 CSS px per WCAG); PIN masked (dots)
- [ ] On submit: `validateEmployeePin({ employee_id: emp, pin })` first
- [ ] Error states surfaced verbatim from discriminated-union result:
      - `invalid_pin` → "Wrong PIN. {attempts_remaining} attempts remaining"
      - `locked` → "Account locked until {until time}"
      - `inactive` → "Account inactive — see a manager"
      - `tenant_mismatch` → generic "Unable to verify" (no info leak)
- [ ] On PIN ok: `claimWorkstation({ workstation_id: <from getCurrentClaims()>, employee_id: emp, expected_version: v })`
- [ ] On `claimWorkstation` returning `{ ok: false, reason: 'workstation_in_use_or_stale_version' }`:
      refetch workstation row to get fresh `version`, retry once. If second attempt also fails,
      bounce to `/scan` with a "Workstation in use — try again" toast
- [ ] On claim success: navigate to `/scan/station`
- [ ] "Cancel" affordance → back to `/scan`

### Active Station (`/scan/station`)

- [ ] Shows current workstation name, claimed employee display_name
- [ ] `<HeartbeatProvider>` wraps the page; fires `recordWorkstationHeartbeat()` every 30s
- [ ] Heartbeat failure (caught error) → clear local state → redirect to `/scan`
      with "Session expired" toast
- [ ] Two entry paths: "Scan QR" button → camera scanner, "Manual entry" button → text input
- [ ] "Switch user" button calls `releaseWorkstation()` → navigate to `/scan`

### QR Scanner

- [ ] Uses `@zxing/browser` `BrowserQRCodeReader`
- [ ] Requests camera permission; handles denial gracefully (show manual entry fallback)
- [ ] Prefers environment-facing camera on iPad
- [ ] On decode: extracts token → calls `lookupJobByPacketToken` → navigates to `/scan/lookup`
- [ ] Handles "not found" (show error, let user retry)
- [ ] Handles "ambiguous" error (prompt for more characters)

### Manual Entry

- [ ] Input field accepts 8–16 characters (Zod schema: `min(8).max(16)`) — monospace display, uppercase normalization
- [ ] Submit → `lookupJobByPacketToken({ token_or_prefix: value })`
- [ ] Same not-found / ambiguous handling as QR scanner

### Job Lookup Result (`/scan/lookup`)

- [ ] Shows job: number, name, current production_status, on_hold state
- [ ] If on_hold: show warning banner with hold_reason (DB CHECK enforces `hold_reason IS NOT NULL` when `on_hold = true`, so it is safe to display directly)
- [ ] `<StagePicker>`: 7 large buttons for each production stage
- [ ] Current stage visually distinguished (highlighted / checked)
- [ ] Optional notes textarea (max 2000 chars per Zod schema)
- [ ] Optional `<PhotoCapture>` (compresses but DOES NOT upload — see Photo Capture criteria)
- [ ] Confirm button → `recordScanEvent({ job_id, to_status, employee_id, workstation_id, notes })`
- [ ] **Successful scan creates a `job_status_history` row server-side** via the
      `app.record_scan_event` SECURITY DEFINER function (this is the actual scan audit
      trail; `audit_log` and `logAuditEvent` are stubs in current Phase 1 state)
- [ ] On success: success toast + navigate `/scan/station`
- [ ] Error from `recordScanEvent` shown as alert (DB function raises with prefix
      `access_denied:` / `job_not_found` / `employee_not_found` / `workstation_not_found` /
      `invalid_to_status` — surface the message verbatim)

### Photo Capture (compression-only this brief)

- [ ] Canvas compression: JPEG quality 0.7, max 1024px longest edge
- [ ] Preview shown before confirming scan
- [ ] Compressed Blob held in component state — NOT uploaded
- [ ] `attachment_id` field is OMITTED from `recordScanEvent` input (upload pipeline TBD)
- [ ] Compression function exported / clearly placed for the follow-up upload brief to reuse

### Layout

- [ ] `/scan` layout has no office nav (separate from `(office)` route group)
- [ ] Full-viewport, touch-optimized — no small click targets
- [ ] Viewport meta: no user scaling (iPad kiosk mode)

### General

- [ ] `pnpm build` succeeds with zero TypeScript errors
- [ ] `pnpm test` — all existing tests still pass (zero regressions)

---

## 10. Test Targets

### New module test

`src/modules/scanning/queries/employees.test.ts` — covers the new `listShopEmployees`
query. Mirror pattern from `src/modules/scanning/queries/lookup.test.ts`:
```
vi.mock('@/shared/db/server', ...)
vi.mock('@/shared/auth-helpers/require', ...)
```

### New component tests (vitest + jsdom)

The client components warrant unit tests since they contain non-trivial client logic.

| Component | Test focus |
|-----------|-----------|
| `employee-picker.tsx` | Tile grid renders, filter input shows when count > 12, selection callback |
| `pin-pad.tsx` | PIN masking, submission, disabled state on lock |
| `manual-entry.tsx` | Input validation (8–16 chars: rejects short, enforces max 16), uppercase normalization |
| `stage-picker.tsx` | All 7 stages render, current stage highlighted, selection callback |
| `photo-capture.tsx` | Compression (mock canvas — verify dimensions + quality arg) |
| `heartbeat-provider.tsx` | Interval setup/cleanup, error → redirect |

### Pattern to mirror

Follow `src/modules/scanning/actions/pin.test.ts` for mock structure:
```
vi.mock('@/shared/db/server', ...)
vi.mock('@/shared/auth-helpers/require', ...)
vi.mock('@/shared/auth-helpers/claims', ...)
```

### Minimum bar

- 10+ new component tests
- Zero regressions in existing 161+ tests
- `pnpm build` clean

---

## 11. Compound Learning

This surface will generate significant compound learnings. Log every novel pattern:

```json
{
  "n": <next>,
  "module": "scan/pwa",
  "tests": <count>,
  "lessons": ["<what you learned>"]
}
```

Expected learning areas:
- `@zxing/browser` initialization + cleanup in React 18 strict mode
- Camera permission UX on iPad Safari
- IndexedDB queue pattern for offline events
- Heartbeat interval cleanup on unmount / visibilitychange
- Canvas → JPEG compression edge cases (EXIF orientation on iPad)
- Touch event handling differences between Safari and Chrome
