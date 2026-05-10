// Public API for the Settings module.
// docs/DESIGN.md §4.3 Module 8 (Settings).
// Service-role usage is permitted here per CLAUDE.md (synthetic workstation users +
// staff invites via auth.admin.*).

export { createWorkstation } from './actions/workstation'

export { inviteStaff, updateStaff, deactivateStaff } from './actions/staff'
export type { InviteStaffInput, UpdateStaffInput } from './actions/staff'

export { listStaff } from './queries/staff'
export type { ListStaffParams, StaffListItem } from './queries/staff'

export { updateShopSettings } from './actions/shop-settings'
export type { UpdateShopSettingsInput } from './actions/shop-settings'
