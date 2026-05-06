'use server'
import { lookupJobByPacketToken as queryLookup } from '../queries/lookup'
export type { LookupJobByPacketTokenInput, ScannedJob } from '../queries/lookup'

// Server Action wrapper — allows client components to call lookupJobByPacketToken.
// The underlying query has `import 'server-only'`; exporting through a 'use server'
// action file makes it safe for the module barrel (which client components import).
export async function lookupJobByPacketToken(
  input: { token_or_prefix: string },
): ReturnType<typeof queryLookup> {
  return queryLookup(input)
}
