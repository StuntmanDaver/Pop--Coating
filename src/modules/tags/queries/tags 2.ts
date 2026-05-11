import 'server-only'
import { z } from 'zod'
import { createClient } from '@/shared/db/server'
import { requireOfficeStaff } from '@/shared/auth-helpers/require'

const ListTagsParamsSchema = z.object({
  q: z.string().max(50).optional(),
  limit: z.number().int().min(1).max(500).default(100),
})

export type ListTagsParams = z.infer<typeof ListTagsParamsSchema>

export interface TagListItem {
  id: string
  name: string
  color_hex: string
  created_at: string
}

export async function listTags(params: unknown = {}): Promise<TagListItem[]> {
  const parsed = ListTagsParamsSchema.parse(params)
  await requireOfficeStaff()
  const supabase = await createClient()

  let query = supabase
    .from('tags')
    .select('id, name, color_hex, created_at')
    .order('name', { ascending: true })
    .limit(parsed.limit)

  if (parsed.q) query = query.ilike('name', `%${parsed.q}%`)

  const { data, error } = await query
  if (error) throw new Error(`Tag list failed: ${error.message}`)
  return data ?? []
}

const ListTagsForEntitySchema = z.object({
  entity_type: z.enum(['job', 'company', 'contact', 'inventory_item']),
  entity_id: z.string().uuid(),
})

export interface TagOnEntity {
  tag_id: string
  name: string
  color_hex: string
}

export async function listTagsForEntity(input: unknown): Promise<TagOnEntity[]> {
  const parsed = ListTagsForEntitySchema.parse(input)
  await requireOfficeStaff()
  const supabase = await createClient()

  // Inner join via embedded select; PostgREST resolves the FK automatically.
  const { data, error } = await supabase
    .from('tagged_entities')
    .select('tag_id, tags!inner(name, color_hex)')
    .eq('entity_type', parsed.entity_type)
    .eq('entity_id', parsed.entity_id)

  if (error) throw new Error(`Tag-for-entity list failed: ${error.message}`)
  return (data ?? []).map((row) => {
    // PostgREST hint result: tags is the embedded relation
    const tag = (row as { tags: { name: string; color_hex: string } }).tags
    return { tag_id: row.tag_id, name: tag.name, color_hex: tag.color_hex }
  })
}
