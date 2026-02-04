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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          address: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          discount_amount: number | null
          hourly_rate: number
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          professional_id: string
          promo_code: string | null
          scheduled_date: string
          scheduled_time_end: string
          scheduled_time_start: string
          service_type: string
          status: string
          total_amount: number
          total_hours: number
          updated_at: string
        }
        Insert: {
          address: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          discount_amount?: number | null
          hourly_rate: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          professional_id: string
          promo_code?: string | null
          scheduled_date: string
          scheduled_time_end: string
          scheduled_time_start: string
          service_type: string
          status?: string
          total_amount: number
          total_hours: number
          updated_at?: string
        }
        Update: {
          address?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          discount_amount?: number | null
          hourly_rate?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          professional_id?: string
          promo_code?: string | null
          scheduled_date?: string
          scheduled_time_end?: string
          scheduled_time_start?: string
          service_type?: string
          status?: string
          total_amount?: number
          total_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          booking_id: string | null
          client_id: string
          created_at: string
          id: string
          last_message_at: string | null
          professional_id: string
          status: string
          unread_count_client: number | null
          unread_count_professional: number | null
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          professional_id: string
          status?: string
          unread_count_client?: number | null
          unread_count_professional?: number | null
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          professional_id?: string
          status?: string
          unread_count_client?: number | null
          unread_count_professional?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_evidence: {
        Row: {
          created_at: string
          description: string | null
          dispute_id: string
          file_name: string
          file_type: string
          file_url: string
          id: string
          uploader_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dispute_id: string
          file_name: string
          file_type: string
          file_url: string
          id?: string
          uploader_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dispute_id?: string
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_evidence_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          admin_notes: string | null
          booking_id: string | null
          conversation_id: string | null
          created_at: string
          description: string
          id: string
          reason: string
          reported_id: string
          reported_type: string
          reporter_id: string
          reporter_type: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          booking_id?: string | null
          conversation_id?: string | null
          created_at?: string
          description: string
          id?: string
          reason: string
          reported_id: string
          reported_type: string
          reporter_id: string
          reporter_type: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          booking_id?: string | null
          conversation_id?: string | null
          created_at?: string
          description?: string
          id?: string
          reason?: string
          reported_id?: string
          reported_type?: string
          reporter_id?: string
          reporter_type?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_blocked: boolean | null
          is_read: boolean | null
          message_type: string
          original_content: string | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_blocked?: boolean | null
          is_read?: boolean | null
          message_type?: string
          original_content?: string | null
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_blocked?: boolean | null
          is_read?: boolean | null
          message_type?: string
          original_content?: string | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_areas: {
        Row: {
          city: string
          created_at: string
          formatted_address: string | null
          id: string
          latitude: number | null
          longitude: number | null
          max_distance_km: number | null
          professional_id: string
          province: string | null
        }
        Insert: {
          city: string
          created_at?: string
          formatted_address?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          max_distance_km?: number | null
          professional_id: string
          province?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          formatted_address?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          max_distance_km?: number | null
          professional_id?: string
          province?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_areas_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean | null
          professional_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean | null
          professional_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean | null
          professional_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_documents: {
        Row: {
          admin_notes: string | null
          document_name: string
          document_type: string
          file_size: number | null
          file_url: string
          id: string
          professional_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["document_status"]
          uploaded_at: string
        }
        Insert: {
          admin_notes?: string | null
          document_name: string
          document_type: string
          file_size?: number | null
          file_url: string
          id?: string
          professional_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          uploaded_at?: string
        }
        Update: {
          admin_notes?: string | null
          document_name?: string
          document_type?: string
          file_size?: number | null
          file_url?: string
          id?: string
          professional_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_documents_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_services: {
        Row: {
          created_at: string
          hourly_rate: number
          id: string
          is_active: boolean | null
          min_hours: number | null
          professional_id: string
          service_type: Database["public"]["Enums"]["service_type"]
        }
        Insert: {
          created_at?: string
          hourly_rate: number
          id?: string
          is_active?: boolean | null
          min_hours?: number | null
          professional_id: string
          service_type: Database["public"]["Enums"]["service_type"]
        }
        Update: {
          created_at?: string
          hourly_rate?: number
          id?: string
          is_active?: boolean | null
          min_hours?: number | null
          professional_id?: string
          service_type?: Database["public"]["Enums"]["service_type"]
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          address: string | null
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          birth_date: string | null
          city: string
          created_at: string
          documents_submitted: boolean | null
          email: string
          first_name: string
          fiscal_code: string | null
          formatted_address: string | null
          id: string
          last_name: string
          latitude: number | null
          longitude: number | null
          max_radius_km: number | null
          phone: string
          postal_code: string | null
          profile_completed: boolean | null
          province: string | null
          review_count: number | null
          status: Database["public"]["Enums"]["professional_status"]
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          birth_date?: string | null
          city: string
          created_at?: string
          documents_submitted?: boolean | null
          email: string
          first_name: string
          fiscal_code?: string | null
          formatted_address?: string | null
          id?: string
          last_name: string
          latitude?: number | null
          longitude?: number | null
          max_radius_km?: number | null
          phone: string
          postal_code?: string | null
          profile_completed?: boolean | null
          province?: string | null
          review_count?: number | null
          status?: Database["public"]["Enums"]["professional_status"]
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          birth_date?: string | null
          city?: string
          created_at?: string
          documents_submitted?: boolean | null
          email?: string
          first_name?: string
          fiscal_code?: string | null
          formatted_address?: string | null
          id?: string
          last_name?: string
          latitude?: number | null
          longitude?: number | null
          max_radius_km?: number | null
          phone?: string
          postal_code?: string | null
          profile_completed?: boolean | null
          province?: string | null
          review_count?: number | null
          status?: Database["public"]["Enums"]["professional_status"]
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          admin_hidden: boolean | null
          admin_notes: string | null
          booking_id: string
          client_id: string
          comment: string | null
          created_at: string
          id: string
          is_visible: boolean | null
          professional_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          admin_hidden?: boolean | null
          admin_notes?: string | null
          booking_id: string
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean | null
          professional_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          admin_hidden?: boolean | null
          admin_notes?: string | null
          booking_id?: string
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean | null
          professional_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
          user_type: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      ticket_responses: {
        Row: {
          content: string
          created_at: string
          id: string
          responder_id: string
          responder_type: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          responder_id: string
          responder_type: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          responder_id?: string
          responder_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_professional_rating: {
        Args: { p_professional_id: string }
        Returns: {
          average_rating: number
          review_count: number
        }[]
      }
    }
    Enums: {
      document_status: "pending" | "approved" | "rejected"
      professional_status:
        | "pending"
        | "in_review"
        | "approved"
        | "rejected"
        | "suspended"
      service_type:
        | "cleaning"
        | "office_cleaning"
        | "ironing"
        | "sanitization"
        | "babysitter"
        | "dog_sitter"
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
    Enums: {
      document_status: ["pending", "approved", "rejected"],
      professional_status: [
        "pending",
        "in_review",
        "approved",
        "rejected",
        "suspended",
      ],
      service_type: [
        "cleaning",
        "office_cleaning",
        "ironing",
        "sanitization",
        "babysitter",
        "dog_sitter",
      ],
    },
  },
} as const
