// src/shared/audit/index.ts
// Phase 1 stubs. Full audit HOF + logAuditEvent land in Phase 4 (OPS-01).
// Service-role import allowed here per CLAUDE.md.
export type AuditAction = 'create' | 'update' | 'archive' | 'delete' | 'export' | 'login' | 'login_failed' | 'logout' | 'invite' | 'deactivate' | 'reset_pin' | 'pin_lockout' | 'regenerate_token' | 'enroll_workstation' | 'magic_link_request' | 'role_change'

// TODO(Phase 4 OPS-01): replace with real implementation that logs to audit_log via service-role client.
export function withAudit<T extends (...args: Parameters<T>) => ReturnType<T>>(fn: T): T {
  return fn
}

export async function logAuditEvent(_event: { action: AuditAction; entity_type: string; entity_id: string; changed_fields?: Record<string, unknown> }) {
  // TODO(Phase 4 OPS-01): writes to audit_log via service-role client.
  return
}
