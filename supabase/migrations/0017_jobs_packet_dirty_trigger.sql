-- 0017_jobs_packet_dirty_trigger.sql
-- Source: docs/DESIGN.md §4.3 Module 4 (Packets) — "After job edit, sets
-- jobs.packet_dirty = true. UI shows 'needs reprint' badge. After successful
-- PDF generation: packet_dirty = false."
--
-- This trigger automates the dirty-flag set: any UPDATE that changes a printed
-- field on a job marks the packet stale. The packets module clears the flag
-- back to false after a successful render. Stage transitions (which touch
-- production_status and sometimes intake_status / picked_up_at) do NOT mark the
-- packet dirty because those fields are not on the printed page.
--
-- Trigger fires BEFORE UPDATE so the new row carries packet_dirty=true on the
-- single write — saves a follow-up trigger pass.
--
-- The trigger is RLS-bypass-safe: it doesn't read other tables, just inspects
-- OLD vs NEW on the row being updated.

CREATE OR REPLACE FUNCTION app.mark_packet_dirty_on_content_change()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  -- Don't loop: if the only change is packet_dirty itself (e.g. the packets
  -- module flipping it back to false), pass through untouched.
  IF NEW.packet_dirty IS DISTINCT FROM OLD.packet_dirty
     AND NEW.job_name IS NOT DISTINCT FROM OLD.job_name
     AND NEW.description IS NOT DISTINCT FROM OLD.description
     AND NEW.customer_po_number IS NOT DISTINCT FROM OLD.customer_po_number
     AND NEW.color IS NOT DISTINCT FROM OLD.color
     AND NEW.coating_type IS NOT DISTINCT FROM OLD.coating_type
     AND NEW.part_count IS NOT DISTINCT FROM OLD.part_count
     AND NEW.weight_lbs IS NOT DISTINCT FROM OLD.weight_lbs
     AND NEW.dimensions_text IS NOT DISTINCT FROM OLD.dimensions_text
     AND NEW.due_date IS NOT DISTINCT FROM OLD.due_date
     AND NEW.priority IS NOT DISTINCT FROM OLD.priority
     AND NEW.company_id IS NOT DISTINCT FROM OLD.company_id
     AND NEW.contact_id IS NOT DISTINCT FROM OLD.contact_id
     AND NEW.job_number IS NOT DISTINCT FROM OLD.job_number THEN
    RETURN NEW;
  END IF;

  -- Set dirty on any printed-field change. job_number is included even though
  -- it's effectively immutable (UNIQUE per tenant) — defensive; if a future
  -- migration ever permits renumber, the packet flag still tracks correctly.
  IF NEW.job_name IS DISTINCT FROM OLD.job_name
     OR NEW.description IS DISTINCT FROM OLD.description
     OR NEW.customer_po_number IS DISTINCT FROM OLD.customer_po_number
     OR NEW.color IS DISTINCT FROM OLD.color
     OR NEW.coating_type IS DISTINCT FROM OLD.coating_type
     OR NEW.part_count IS DISTINCT FROM OLD.part_count
     OR NEW.weight_lbs IS DISTINCT FROM OLD.weight_lbs
     OR NEW.dimensions_text IS DISTINCT FROM OLD.dimensions_text
     OR NEW.due_date IS DISTINCT FROM OLD.due_date
     OR NEW.priority IS DISTINCT FROM OLD.priority
     OR NEW.company_id IS DISTINCT FROM OLD.company_id
     OR NEW.contact_id IS DISTINCT FROM OLD.contact_id
     OR NEW.job_number IS DISTINCT FROM OLD.job_number THEN
    NEW.packet_dirty := true;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER mark_packet_dirty_on_jobs_update
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION app.mark_packet_dirty_on_content_change();
