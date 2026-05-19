import { listTags } from '@/modules/tags'
import { TagManager } from './tag-manager'

export default async function TagsSettingsPage() {
  const tags = await listTags({ limit: 500 })

  return <TagManager tags={tags} />
}
