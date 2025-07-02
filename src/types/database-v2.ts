export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          code: string | null
          contact_email: string | null
          client_rep_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code?: string | null
          contact_email?: string | null
          client_rep_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string | null
          contact_email?: string | null
          client_rep_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organizations_client_rep"
            columns: ["client_rep_id"]
            isOneToOne: false
            referencedRelation: "client_reps"
            referencedColumns: ["id"]
          }
        ]
      }
      client_reps: {
        Row: {
          id: string
          user_id: string | null
          full_name: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          full_name: string
          email: string
          role_title: string | null
          is_primary: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          full_name: string
          email: string
          role_title?: string | null
          is_primary?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string | null
          full_name?: string
          email?: string
          role_title?: string | null
          is_primary?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          organization_id: string | null
          contact_id: string | null
          client_rep_id: string | null
          role: Database['public']['Enums']['user_role']
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id?: string | null
          contact_id?: string | null
          client_rep_id?: string | null
          role?: Database['public']['Enums']['user_role']
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          contact_id?: string | null
          client_rep_id?: string | null
          role?: Database['public']['Enums']['user_role']
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_client_rep_id_fkey"
            columns: ["client_rep_id"]
            isOneToOne: false
            referencedRelation: "client_reps"
            referencedColumns: ["id"]
          }
        ]
      }
      applications: {
        Row: {
          id: string
          organization_id: string
          title: string
          call_type: Database['public']['Enums']['call_type']
          funding_stream: string | null
          application_reference: string | null
          award_reference: string | null
          total_awarded: number | null
          application_year: number | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          call_type: Database['public']['Enums']['call_type']
          funding_stream?: string | null
          application_reference?: string | null
          award_reference?: string | null
          total_awarded?: number | null
          application_year?: number | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          call_type?: Database['public']['Enums']['call_type']
          funding_stream?: string | null
          application_reference?: string | null
          award_reference?: string | null
          total_awarded?: number | null
          application_year?: number | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      activities: {
        Row: {
          id: string
          application_id: string
          activity_reference: string | null
          description: string
          planned_start_date: string | null
          planned_end_date: string | null
          budget_allocated: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          activity_reference?: string | null
          description: string
          planned_start_date?: string | null
          planned_end_date?: string | null
          budget_allocated?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          activity_reference?: string | null
          description?: string
          planned_start_date?: string | null
          planned_end_date?: string | null
          budget_allocated?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_progress: {
        Row: {
          id: string
          activity_id: string
          reporting_period_start: string
          reporting_period_end: string
          status: Database['public']['Enums']['activity_status'] | null
          progress_narrative: string | null
          challenges: string | null
          budget_spent: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          activity_id: string
          reporting_period_start: string
          reporting_period_end: string
          status?: Database['public']['Enums']['activity_status'] | null
          progress_narrative?: string | null
          challenges?: string | null
          budget_spent?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          activity_id?: string
          reporting_period_start?: string
          reporting_period_end?: string
          status?: Database['public']['Enums']['activity_status'] | null
          progress_narrative?: string | null
          challenges?: string | null
          budget_spent?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_progress_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          }
        ]
      }
      application_financials: {
        Row: {
          id: string
          application_id: string
          reporting_period_start: string
          reporting_period_end: string
          funds_received: number | null
          funds_spent: number | null
          funds_prior_year: number | null
          financial_context: string | null
          project_allocations_total: number | null
          non_project_allocations_total: number | null
          grand_total: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          reporting_period_start: string
          reporting_period_end: string
          funds_received?: number | null
          funds_spent?: number | null
          funds_prior_year?: number | null
          financial_context?: string | null
          project_allocations_total?: number | null
          non_project_allocations_total?: number | null
          grand_total?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          reporting_period_start?: string
          reporting_period_end?: string
          funds_received?: number | null
          funds_spent?: number | null
          funds_prior_year?: number | null
          financial_context?: string | null
          project_allocations_total?: number | null
          non_project_allocations_total?: number | null
          grand_total?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_financials_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          }
        ]
      }
      language_expenditures: {
        Row: {
          id: string
          application_id: string
          reporting_period_start: string
          reporting_period_end: string
          ethnologue_code: string
          language_name: string
          amount_spent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          reporting_period_start: string
          reporting_period_end: string
          ethnologue_code: string
          language_name: string
          amount_spent: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          reporting_period_start?: string
          reporting_period_end?: string
          ethnologue_code?: string
          language_name?: string
          amount_spent?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "language_expenditures_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          }
        ]
      }
      application_reports: {
        Row: {
          id: string
          application_id: string
          reporting_period_start: string
          reporting_period_end: string
          progress_narrative: string | null
          variance_narrative: string | null
          financial_summary_narrative: string | null
          status: Database['public']['Enums']['report_status']
          submitted_at: string | null
          submitted_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          reporting_period_start: string
          reporting_period_end: string
          progress_narrative?: string | null
          variance_narrative?: string | null
          financial_summary_narrative?: string | null
          status?: Database['public']['Enums']['report_status']
          submitted_at?: string | null
          submitted_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          reporting_period_start?: string
          reporting_period_end?: string
          progress_narrative?: string | null
          variance_narrative?: string | null
          financial_summary_narrative?: string | null
          status?: Database['public']['Enums']['report_status']
          submitted_at?: string | null
          submitted_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_reports_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_reports_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      project_allocations: {
        Row: {
          id: string
          application_id: string
          reporting_period_start: string
          reporting_period_end: string
          language_name: string
          ethnologue_code: string
          country: string
          dialect_rolv_number: string | null
          amount_allocated: number
          all_access_goal: string | null
          eligible_for_eten_funding: boolean | null
          all_access_status: string | null
          language_population_group: string | null
          first_language_population: number | null
          egids_level: string | null
          is_sign_language: boolean | null
          luminations_region: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          reporting_period_start: string
          reporting_period_end: string
          language_name: string
          ethnologue_code: string
          country: string
          dialect_rolv_number?: string | null
          amount_allocated?: number
          all_access_goal?: string | null
          eligible_for_eten_funding?: boolean | null
          all_access_status?: string | null
          language_population_group?: string | null
          first_language_population?: number | null
          egids_level?: string | null
          is_sign_language?: boolean | null
          luminations_region?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          reporting_period_start?: string
          reporting_period_end?: string
          language_name?: string
          ethnologue_code?: string
          country?: string
          dialect_rolv_number?: string | null
          amount_allocated?: number
          all_access_goal?: string | null
          eligible_for_eten_funding?: boolean | null
          all_access_status?: string | null
          language_population_group?: string | null
          first_language_population?: number | null
          egids_level?: string | null
          is_sign_language?: boolean | null
          luminations_region?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_allocations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          }
        ]
      }
      project_allocation_partners: {
        Row: {
          id: string
          project_allocation_id: string
          partner_organization_name: string
          created_at: string
        }
        Insert: {
          id?: string
          project_allocation_id: string
          partner_organization_name: string
          created_at?: string
        }
        Update: {
          id?: string
          project_allocation_id?: string
          partner_organization_name?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_allocation_partners_project_allocation_id_fkey"
            columns: ["project_allocation_id"]
            isOneToOne: false
            referencedRelation: "project_allocations"
            referencedColumns: ["id"]
          }
        ]
      }
      non_project_allocations: {
        Row: {
          id: string
          application_id: string
          reporting_period_start: string
          reporting_period_end: string
          allocation_type: string
          amount: number
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          reporting_period_start: string
          reporting_period_end: string
          allocation_type: string
          amount?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          reporting_period_start?: string
          reporting_period_end?: string
          allocation_type?: string
          amount?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "non_project_allocations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          }
        ]
      }
      import_logs: {
        Row: {
          id: string
          imported_by: string
          file_name: string
          import_type: string
          records_processed: number | null
          records_imported: number | null
          errors: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          imported_by: string
          file_name: string
          import_type: string
          records_processed?: number | null
          records_imported?: number | null
          errors?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          imported_by?: string
          file_name?: string
          import_type?: string
          records_processed?: number | null
          records_imported?: number | null
          errors?: string[] | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      funding_stream_report: {
        Row: {
          application_id: string
          organization_name: string
          application_title: string
          funding_stream: string | null
          reporting_period_start: string | null
          reporting_period_end: string | null
          funds_received: number | null
          funds_spent: number | null
          funds_prior_year: number | null
          project_allocations_total: number | null
          non_project_allocations_total: number | null
          grand_total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_allocation_summary: {
        Args: {
          p_application_id: string
          p_reporting_period_start: string
          p_reporting_period_end: string
        }
        Returns: {
          project_count: number
          project_total: number
          indirect_costs: number
          assessments: number
          unused_funds: number
          other_allocations: number
          non_project_total: number
          grand_total: number
          funds_received: number
          variance: number
        }[]
      }
      validate_percentage_constraints: {
        Args: {
          p_application_id: string
          p_reporting_period_start: string
          p_reporting_period_end: string
        }
        Returns: {
          constraint_type: string
          amount: number
          max_allowed: number
          percentage: number
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      user_role: "admin" | "staff" | "org_user"
      call_type: "Translation Investment" | "illumiNations Undesignated" | "Translation Tools" | "Capacity Building - Quality Assurance"
      activity_status: "Not Started" | "In Progress" | "Behind Schedule" | "On Track" | "Ahead of Schedule" | "Complete" | "Cancelled"
      report_status: "not_started" | "draft" | "submitted"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Organization = Database['public']['Tables']['organizations']['Row']
export type ClientRep = Database['public']['Tables']['client_reps']['Row']
export type Contact = Database['public']['Tables']['contacts']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Application = Database['public']['Tables']['applications']['Row']
export type Activity = Database['public']['Tables']['activities']['Row']
export type ActivityProgress = Database['public']['Tables']['activity_progress']['Row']
export type ApplicationFinancials = Database['public']['Tables']['application_financials']['Row']
export type LanguageExpenditure = Database['public']['Tables']['language_expenditures']['Row']
export type ApplicationReport = Database['public']['Tables']['application_reports']['Row']
export type ProjectAllocation = Database['public']['Tables']['project_allocations']['Row']
export type ProjectAllocationPartner = Database['public']['Tables']['project_allocation_partners']['Row']
export type NonProjectAllocation = Database['public']['Tables']['non_project_allocations']['Row']
export type ImportLog = Database['public']['Tables']['import_logs']['Row']

// View types
export type FundingStreamReport = Database['public']['Views']['funding_stream_report']['Row']

// Function return types
export type AllocationSummary = Database['public']['Functions']['get_allocation_summary']['Returns'][0]
export type PercentageConstraint = Database['public']['Functions']['validate_percentage_constraints']['Returns'][0]

// Enum types
export type UserRole = Database['public']['Enums']['user_role']
export type CallType = Database['public']['Enums']['call_type']
export type ActivityStatus = Database['public']['Enums']['activity_status']
export type ReportStatus = Database['public']['Enums']['report_status']

// Non-project allocation types
export type NonProjectAllocationType = 'indirect_costs' | 'assessments' | 'unused_funds' | 'other'

// Funding stream types
export type FundingStream = 'ETEN Translation Project' | 'illumiNations Undesignated'

// Extended types for forms and UI
export type ProjectAllocationWithPartners = ProjectAllocation & {
  partners: ProjectAllocationPartner[]
}

export type ApplicationWithDetails = Application & {
  organization: Organization
  financials?: ApplicationFinancials[]
  project_allocations?: ProjectAllocationWithPartners[]
  non_project_allocations?: NonProjectAllocation[]
  activities?: Activity[]
  reports?: ApplicationReport[]
}