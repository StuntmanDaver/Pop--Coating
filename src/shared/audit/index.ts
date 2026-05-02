// src/shared/audit/index.ts
// Phase 1 stub. Full withAudit() HOF lands in Phase 4 (OPS-01).
// Service-role import allowed here per CLAUDE.md.
export type AuditAction = 'create' | 'update' | 'archive' | 'delete' | 'export' | 'login' | 'login_failed' | 'logout' | 'invite' | 'deactivate' | 'reset_pin' | 'pin_lockout' | 'regenerate_token' | 'enroll_workstation' | 'magic_link_request' | 'role_change'

export async function logAuditEvent(_event: { action: AuditAction; entity_type: string; entity_id: string; changed_fields?: Record<string, unknown> }) {
  // Phase 1 stub. Replaced by Phase 4 implementation that writes to audit_log via service-role client.
  return
}
