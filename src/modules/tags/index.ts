// Public API for the Tags module.
// docs/DESIGN.md §4.3 Module 10 (Tags). Polymorphic tag system spanning jobs, companies,
// contacts, and inventory_items.

export { createTag, deleteTag, applyTag, removeTag } from './actions/tags'
export type { CreateTagInput, ApplyTagInput } from './actions/tags'

export { listTags, listTagsForEntity } from './queries/tags'
export type { ListTagsParams, TagListItem, TagOnEntity } from './queries/tags'
