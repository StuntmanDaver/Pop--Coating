export interface ShopEmployeeTile {
  id: string
  display_name: string
  avatar_url: string | null
  is_active: boolean
}

export interface LookupJobByPacketTokenInput {
  token_or_prefix: string
}

export interface ScannedJob {
  id: string
  job_number: string
  job_name: string
  intake_status: string
  production_status: string | null
  on_hold: boolean
  packet_token: string
}
