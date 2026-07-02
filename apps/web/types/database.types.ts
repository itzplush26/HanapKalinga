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
      availability: {
        Row: {
          date: string
          id: string
          is_open: boolean | null
          nurse_id: string | null
          shift: string
        }
        Insert: {
          date: string
          id?: string
          is_open?: boolean | null
          nurse_id?: string | null
          shift: string
        }
        Update: {
          date?: string
          id?: string
          is_open?: boolean | null
          nurse_id?: string | null
          shift?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "nurses"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_date_exceptions: {
        Row: {
          date: string
          is_open: boolean
          nurse_id: string
        }
        Insert: {
          date: string
          is_open: boolean
          nurse_id: string
        }
        Update: {
          date?: string
          is_open?: boolean
          nurse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_date_exceptions_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "nurses"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          cancellation_reason: string | null
          cancelled_by: string | null
          created_at: string | null
          family_id: string | null
          family_marked_complete: boolean
          id: string
          notes: string | null
          nurse_id: string | null
          nurse_marked_complete: boolean
          requested_date: string | null
          shift: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          family_id?: string | null
          family_marked_complete?: boolean
          id?: string
          notes?: string | null
          nurse_id?: string | null
          nurse_marked_complete?: boolean
          requested_date?: string | null
          shift?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          family_id?: string | null
          family_marked_complete?: boolean
          id?: string
          notes?: string | null
          nurse_id?: string | null
          nurse_marked_complete?: boolean
          requested_date?: string | null
          shift?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "nurses"
            referencedColumns: ["id"]
          },
        ]
      }
      care_request_applications: {
        Row: {
          care_request_id: string
          cover_message: string
          created_at: string
          id: string
          nurse_id: string
          proposed_rate_band: string | null
          status: string
        }
        Insert: {
          care_request_id: string
          cover_message: string
          created_at?: string
          id?: string
          nurse_id: string
          proposed_rate_band?: string | null
          status?: string
        }
        Update: {
          care_request_id?: string
          cover_message?: string
          created_at?: string
          id?: string
          nurse_id?: string
          proposed_rate_band?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_request_applications_care_request_id_fkey"
            columns: ["care_request_id"]
            isOneToOne: false
            referencedRelation: "care_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_request_applications_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "nurses"
            referencedColumns: ["id"]
          },
        ]
      }
      care_requests: {
        Row: {
          barangay: string | null
          budget_band: string | null
          care_type: string
          city: string | null
          created_at: string
          duration_description: string | null
          expires_at: string
          family_id: string
          id: string
          patient_condition: string
          preferred_provider_type: string
          region: string | null
          required_specializations: string[]
          shift_preference: string | null
          start_date: string | null
          status: string
          title: string
        }
        Insert: {
          barangay?: string | null
          budget_band?: string | null
          care_type: string
          city?: string | null
          created_at?: string
          duration_description?: string | null
          expires_at?: string
          family_id: string
          id?: string
          patient_condition: string
          preferred_provider_type?: string
          region?: string | null
          required_specializations?: string[]
          shift_preference?: string | null
          start_date?: string | null
          status?: string
          title: string
        }
        Update: {
          barangay?: string | null
          budget_band?: string | null
          care_type?: string
          city?: string | null
          created_at?: string
          duration_description?: string | null
          expires_at?: string
          family_id?: string
          id?: string
          patient_condition?: string
          preferred_provider_type?: string
          region?: string | null
          required_specializations?: string[]
          shift_preference?: string | null
          start_date?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_requests_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          address: string | null
          care_needed: string | null
          checklist_dismissed: boolean
          contact_person_name: string | null
          has_browsed: boolean
          id: string
          patient_age: number | null
          patient_condition: string | null
          patient_name: string | null
          relationship_to_patient: string | null
          tooltips_dismissed: Json
          welcome_seen: boolean
        }
        Insert: {
          address?: string | null
          care_needed?: string | null
          checklist_dismissed?: boolean
          contact_person_name?: string | null
          has_browsed?: boolean
          id: string
          patient_age?: number | null
          patient_condition?: string | null
          patient_name?: string | null
          relationship_to_patient?: string | null
          tooltips_dismissed?: Json
          welcome_seen?: boolean
        }
        Update: {
          address?: string | null
          care_needed?: string | null
          checklist_dismissed?: boolean
          contact_person_name?: string | null
          has_browsed?: boolean
          id?: string
          patient_age?: number | null
          patient_condition?: string | null
          patient_name?: string | null
          relationship_to_patient?: string | null
          tooltips_dismissed?: Json
          welcome_seen?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "families_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_reports: {
        Row: {
          admin_notes: string | null
          booking_id: string | null
          category: string
          created_at: string
          description: string
          evidence_url: string | null
          id: string
          reported_user_id: string
          reporter_id: string
          reviewed_at: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          booking_id?: string | null
          category: string
          created_at?: string
          description: string
          evidence_url?: string | null
          id?: string
          reported_user_id: string
          reporter_id: string
          reviewed_at?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          booking_id?: string | null
          category?: string
          created_at?: string
          description?: string
          evidence_url?: string | null
          id?: string
          reported_user_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          booking_id: string | null
          content: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string | null
        }
        Insert: {
          booking_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string | null
        }
        Update: {
          booking_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          metadata: Json
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          metadata?: Json
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          metadata?: Json
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      nurses: {
        Row: {
          bio: string | null
          daily_rate_12hr: number | null
          daily_rate_12hr_max: number | null
          daily_rate_range: string | null
          hourly_rate: number | null
          hourly_rate_max: number | null
          hourly_rate_range: string | null
          id: string
          license_expiry_notified_at: string | null
          nbi_document_url: string | null
          nbi_expiry: string | null
          prc_document_url: string | null
          prc_license_expiry: string | null
          prc_license_no: string | null
          profile_photo_url: string | null
          profile_slug: string | null
          provider_type: string
          rejection_notes: string | null
          rejection_reason: string | null
          search_vector: unknown
          specializations: string[] | null
          submitted_at: string | null
          tesda_cert_expiry: string | null
          tesda_certificate_no: string | null
          tesda_document_url: string | null
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          daily_rate_12hr?: number | null
          daily_rate_12hr_max?: number | null
          daily_rate_range?: string | null
          hourly_rate?: number | null
          hourly_rate_max?: number | null
          hourly_rate_range?: string | null
          id: string
          license_expiry_notified_at?: string | null
          nbi_document_url?: string | null
          nbi_expiry?: string | null
          prc_document_url?: string | null
          prc_license_expiry?: string | null
          prc_license_no?: string | null
          profile_photo_url?: string | null
          profile_slug?: string | null
          provider_type?: string
          rejection_notes?: string | null
          rejection_reason?: string | null
          search_vector?: unknown
          specializations?: string[] | null
          submitted_at?: string | null
          tesda_cert_expiry?: string | null
          tesda_certificate_no?: string | null
          tesda_document_url?: string | null
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          daily_rate_12hr?: number | null
          daily_rate_12hr_max?: number | null
          daily_rate_range?: string | null
          hourly_rate?: number | null
          hourly_rate_max?: number | null
          hourly_rate_range?: string | null
          id?: string
          license_expiry_notified_at?: string | null
          nbi_document_url?: string | null
          nbi_expiry?: string | null
          prc_document_url?: string | null
          prc_license_expiry?: string | null
          prc_license_no?: string | null
          profile_photo_url?: string | null
          profile_slug?: string | null
          provider_type?: string
          rejection_notes?: string | null
          rejection_reason?: string | null
          search_vector?: unknown
          specializations?: string[] | null
          submitted_at?: string | null
          tesda_cert_expiry?: string | null
          tesda_certificate_no?: string | null
          tesda_document_url?: string | null
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nurses_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurses_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          barangay: string | null
          city: string | null
          created_at: string | null
          date_of_birth: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          middle_name: string | null
          name_suffix: string | null
          phone: string | null
          profile_photo_url: string | null
          region: string | null
          role: string
          suspended: boolean
        }
        Insert: {
          address?: string | null
          barangay?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          middle_name?: string | null
          name_suffix?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          region?: string | null
          role: string
          suspended?: boolean
        }
        Update: {
          address?: string | null
          barangay?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          middle_name?: string | null
          name_suffix?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          region?: string | null
          role?: string
          suspended?: boolean
        }
        Relationships: []
      }
      provider_weekly_availability: {
        Row: {
          day_of_week: number
          is_open: boolean
          nurse_id: string
          shift: string
        }
        Insert: {
          day_of_week: number
          is_open?: boolean
          nurse_id: string
          shift: string
        }
        Update: {
          day_of_week?: number
          is_open?: boolean
          nurse_id?: string
          shift?: string
        }
        Relationships: [
          {
            foreignKeyName: "nurse_weekly_availability_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "nurses"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          rating: number | null
          reviewee_id: string | null
          reviewer_id: string | null
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          reviewee_id?: string | null
          reviewer_id?: string | null
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          reviewee_id?: string | null
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          device_info: string | null
          session_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          session_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          session_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      verification_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          new_status: string
          nurse_id: string
          previous_status: string | null
          rejection_reason: string | null
          review_notes: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          new_status: string
          nurse_id: string
          previous_status?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          new_status?: string
          nurse_id?: string
          previous_status?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_audit_logs_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "nurses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      provider_ratings: {
        Row: {
          average_rating: number | null
          nurse_id: string | null
          review_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auth_email_exists: { Args: { p_email: string }; Returns: boolean }
      generate_nurse_profile_slug: {
        Args: { p_full_name: string; p_nurse_id: string }
        Returns: string
      }
      get_my_date_of_birth: { Args: never; Returns: string | null }
      get_profile_date_of_birth_for_admin: {
        Args: { p_user_id: string }
        Returns: string | null
      }
      is_admin: { Args: never; Returns: boolean }
      refresh_nurse_search_vector: {
        Args: { p_nurse_id: string }
        Returns: undefined
      }
      slugify_name: { Args: { input: string }; Returns: string }
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
