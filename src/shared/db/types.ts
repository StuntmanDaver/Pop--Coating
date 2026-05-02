// src/shared/db/types.ts
// Placeholder Database type. Replaced by `supabase gen types typescript --local > src/shared/db/types.ts`
// when Supabase is fully wired (Plan 06 generates the real types from the live schema).
//
// NOTE: Table stubs here must be kept in sync with supabase/migrations/ until real types are generated.
// Each table entry follows the Supabase-generated { Row, Insert, Update } shape.

type GenericTable = {
  Row: Record<string, unknown>
  Insert: Record<string, unknown>
  Update: Record<string, unknown>
}

type WorkstationRow = {
  id: string
  tenant_id: string
  name: string
  default_stage: string | null
  physical_location: string | null
  device_token: string
  auth_user_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type WorkstationInsert = {
  id?: string | undefined
  tenant_id: string
  name: string
  default_stage?: string | null | undefined
  physical_location?: string | null | undefined
  device_token: string
  auth_user_id?: string | null | undefined
  is_active?: boolean | undefined
  created_at?: string | undefined
  updated_at?: string | undefined
}

type WorkstationUpdate = Partial<WorkstationRow>

// Tables interface: named tables for type safety + index signature for other tables
interface Tables {
  workstations: {
    Row: WorkstationRow
    Insert: WorkstationInsert
    Update: WorkstationUpdate
  }
  [tableName: string]: GenericTable
}

export type Database = {
  public: {
    Tables: Tables
    Views: Record<string, { Row: Record<string, unknown> }>
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>
    Enums: Record<string, string>
  }
}
