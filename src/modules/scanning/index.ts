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
export type { LookupJobByPacketTokenInput, ScannedJob } from './actions/lookup'

// listShopEmployees is server-only — import from '@/modules/scanning/queries/employees'
// directly in Server Components. It is NOT re-exported here to keep the barrel safe
// for client component imports (server-only modules cannot cross the client bundle boundary).
// Type-only export is safe: `export type` is erased at compile time, no runtime import generated.
export type { ShopEmployeeTile } from './queries/employees'
