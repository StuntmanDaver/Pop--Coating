'use server'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'
import { getCurrentClaims } from '@/shared/auth-helpers/claims'
import { logAuditEvent } from '@/shared/audit'

// Source: docs/DESIGN.md §3.3 tags + tagged_entities.
// DB CHECK enforces color_hex matches '#RRGGBB'; we mirror app-side for early failure.
// UNIQUE(tenant_id, name) is enforced by DB; we surface its message verbatim.

const HexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'color_hex must match #RRGGBB')
const EntityTypeSchema = z.enum(['job', 'company', 'contact', 'inventory_item'])

const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
  color_hex: HexColorSchema,
})

export type CreateTagInput = z.infer<typeof CreateTagSchema>

const DeleteTagSchema = z.object({ id: z.string().uuid() })

const ApplyTagSchema = z.object({
  tag_id: z.string().uuid(),
  entity_type: EntityTypeSchema,
  entity_id: z.string().uuid(),
})

export type ApplyTagInput = z.infer<typeof ApplyTagSchema>

interface TagRow {
  id: string
  tenant_id: string
  name: string
  color_hex: string
}

export async function createTag(input: unknown): Promise<TagRow> {
  const parsed = CreateTagSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireOfficeStaff()
  const claims = await getCurrentClaims()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tags')
    .insert({
      tenant_id: claims.tenant_id,
      name: parsed.data.name,
      color_hex: parsed.data.color_hex,
    })
    .select('id, tenant_id, name, color_hex')
    .single()

  if (error || !data) throw new Error(`Tag insert failed: ${error?.message ?? 'unknown'}`)

  await logAuditEvent({ action: 'create', entity_type: 'tag', entity_id: data.id })
  return data
}

export async function deleteTag(input: unknown): Promise<{ id: string }> {
  const parsed = DeleteTagSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireOfficeStaff()
  const supabase = await createClient()

  // tagged_entities rows cascade-delete via FK ON DELETE CASCADE.
  const { error } = await supabase.from('tags').delete().eq('id', parsed.data.id)
  if (error) throw new Error(`Tag delete failed: ${error.message}`)

  await logAuditEvent({ action: 'delete', entity_type: 'tag', entity_id: parsed.data.id })
  return { id: parsed.data.id }
}

export async function applyTag(input: unknown): Promise<{ tag_id: string; entity_type: string; entity_id: string }> {
  const parsed = ApplyTagSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireOfficeStaff()
  const claims = await getCurrentClaims()
  const supabase = await createClient()

  // PK is (tag_id, entity_type, entity_id) so re-applying the same tag is idempotent
  // via ON CONFLICT DO NOTHING. PostgREST exposes this via upsert with ignoreDuplicates.
  const { error } = await supabase.from('tagged_entities').upsert(
    {
      tenant_id: claims.tenant_id,
      tag_id: parsed.data.tag_id,
      entity_type: parsed.data.entity_type,
      entity_id: parsed.data.entity_id,
    },
    { onConflict: 'tag_id,entity_type,entity_id', ignoreDuplicates: true }
  )

  if (error) throw new Error(`Tag apply failed: ${error.message}`)

  return {
    tag_id: parsed.data.tag_id,
    entity_type: parsed.data.entity_type,
    entity_id: parsed.data.entity_id,
  }
}

export async function removeTag(input: unknown): Promise<{ tag_id: string; entity_type: string; entity_id: string }> {
  const parsed = ApplyTagSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  await requireOfficeStaff()
  const supabase = await createClient()

  const { error } = await supabase
    .from('tagged_entities')
    .delete()
    .eq('tag_id', parsed.data.tag_id)
    .eq('entity_type', parsed.data.entity_type)
    .eq('entity_id', parsed.data.entity_id)

  if (error) throw new Error(`Tag remove failed: ${error.message}`)

  return {
    tag_id: parsed.data.tag_id,
    entity_type: parsed.data.entity_type,
    entity_id: parsed.data.entity_id,
  }
}
