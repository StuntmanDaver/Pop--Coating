# Supabase Restore Drill Runbook

## Goal

Verify that production data can be restored before Wave 1 launch without weakening RLS or auth-hook invariants.

## Drill

- Create or select a non-production Supabase project/branch for the drill.
- Restore the latest backup into the drill target.
- Apply all repo migrations in order.
- Run `supabase test db` against the restored database.
- Verify `app.custom_access_token_hook` is present and does not write to tables.
- Verify `supabase_auth_admin` still has the attributes required by Supabase Auth.
- Confirm a staff JWT receives `tenant_id`, `audience`, `role`, and `staff_id` in `app_metadata`.

## Exit Criteria

- pgTAP passes.
- Cross-tenant RLS tests pass.
- `jobs.production_status` cannot be updated directly by `authenticated`.
- `app.record_scan_event()` can advance a job for the correct tenant only.
