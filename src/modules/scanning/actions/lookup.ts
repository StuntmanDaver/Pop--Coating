'use server'
import { lookupJobByPacketToken as queryLookup } from '../queries/lookup'

// Server Action wrapper — allows client components to call lookupJobByPacketToken.
// Types live in types.ts (side-effect-free) so Turbopack doesn't follow the chain
// into queries/lookup.ts which has `import 'server-only'`.
export async function lookupJobByPacketToken(
  input: { token_or_prefix: string },
): ReturnType<typeof queryLookup> {
  return queryLookup(input)
}
