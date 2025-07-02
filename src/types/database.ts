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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code?: string | null
          contact_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string | null
          contact_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          organization_id: string | null
          role: Database['public']['Enums']['user_role']
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id?: string | null
          role?: Database['public']['Enums']['user_role']
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
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
          }
        ]
      }
      projects: {
        Row: {
          id: string
          organization_id: string
          name: string
          type: Database['public']['Enums']['project_type']
          proposal_reference: string | null
          award_reference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          type: Database['public']['Enums']['project_type']
          proposal_reference?: string | null
          award_reference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          type?: Database['public']['Enums']['project_type']
          proposal_reference?: string | null
          award_reference?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      project_financials: {
        Row: {
          id: string
          project_id: string
          reporting_period_start: string
          reporting_period_end: string
          funds_received: number | null
          funds_spent: number | null
          funds_prior_year: number | null
          financial_context: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          reporting_period_start: string
          reporting_period_end: string
          funds_received?: number | null
          funds_spent?: number | null
          funds_prior_year?: number | null
          financial_context?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          reporting_period_start?: string
          reporting_period_end?: string
          funds_received?: number | null
          funds_spent?: number | null
          funds_prior_year?: number | null
          financial_context?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_financials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      milestones: {
        Row: {
          id: string
          project_id: string
          description: string
          due_date: string
          original_status: Database['public']['Enums']['milestone_status'] | null
          current_status: Database['public']['Enums']['milestone_status'] | null
          progress_update: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          description: string
          due_date: string
          original_status?: Database['public']['Enums']['milestone_status'] | null
          current_status?: Database['public']['Enums']['milestone_status'] | null
          progress_update?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          description?: string
          due_date?: string
          original_status?: Database['public']['Enums']['milestone_status'] | null
          current_status?: Database['public']['Enums']['milestone_status'] | null
          progress_update?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      reports: {
        Row: {
          id: string
          project_id: string
          reporting_period_start: string
          reporting_period_end: string
          progress_narrative: string | null
          variance_narrative: string | null
          status: Database['public']['Enums']['report_status']
          submitted_at: string | null
          submitted_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          reporting_period_start: string
          reporting_period_end: string
          progress_narrative?: string | null
          variance_narrative?: string | null
          status?: Database['public']['Enums']['report_status']
          submitted_at?: string | null
          submitted_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          reporting_period_start?: string
          reporting_period_end?: string
          progress_narrative?: string | null
          variance_narrative?: string | null
          status?: Database['public']['Enums']['report_status']
          submitted_at?: string | null
          submitted_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
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
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "admin" | "staff" | "org_user"
      project_type: "Tools" | "Capacity Building"
      milestone_status: "Behind Schedule" | "On Track" | "Ahead of Schedule" | "Complete"
      report_status: "not_started" | "draft" | "submitted"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Organization = Database['public']['Tables']['organizations']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectFinancials = Database['public']['Tables']['project_financials']['Row']
export type Milestone = Database['public']['Tables']['milestones']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type ImportLog = Database['public']['Tables']['import_logs']['Row']

export type UserRole = Database['public']['Enums']['user_role']
export type ProjectType = Database['public']['Enums']['project_type']
export type MilestoneStatus = Database['public']['Enums']['milestone_status']
export type ReportStatus = Database['public']['Enums']['report_status']