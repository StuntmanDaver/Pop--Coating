export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          body: string | null
          created_at: string
          customer_visible: boolean
          entity_id: string
          entity_type: string
          id: string
          occurred_at: string
          staff_id: string | null
          subject: string
          tenant_id: string
        }
        Insert: {
          activity_type: string
          body?: string | null
          created_at?: string
          customer_visible?: boolean
          entity_id: string
          entity_type: string
          id?: string
          occurred_at?: string
          staff_id?: string | null
          subject: string
          tenant_id: string
        }
        Update: {
          activity_type?: string
          body?: string | null
          created_at?: string
          customer_visible?: boolean
          entity_id?: string
          entity_type?: string
          id?: string
          occurred_at?: string
          staff_id?: string | null
          subject?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          caption: string | null
          created_at: string
          customer_visible: boolean
          entity_id: string
          entity_type: string
          filename: string
          height: number | null
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          tenant_id: string
          uploaded_by_staff_id: string | null
          width: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          customer_visible?: boolean
          entity_id: string
          entity_type: string
          filename: string
          height?: number | null
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          tenant_id: string
          uploaded_by_staff_id?: string | null
          width?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          customer_visible?: boolean
          entity_id?: string
          entity_type?: string
          filename?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          tenant_id?: string
          uploaded_by_staff_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_staff_id_fkey"
            columns: ["uploaded_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          changed_fields: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type: string
          changed_fields?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          changed_fields?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          archived_at: string | null
          billing_address: string | null
          billing_city: string | null
          billing_state: string | null
          billing_zip: string | null
          created_at: string
          customer_since: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_state: string | null
          shipping_zip: string | null
          tax_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_state?: string | null
          billing_zip?: string | null
          created_at?: string
          customer_since?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_state?: string | null
          shipping_zip?: string | null
          tax_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_state?: string | null
          billing_zip?: string | null
          created_at?: string
          customer_since?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_state?: string | null
          shipping_zip?: string | null
          tax_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_primary: boolean
          last_name: string | null
          notes: string | null
          phone: string | null
          role: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          is_primary?: boolean
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_primary?: boolean
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_users: {
        Row: {
          auth_user_id: string | null
          company_id: string
          contact_id: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login_at: string | null
          name: string | null
          tenant_id: string
        }
        Insert: {
          auth_user_id?: string | null
          company_id: string
          contact_id?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          name?: string | null
          tenant_id: string
        }
        Update: {
          auth_user_id?: string | null
          company_id?: string
          contact_id?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          name?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_users_company_id_fk"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_users_contact_id_fk"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      job_status_history: {
        Row: {
          attachment_id: string | null
          company_id: string
          customer_visible: boolean
          duration_seconds: number | null
          event_type: string
          from_status: string | null
          id: string
          is_rework: boolean
          is_unusual_transition: boolean
          job_id: string
          notes: string | null
          scanned_at: string
          shop_employee_id: string | null
          tenant_id: string
          to_status: string | null
          workstation_id: string | null
        }
        Insert: {
          attachment_id?: string | null
          company_id: string
          customer_visible?: boolean
          duration_seconds?: number | null
          event_type: string
          from_status?: string | null
          id?: string
          is_rework?: boolean
          is_unusual_transition?: boolean
          job_id: string
          notes?: string | null
          scanned_at?: string
          shop_employee_id?: string | null
          tenant_id: string
          to_status?: string | null
          workstation_id?: string | null
        }
        Update: {
          attachment_id?: string | null
          company_id?: string
          customer_visible?: boolean
          duration_seconds?: number | null
          event_type?: string
          from_status?: string | null
          id?: string
          is_rework?: boolean
          is_unusual_transition?: boolean
          job_id?: string
          notes?: string | null
          scanned_at?: string
          shop_employee_id?: string | null
          tenant_id?: string
          to_status?: string | null
          workstation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_attachment"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_status_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_status_history_shop_employee_id_fkey"
            columns: ["shop_employee_id"]
            isOneToOne: false
            referencedRelation: "shop_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_status_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_status_history_workstation_id_fkey"
            columns: ["workstation_id"]
            isOneToOne: false
            referencedRelation: "workstations"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          archived_at: string | null
          coating_type: string | null
          color: string | null
          company_id: string
          contact_id: string | null
          created_at: string
          created_by_staff_id: string | null
          customer_po_number: string | null
          description: string | null
          dimensions_text: string | null
          due_date: string | null
          hold_reason: string | null
          id: string
          intake_status: string
          job_name: string
          job_number: string
          notes: string | null
          on_hold: boolean
          packet_dirty: boolean
          packet_token: string
          parent_job_id: string | null
          part_count: number | null
          parts_completed_count: number | null
          parts_damaged_count: number
          parts_received_count: number | null
          parts_rework_count: number
          picked_up_at: string | null
          priority: string
          production_status: string | null
          qc_passed: boolean | null
          quoted_price: number | null
          tenant_id: string
          updated_at: string
          weight_lbs: number | null
        }
        Insert: {
          archived_at?: string | null
          coating_type?: string | null
          color?: string | null
          company_id: string
          contact_id?: string | null
          created_at?: string
          created_by_staff_id?: string | null
          customer_po_number?: string | null
          description?: string | null
          dimensions_text?: string | null
          due_date?: string | null
          hold_reason?: string | null
          id?: string
          intake_status?: string
          job_name: string
          job_number: string
          notes?: string | null
          on_hold?: boolean
          packet_dirty?: boolean
          packet_token: string
          parent_job_id?: string | null
          part_count?: number | null
          parts_completed_count?: number | null
          parts_damaged_count?: number
          parts_received_count?: number | null
          parts_rework_count?: number
          picked_up_at?: string | null
          priority?: string
          production_status?: string | null
          qc_passed?: boolean | null
          quoted_price?: number | null
          tenant_id: string
          updated_at?: string
          weight_lbs?: number | null
        }
        Update: {
          archived_at?: string | null
          coating_type?: string | null
          color?: string | null
          company_id?: string
          contact_id?: string | null
          created_at?: string
          created_by_staff_id?: string | null
          customer_po_number?: string | null
          description?: string | null
          dimensions_text?: string | null
          due_date?: string | null
          hold_reason?: string | null
          id?: string
          intake_status?: string
          job_name?: string
          job_number?: string
          notes?: string | null
          on_hold?: boolean
          packet_dirty?: boolean
          packet_token?: string
          parent_job_id?: string | null
          part_count?: number | null
          parts_completed_count?: number | null
          parts_damaged_count?: number
          parts_received_count?: number | null
          parts_rework_count?: number
          picked_up_at?: string | null
          priority?: string
          production_status?: string | null
          qc_passed?: boolean | null
          quoted_price?: number | null
          tenant_id?: string
          updated_at?: string
          weight_lbs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_staff_id_fkey"
            columns: ["created_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_parent_job_id_fkey"
            columns: ["parent_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_employees: {
        Row: {
          archived_at: string | null
          avatar_url: string | null
          created_at: string
          display_name: string
          failed_pin_attempts: number
          id: string
          is_active: boolean
          locked_until: string | null
          pin_hash: string
          staff_id: string | null
          tenant_id: string
        }
        Insert: {
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name: string
          failed_pin_attempts?: number
          id?: string
          is_active?: boolean
          locked_until?: string | null
          pin_hash: string
          staff_id?: string | null
          tenant_id: string
        }
        Update: {
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          failed_pin_attempts?: number
          id?: string
          is_active?: boolean
          locked_until?: string | null
          pin_hash?: string
          staff_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_employees_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_settings: {
        Row: {
          brand_color_hex: string | null
          business_hours: Json | null
          currency: string
          default_due_days: number | null
          is_first_job_created: boolean
          job_number_prefix: string
          job_number_seq: number
          job_number_year: number
          logo_storage_path: string | null
          pin_mode: string
          tablet_inactivity_hours: number | null
          tenant_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          brand_color_hex?: string | null
          business_hours?: Json | null
          currency?: string
          default_due_days?: number | null
          is_first_job_created?: boolean
          job_number_prefix?: string
          job_number_seq?: number
          job_number_year?: number
          logo_storage_path?: string | null
          pin_mode?: string
          tablet_inactivity_hours?: number | null
          tenant_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          brand_color_hex?: string | null
          business_hours?: Json | null
          currency?: string
          default_due_days?: number | null
          is_first_job_created?: boolean
          job_number_prefix?: string
          job_number_seq?: number
          job_number_year?: number
          logo_storage_path?: string | null
          pin_mode?: string
          tablet_inactivity_hours?: number | null
          tenant_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          archived_at: string | null
          auth_user_id: string | null
          created_at: string
          email: string
          hire_date: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          pin_hash: string | null
          role: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          auth_user_id?: string | null
          created_at?: string
          email: string
          hire_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          pin_hash?: string | null
          role: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          auth_user_id?: string | null
          created_at?: string
          email?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          pin_hash?: string | null
          role?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tagged_entities: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          tag_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          tag_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          tag_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tagged_entities_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tagged_entities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color_hex: string
          created_at: string
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          color_hex: string
          created_at?: string
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          color_hex?: string
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_domains: {
        Row: {
          audience: string
          created_at: string
          host: string
          id: string
          tenant_id: string
        }
        Insert: {
          audience: string
          created_at?: string
          host: string
          id?: string
          tenant_id: string
        }
        Update: {
          audience?: string
          created_at?: string
          host?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      workstations: {
        Row: {
          auth_user_id: string | null
          created_at: string
          current_employee_id: string | null
          current_employee_id_set_at: string | null
          default_stage: string | null
          device_token: string
          id: string
          is_active: boolean
          last_activity_at: string | null
          name: string
          physical_location: string | null
          tenant_id: string
          updated_at: string
          version: number
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          current_employee_id?: string | null
          current_employee_id_set_at?: string | null
          default_stage?: string | null
          device_token: string
          id?: string
          is_active?: boolean
          last_activity_at?: string | null
          name: string
          physical_location?: string | null
          tenant_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          current_employee_id?: string | null
          current_employee_id_set_at?: string | null
          default_stage?: string | null
          device_token?: string
          id?: string
          is_active?: boolean
          last_activity_at?: string | null
          name?: string
          physical_location?: string | null
          tenant_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "workstations_current_employee_id_fkey"
            columns: ["current_employee_id"]
            isOneToOne: false
            referencedRelation: "shop_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workstations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
