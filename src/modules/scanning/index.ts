// Public API for the Scanning module.
// docs/DESIGN.md §4.3 Module 5 (Scanning).
//
// CLAUDE.md hard rule: service-role usage is FORBIDDEN in this module. All RPCs run
// in the workstation's own JWT context (audience='staff_shop'), and the SECURITY
// DEFINER functions enforce identity/tenant/audience gates server-side.
//
// Wave-1 scope here: workstation lifecycle wrappers only (claim/heartbeat/release).
// PIN validation (app.validate_employee_pin) and scan event recording
// (app.record_scan_event) ship in Phase 3 alongside their migrations; the
// corresponding wrappers will land in this module then.

export {
  claimWorkstation,
  recordWorkstationHeartbeat,
  releaseWorkstation,
} from './actions/workstation-lifecycle'

export type { ClaimWorkstationInput } from './actions/workstation-lifecycle'
