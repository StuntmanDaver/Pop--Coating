// src/shared/db/types.ts
// Placeholder Database type. Replaced by `supabase gen types typescript --local > src/shared/db/types.ts`
// when Supabase is fully wired (Plan 06 generates the real types from the live schema).
export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }>
    Views: Record<string, { Row: Record<string, unknown> }>
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>
    Enums: Record<string, string>
  }
}
