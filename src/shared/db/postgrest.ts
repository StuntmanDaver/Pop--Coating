// Helper for safely embedding user input in PostgREST `.or()` filter strings.
//
// Why this exists: `.or('first_name.ilike.%${q}%,last_name.ilike.%${q}%')` looks
// safe but PostgREST splits the string on top-level commas/parens/colons. A
// malicious or accidentally weird `q` like `a,role.eq.admin` injects a new
// filter clause. RLS still bounds reads to the caller's tenant, so the security
// impact is small, but the resulting query may match unintended rows or 400.
//
// This helper percent-encodes the metacharacters PostgREST treats specially in
// reserved positions of an `or()` string. Filter values are still wrapped in
// the caller's `%...%` ilike pattern.

// encodeURIComponent leaves parens / single quotes / asterisks unencoded
// (they're "unreserved" per RFC 3986), so we map the PostgREST metacharacters
// explicitly. PostgREST treats commas as filter separators, parens as group
// delimiters, and colons as operator-arg delimiters in or() strings.
const POSTGREST_OR_ESCAPES: Record<string, string> = {
  ',': '%2C',
  '(': '%28',
  ')': '%29',
  ':': '%3A',
}

const POSTGREST_OR_RESERVED = /[,():]/g

export function escapeForOr(value: string): string {
  return value.replace(POSTGREST_OR_RESERVED, (ch) => POSTGREST_OR_ESCAPES[ch] ?? ch)
}
