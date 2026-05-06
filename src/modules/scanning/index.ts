// Public API for the Scanning module.
// docs/DESIGN.md §4.3 Module 5 (Scanning).
//
// CLAUDE.md hard rule: service-role usage is FORBIDDEN in this module. All RPCs
// run in the workstation's own JWT context (audience='staff_shop'); SECURITY
// DEFINER functions enforce identity/tenant/audience gates server-side.

export {
  claimWorkstation,
  recordWorkstationHeartbeat,
  releaseWorkstation,
} from './actions/workstation-lifecycle'
export type { ClaimWorkstationInput } from './actions/workstation-lifecycle'

export { validateEmployeePin } from './actions/pin'
export type { ValidatePinInput, ValidatePinResult } from './actions/pin'

export { recordScanEvent } from './actions/scan-event'
export type { RecordScanEventInput, RecordScanEventResult } from './actions/scan-event'

export { lookupJobByPacketToken } from './actions/lookup'

// listShopEmployees is server-only — import from '@/modules/scanning/queries/employees'
// directly in Server Components. It is NOT re-exported here to keep the barrel safe
// for client component imports.
// All types live in the side-effect-free types.ts so Turbopack never follows a
// re-export chain into server-only query files.
export type { ShopEmployeeTile, LookupJobByPacketTokenInput, ScannedJob } from './types'
