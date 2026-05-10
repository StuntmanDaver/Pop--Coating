// src/shared/audit/index.ts
// Service-role import allowed here per AGENTS.md project guardrails.
import 'server-only'

import { headers } from 'next/headers'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'
import { createServiceClient } from '@/shared/db/admin'
import type { Json } from '@/shared/db/types'

export type AuditAction =
  | 'create'
  | 'update'
  | 'archive'
  | 'delete'
  | 'export'
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'invite'
  | 'deactivate'
  | 'reset_pin'
  | 'pin_lockout'
  | 'regenerate_token'
  | 'enroll_workstation'
  | 'magic_link_request'
  | 'role_change'
  | 'impersonate_start'
  | 'impersonate_end'
  | 'consent_token_issued'
  | 'consent_token_revoked'
  | 'module_toggle_changed'
  | 'domain_added'
  | 'domain_verified'
  | 'branding_updated'
  | 'workflow_template_cloned'
  | 'workflow_template_edited'

type AuditActorType = 'staff' | 'customer' | 'system'

export type AuditEvent = {
  action: AuditAction
  entity_type: string
  entity_id: string
  changed_fields?: Record<string, unknown>
  tenant_id?: string
  actor_type?: AuditActorType
  actor_id?: string | null
}

export function withAudit<T extends (...args: Parameters<T>) => ReturnType<T>>(fn: T): T {
  return fn
}

export async function logAuditEvent(event: AuditEvent) {
  const claims = event.tenant_id || event.actor_type === 'system' ? null : await getCurrentClaims()
  const tenantId = event.tenant_id ?? claims?.tenant_id
  if (!tenantId) {
    throw new Error('Audit log requires tenant_id')
  }

  const actor = resolveActor(event, claims)
  const request = await getRequestMetadata()
  const supabase = createServiceClient()

  const { error } = await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    entity_type: event.entity_type,
    entity_id: event.entity_id,
    action: event.action,
    changed_fields: event.changed_fields ? toJsonObject(event.changed_fields) : null,
    actor_type: actor.actor_type,
    actor_id: actor.actor_id,
    ip_address: request.ip_address,
    user_agent: request.user_agent,
  })

  if (error) {
    throw new Error(`Audit log insert failed: ${error.message}`)
  }
}

function resolveActor(
  event: AuditEvent,
  claims: Awaited<ReturnType<typeof getCurrentClaims>> | null
): { actor_type: AuditActorType; actor_id: string | null } {
  if (event.actor_type) {
    return { actor_type: event.actor_type, actor_id: event.actor_id ?? null }
  }

  if (!claims) {
    return { actor_type: 'system', actor_id: event.actor_id ?? null }
  }

  if (claims.audience === 'customer') {
    return { actor_type: 'customer', actor_id: claims.customer_user_id ?? null }
  }

  return { actor_type: 'staff', actor_id: claims.staff_id ?? null }
}

async function getRequestMetadata(): Promise<{ ip_address: string | null; user_agent: string | null }> {
  try {
    const h = await headers()
    const forwardedFor = h.get('x-forwarded-for')?.split(',')[0]?.trim()
    const realIp = h.get('x-real-ip')?.trim()

    return {
      ip_address: forwardedFor || realIp || null,
      user_agent: h.get('user-agent'),
    }
  } catch {
    return { ip_address: null, user_agent: null }
  }
}

function toJsonObject(value: Record<string, unknown>): { [key: string]: Json | undefined } {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, toJsonValue(item)])
  ) as { [key: string]: Json | undefined }
}

function toJsonValue(value: unknown): Json {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => (item === undefined ? null : toJsonValue(item)))
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, toJsonValue(item)])
    ) as { [key: string]: Json | undefined }
  }

  return String(value)
}
