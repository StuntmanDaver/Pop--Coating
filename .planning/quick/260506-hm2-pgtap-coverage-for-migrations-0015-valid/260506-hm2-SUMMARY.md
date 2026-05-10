---
quick_id: 260506-hm2
status: complete
date: 2026-05-06
---

# Summary: pgTAP coverage for migrations 0015/0016/0017

## What was done

Created three new pgTAP test files under `supabase/tests/functions/`:

### test_validate_employee_pin.sql — 8 tests
- Correct PIN → `{ok:true, employee_id}`
- Nonexistent employee → `tenant_mismatch` (anti-enumeration guard)
- Cross-tenant employee → `tenant_mismatch`
- Inactive employee → `inactive`
- Locked employee → `locked`
- Wrong PIN (fresh employee) → `{ok:false, reason:invalid_pin, attempts_remaining:4}`
- 5th consecutive failure → `attempts_remaining:0` (lockout triggered)
- Expired lockout does not block correct PIN

### test_record_scan_event.sql — 13 tests
- Anon JWT → `access_denied: scan requires staff session`
- Customer JWT → `access_denied: scan requires staff session`
- Invalid `to_status` → `invalid_to_status:` exception
- Nonexistent job → `job_not_found`
- Cross-tenant job → `access_denied: cross-tenant scan blocked`
- Nonexistent employee → `employee_not_found`
- Nonexistent workstation → `workstation_not_found`
- Happy path returns non-null event UUID
- `job_status_history` row has correct `to_status`
- `jobs.production_status` updated after scan
- `intake_status` promoted `scheduled → in_production` on first scan
- `picked_up_at` stamped when `to_status = 'picked_up'`
- `picked_up_at` NOT overwritten on subsequent `picked_up` scan

### test_jobs_packet_dirty_trigger.sql — 10 tests
- Updating `job_name`, `color`, `coating_type`, `part_count`, `due_date`, `priority`, `job_number` each set `packet_dirty=true`
- Loop guard: updating only `packet_dirty` itself passes through unchanged
- `notes` update (non-printed) does NOT set `packet_dirty`
- `production_status`/`intake_status` update does NOT set `packet_dirty`

## Files created
- `supabase/tests/functions/test_validate_employee_pin.sql`
- `supabase/tests/functions/test_record_scan_event.sql`
- `supabase/tests/functions/test_jobs_packet_dirty_trigger.sql`

## Total test assertions
31 pgTAP assertions across 3 files (8 + 13 + 10).
