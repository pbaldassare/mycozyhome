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
    PostgrestVersion: "14.4"
  }
  mycozyhome: {
    Tables: {
      booking_photos: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          kind: string
          path: string
          uploaded_by: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          kind: string
          path: string
          uploaded_by?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          kind?: string
          path?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      service_packages: {
        Row: {
          created_at: string
          description: string | null
          hours: number
          id: string
          is_active: boolean
          name: string
          price: number
          professional_id: string
          service_type: Database["mycozyhome"]["Enums"]["service_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          hours: number
          id?: string
          is_active?: boolean
          name: string
          price: number
          professional_id: string
          service_type: Database["mycozyhome"]["Enums"]["service_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          hours?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          professional_id?: string
          service_type?: Database["mycozyhome"]["Enums"]["service_type"]
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      booking_tracking: {
        Row: {
          actual_hours: number | null
          auto_checked_in: boolean | null
          auto_checked_out: boolean | null
          booking_id: string
          check_in_at: string | null
          check_in_distance_m: number | null
          check_in_in_range: boolean | null
          check_in_latitude: number | null
          check_in_longitude: number | null
          check_out_at: string | null
          check_out_distance_m: number | null
          check_out_in_range: boolean | null
          check_out_latitude: number | null
          check_out_longitude: number | null
          created_at: string
          id: string
          last_ping_at: string | null
          left_zone_count: number | null
          professional_id: string
          status: string
          total_out_of_range_minutes: number | null
        }
        Insert: {
          actual_hours?: number | null
          auto_checked_in?: boolean | null
          auto_checked_out?: boolean | null
          booking_id: string
          check_in_at?: string | null
          check_in_distance_m?: number | null
          check_in_in_range?: boolean | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_out_at?: string | null
          check_out_distance_m?: number | null
          check_out_in_range?: boolean | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          created_at?: string
          id?: string
          last_ping_at?: string | null
          left_zone_count?: number | null
          professional_id: string
          status?: string
          total_out_of_range_minutes?: number | null
        }
        Update: {
          actual_hours?: number | null
          auto_checked_in?: boolean | null
          auto_checked_out?: boolean | null
          booking_id?: string
          check_in_at?: string | null
          check_in_distance_m?: number | null
          check_in_in_range?: boolean | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_out_at?: string | null
          check_out_distance_m?: number | null
          check_out_in_range?: boolean | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          created_at?: string
          id?: string
          last_ping_at?: string | null
          left_zone_count?: number | null
          professional_id?: string
          status?: string
          total_out_of_range_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_tracking_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          no_show_reported_at: string | null
          no_show_outcome: string | null
          client_absent_at: string | null
          absence_indemnity: number | null
          platform_commission: number | null
          cancellation_refund: number | null
          cancellation_professional_amount: number | null
          cancellation_commission: number | null
          withdrawal_at: string | null
          withdrawal_name: string | null
          withdrawal_channel: string | null
          early_execution_at: string | null
          early_execution_version: string | null
          en_route_at: string | null
          package_id: string | null
          pro_latitude: number | null
          pro_location_at: string | null
          pro_longitude: number | null
          series_id: string | null
          tip_amount: number
          tipped_at: string | null
          address: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          discount_amount: number | null
          dispute_deadline_at: string | null
          hourly_rate: number
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          payment_held_amount: number | null
          payment_released_at: string | null
          payment_status: string
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
          no_show_reported_at?: string | null
          no_show_outcome?: string | null
          client_absent_at?: string | null
          absence_indemnity?: number | null
          platform_commission?: number | null
          cancellation_refund?: number | null
          cancellation_professional_amount?: number | null
          cancellation_commission?: number | null
          withdrawal_at?: string | null
          withdrawal_name?: string | null
          withdrawal_channel?: string | null
          early_execution_at?: string | null
          early_execution_version?: string | null
          en_route_at?: string | null
          package_id?: string | null
          pro_latitude?: number | null
          pro_location_at?: string | null
          pro_longitude?: number | null
          series_id?: string | null
          tip_amount?: number
          tipped_at?: string | null
          address: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          discount_amount?: number | null
          dispute_deadline_at?: string | null
          hourly_rate: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          payment_held_amount?: number | null
          payment_released_at?: string | null
          payment_status?: string
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
          no_show_reported_at?: string | null
          no_show_outcome?: string | null
          client_absent_at?: string | null
          absence_indemnity?: number | null
          platform_commission?: number | null
          cancellation_refund?: number | null
          cancellation_professional_amount?: number | null
          cancellation_commission?: number | null
          withdrawal_at?: string | null
          withdrawal_name?: string | null
          withdrawal_channel?: string | null
          early_execution_at?: string | null
          early_execution_version?: string | null
          en_route_at?: string | null
          package_id?: string | null
          pro_latitude?: number | null
          pro_location_at?: string | null
          pro_longitude?: number | null
          series_id?: string | null
          tip_amount?: number
          tipped_at?: string | null
          address?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          discount_amount?: number | null
          dispute_deadline_at?: string | null
          hourly_rate?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          payment_held_amount?: number | null
          payment_released_at?: string | null
          payment_status?: string
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
            referencedRelation: "professional_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          average_rating: number | null
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          city: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_blocked: boolean
          last_name: string | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          postal_code: string | null
          preferences: Json
          province: string | null
          review_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_blocked?: boolean
          last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          postal_code?: string | null
          preferences?: Json
          province?: string | null
          review_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_blocked?: boolean
          last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          postal_code?: string | null
          preferences?: Json
          province?: string | null
          review_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_reviews: {
        Row: {
          booking_id: string
          client_id: string
          comment: string | null
          created_at: string
          id: string
          professional_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          booking_id: string
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          professional_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          booking_id?: string
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          professional_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      client_wallets: {
        Row: {
          balance: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
            referencedRelation: "professional_private"
            referencedColumns: ["id"]
          },
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
      favorites: {
        Row: {
          client_id: string
          created_at: string
          id: string
          professional_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          professional_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      message_moderation: {
        Row: {
          conversation_id: string
          created_at: string
          message_id: string
          original_content: string
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          message_id: string
          original_content: string
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          message_id?: string
          original_content?: string
          sender_id?: string
        }
        Relationships: []
      }
      client_pro_relations: {
        Row: {
          buyout_amount: number | null
          buyout_paid_at: string | null
          buyout_requested_at: string | null
          client_id: string
          first_service_at: string
          professional_id: string
        }
        Insert: never
        Update: never
        Relationships: []
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
      payout_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          iban: string
          id: string
          processed_at: string | null
          processed_by: string | null
          professional_id: string
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          iban: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          professional_id: string
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          iban?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          professional_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_requests_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
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
            referencedRelation: "professional_private"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "professional_private"
            referencedColumns: ["id"]
          },
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
          expires_on: string | null
          file_size: number | null
          file_url: string
          id: string
          professional_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["mycozyhome"]["Enums"]["document_status"]
          uploaded_at: string
        }
        Insert: {
          admin_notes?: string | null
          document_name: string
          document_type: string
          expires_on?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          professional_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["mycozyhome"]["Enums"]["document_status"]
          uploaded_at?: string
        }
        Update: {
          admin_notes?: string | null
          document_name?: string
          document_type?: string
          expires_on?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          professional_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["mycozyhome"]["Enums"]["document_status"]
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_documents_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_documents_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_favorites: {
        Row: {
          client_id: string
          created_at: string
          id: string
          professional_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          professional_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_favorites_professional_id_fkey"
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
          description: string | null
          hourly_rate: number
          id: string
          is_active: boolean | null
          min_hours: number | null
          professional_id: string
          service_type: Database["mycozyhome"]["Enums"]["service_type"]
          years_experience: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          hourly_rate: number
          id?: string
          is_active?: boolean | null
          min_hours?: number | null
          professional_id: string
          service_type: Database["mycozyhome"]["Enums"]["service_type"]
          years_experience?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          hourly_rate?: number
          id?: string
          is_active?: boolean | null
          min_hours?: number | null
          professional_id?: string
          service_type?: Database["mycozyhome"]["Enums"]["service_type"]
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_wallets: {
        Row: {
          balance: number
          created_at: string
          professional_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          professional_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          professional_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_wallets_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professional_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_wallets_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
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
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          city: string
          created_at: string
          documents_submitted: boolean | null
          email: string
          first_name: string
          fiscal_code: string | null
          formatted_address: string | null
          has_vat_number: boolean
          id: string
          is_blocked: boolean
          last_name: string
          latitude: number | null
          longitude: number | null
          max_radius_km: number | null
          phone: string
          postal_code: string | null
          preferences: Json
          profile_completed: boolean | null
          province: string | null
          revenue_blocked: boolean
          review_count: number | null
          status: Database["mycozyhome"]["Enums"]["professional_status"]
          updated_at: string
          user_id: string
          vat_number: string | null
          occasional_declared_at: string | null
          vat_registered_at: string | null
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
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          city: string
          created_at?: string
          documents_submitted?: boolean | null
          email: string
          first_name: string
          fiscal_code?: string | null
          formatted_address?: string | null
          has_vat_number?: boolean
          id?: string
          is_blocked?: boolean
          last_name: string
          latitude?: number | null
          longitude?: number | null
          max_radius_km?: number | null
          phone: string
          postal_code?: string | null
          preferences?: Json
          profile_completed?: boolean | null
          province?: string | null
          revenue_blocked?: boolean
          review_count?: number | null
          status?: Database["mycozyhome"]["Enums"]["professional_status"]
          updated_at?: string
          user_id: string
          vat_number?: string | null
          occasional_declared_at?: string | null
          vat_registered_at?: string | null
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
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          city?: string
          created_at?: string
          documents_submitted?: boolean | null
          email?: string
          first_name?: string
          fiscal_code?: string | null
          formatted_address?: string | null
          has_vat_number?: boolean
          id?: string
          is_blocked?: boolean
          last_name?: string
          latitude?: number | null
          longitude?: number | null
          max_radius_km?: number | null
          phone?: string
          postal_code?: string | null
          preferences?: Json
          profile_completed?: boolean | null
          province?: string | null
          revenue_blocked?: boolean
          review_count?: number | null
          status?: Database["mycozyhome"]["Enums"]["professional_status"]
          updated_at?: string
          user_id?: string
          vat_number?: string | null
          occasional_declared_at?: string | null
          vat_registered_at?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          percent_off: number
          single_use_per_user: boolean
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          percent_off: number
          single_use_per_user?: boolean
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          percent_off?: number
          single_use_per_user?: boolean
          valid_until?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          rating_kindness: number | null
          rating_punctuality: number | null
          rating_quality: number | null
          admin_hidden: boolean | null
          admin_notes: string | null
          booking_id: string
          client_id: string
          comment: string | null
          created_at: string
          id: string
          is_visible: boolean | null
          professional_reply: string | null
          professional_reply_at: string | null
          professional_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          rating_kindness?: number | null
          rating_punctuality?: number | null
          rating_quality?: number | null
          admin_hidden?: boolean | null
          admin_notes?: string | null
          booking_id: string
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean | null
          professional_reply?: string | null
          professional_reply_at?: string | null
          professional_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          rating_kindness?: number | null
          rating_punctuality?: number | null
          rating_quality?: number | null
          admin_hidden?: boolean | null
          admin_notes?: string | null
          booking_id?: string
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean | null
          professional_reply?: string | null
          professional_reply_at?: string | null
          professional_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      service_offers: {
        Row: {
          booking_id: string | null
          client_accepted_at: string | null
          created_at: string
          estimated_hours: number | null
          hourly_rate: number | null
          id: string
          message: string | null
          price_type: string
          professional_confirmed_at: string | null
          professional_id: string
          request_id: string
          status: string
          total_price: number | null
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          client_accepted_at?: string | null
          created_at?: string
          estimated_hours?: number | null
          hourly_rate?: number | null
          id?: string
          message?: string | null
          price_type?: string
          professional_confirmed_at?: string | null
          professional_id: string
          request_id: string
          status?: string
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          client_accepted_at?: string | null
          created_at?: string
          estimated_hours?: number | null
          hourly_rate?: number | null
          id?: string
          message?: string | null
          price_type?: string
          professional_confirmed_at?: string | null
          professional_id?: string
          request_id?: string
          status?: string
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_offers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_offers_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_offers_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          address: string
          budget_max: number | null
          budget_min: number | null
          city: string
          client_id: string
          created_at: string
          description: string
          estimated_hours: number | null
          flexible_dates: boolean | null
          id: string
          latitude: number | null
          longitude: number | null
          offers_count: number | null
          preferred_date: string | null
          preferred_time_end: string | null
          preferred_time_start: string | null
          province: string | null
          service_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          address: string
          budget_max?: number | null
          budget_min?: number | null
          city: string
          client_id: string
          created_at?: string
          description: string
          estimated_hours?: number | null
          flexible_dates?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          offers_count?: number | null
          preferred_date?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          province?: string | null
          service_type: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          address?: string
          budget_max?: number | null
          budget_min?: number | null
          city?: string
          client_id?: string
          created_at?: string
          description?: string
          estimated_hours?: number | null
          flexible_dates?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          offers_count?: number | null
          preferred_date?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          province?: string | null
          service_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      shop_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_orders: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          professional_id: string
          shipping_address: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          professional_id: string
          shipping_address: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          professional_id?: string
          shipping_address?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      shop_products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          stock: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price: number
          stock?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          last_read_at: string | null
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
          last_read_at?: string | null
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
          last_read_at?: string | null
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
          attachment_name: string | null
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          responder_id: string
          responder_type: string
          ticket_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          responder_id: string
          responder_type: string
          ticket_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
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
      tracking_pings: {
        Row: {
          booking_id: string
          created_at: string
          distance_m: number
          id: string
          in_range: boolean
          latitude: number
          longitude: number
          professional_id: string
          tracking_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          distance_m?: number
          id?: string
          in_range?: boolean
          latitude: number
          longitude: number
          professional_id: string
          tracking_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          distance_m?: number
          id?: string
          in_range?: boolean
          latitude?: number
          longitude?: number
          professional_id?: string
          tracking_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_pings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_pings_tracking_id_fkey"
            columns: ["tracking_id"]
            isOneToOne: false
            referencedRelation: "booking_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["mycozyhome"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["mycozyhome"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["mycozyhome"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          description: string | null
          direction: string
          id: string
          professional_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          direction: string
          id?: string
          professional_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          direction?: string
          id?: string
          professional_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      client_public: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          first_name: string | null
          last_name: string | null
          review_count: number | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: number | null
          first_name?: string | null
          last_name?: never
          review_count?: number | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          average_rating?: number | null
          first_name?: string | null
          last_name?: never
          review_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      professional_private: {
        Row: {
          address: string | null
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          birth_date: string | null
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          city: string | null
          created_at: string | null
          documents_submitted: boolean | null
          email: string | null
          first_name: string | null
          fiscal_code: string | null
          formatted_address: string | null
          has_vat_number: boolean | null
          id: string | null
          is_blocked: boolean | null
          last_name: string | null
          latitude: number | null
          longitude: number | null
          max_radius_km: number | null
          phone: string | null
          postal_code: string | null
          preferences: Json | null
          profile_completed: boolean | null
          province: string | null
          revenue_blocked: boolean | null
          review_count: number | null
          status: Database["mycozyhome"]["Enums"]["professional_status"] | null
          updated_at: string | null
          user_id: string | null
          vat_number: string | null
          occasional_declared_at: string | null
          vat_registered_at: string | null
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
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          city?: string | null
          created_at?: string | null
          documents_submitted?: boolean | null
          email?: string | null
          first_name?: string | null
          fiscal_code?: string | null
          formatted_address?: string | null
          has_vat_number?: boolean | null
          id?: string | null
          is_blocked?: boolean | null
          last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          max_radius_km?: number | null
          phone?: string | null
          postal_code?: string | null
          preferences?: Json | null
          profile_completed?: boolean | null
          province?: string | null
          revenue_blocked?: boolean | null
          review_count?: number | null
          status?: Database["mycozyhome"]["Enums"]["professional_status"] | null
          updated_at?: string | null
          user_id?: string | null
          vat_number?: string | null
          occasional_declared_at?: string | null
          vat_registered_at?: string | null
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
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          city?: string | null
          created_at?: string | null
          documents_submitted?: boolean | null
          email?: string | null
          first_name?: string | null
          fiscal_code?: string | null
          formatted_address?: string | null
          has_vat_number?: boolean | null
          id?: string | null
          is_blocked?: boolean | null
          last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          max_radius_km?: number | null
          phone?: string | null
          postal_code?: string | null
          preferences?: Json | null
          profile_completed?: boolean | null
          province?: string | null
          revenue_blocked?: boolean | null
          review_count?: number | null
          status?: Database["mycozyhome"]["Enums"]["professional_status"] | null
          updated_at?: string | null
          user_id?: string | null
          vat_number?: string | null
          occasional_declared_at?: string | null
          vat_registered_at?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _annual_revenue: { Args: { _prof_id: string }; Returns: number }
      _promo_percent: {
        Args: { p_code: string; p_user_id: string }
        Returns: number
      }
      admin_dashboard_stats: { Args: never; Returns: Json }
      can_access_dispute: { Args: { p_dispute: string }; Returns: boolean }
      can_access_ticket: { Args: { p_ticket: string }; Returns: boolean }
      cancel_booking: {
        Args: { p_booking_id: string; p_reason?: string }
        Returns: undefined
      }
      create_booking: {
        Args: {
          p_address: string
          p_hours: number
          p_latitude?: number
          p_longitude?: number
          p_notes?: string
          p_professional_id: string
          p_promo_code?: string
          p_scheduled_date: string
          p_service_type: string
          p_time_start: string
        }
        Returns: string
      }
      create_booking_v2: {
        Args: {
          p_address: string
          p_hours: number
          p_latitude?: number
          p_longitude?: number
          p_notes?: string
          p_professional_id: string
          p_promo_code?: string
          p_scheduled_date: string
          p_package_id?: string
          p_series_id?: string
          p_service_type: string
          p_time_start: string
        }
        Returns: string
      }
      create_booking_series: {
        Args: {
          p_address: string
          p_count: number
          p_every_weeks: number
          p_first_date: string
          p_hours: number
          p_latitude?: number
          p_longitude?: number
          p_notes?: string
          p_package_id?: string
          p_professional_id: string
          p_promo_code?: string
          p_service_type: string
          p_time_start: string
        }
        Returns: string
      }
      available_professionals: {
        Args: {
          p_date: string
          p_hours: number
          p_latitude?: number
          p_longitude?: number
          p_service_type: string
          p_time_start: string
        }
        Returns: {
          average_rating: number | null
          avatar_url: string | null
          city: string
          distance_km: number | null
          first_name: string
          hourly_rate: number
          id: string
          last_name: string
          min_hours: number | null
          min_package_price: number | null
          review_count: number | null
          years_experience: number | null
        }[]
      }
      check_in: {
        Args: { p_booking_id: string; p_lat: number; p_lng: number }
        Returns: Json
      }
      complete_service: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      stamp_terms_ip: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_booking_v3: {
        Args: {
          p_address: string
          p_early_execution?: string
          p_hours: number
          p_latitude?: number
          p_longitude?: number
          p_notes?: string
          p_package_id?: string
          p_professional_id: string
          p_promo_code?: string
          p_scheduled_date: string
          p_service_type: string
          p_time_start: string
        }
        Returns: string
      }
      create_booking_series_v2: {
        Args: {
          p_address: string
          p_count: number
          p_early_execution?: string
          p_every_weeks: number
          p_first_date: string
          p_hours: number
          p_latitude?: number
          p_longitude?: number
          p_notes?: string
          p_package_id?: string
          p_professional_id: string
          p_promo_code?: string
          p_service_type: string
          p_time_start: string
        }
        Returns: string
      }
      cancellation_quote: {
        Args: { p_booking_id: string }
        Returns: Json
      }
      withdraw_booking: {
        Args: { p_booking_id: string; p_name: string; p_channel: string }
        Returns: undefined
      }
      admin_read_chat: {
        Args: { p_reason: string; p_user_a: string; p_user_b: string }
        Returns: Database["mycozyhome"]["Tables"]["messages"]["Row"][]
      }
      professional_completed_counts: {
        Args: never
        Returns: { professional_id: string; completed: number }[]
      }
      request_buyout: { Args: { p_client_id: string }; Returns: undefined }
      mark_buyout_paid: { Args: { p_client_id: string; p_professional_id: string }; Returns: undefined }
      reply_to_review: {
        Args: { p_review_id: string; p_reply: string }
        Returns: undefined
      }
      report_professional_no_show: {
        Args: { p_booking_id: string }
        Returns: string
      }
      report_client_absent: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      register_vat_number: {
        Args: { p_vat: string }
        Returns: undefined
      }
      add_tip: {
        Args: { p_amount: number; p_booking_id: string }
        Returns: undefined
      }
      can_access_booking: { Args: { p_booking: string }; Returns: boolean }
      professional_set_en_route: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      professional_update_location: {
        Args: { p_booking_id: string; p_latitude: number; p_longitude: number }
        Returns: undefined
      }
      review_photos: {
        Args: { p_professional_id: string }
        Returns: { booking_id: string; path: string }[]
      }
      ensure_client_wallet: { Args: { p_user_id: string }; Returns: undefined }
      ensure_professional_wallet: {
        Args: { p_professional_id: string; p_user_id: string }
        Returns: undefined
      }
      get_client_wallet_balance: { Args: never; Returns: number }
      get_professional_annual_revenue: {
        Args: { _prof_id: string }
        Returns: number
      }
      get_professional_rating: {
        Args: { p_professional_id: string }
        Returns: {
          average_rating: number
          review_count: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["mycozyhome"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["mycozyhome"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_client_blocked: { Args: { _user_id: string }; Returns: boolean }
      is_conversation_party: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      is_professional_user_blocked: {
        Args: { _user_id: string }
        Returns: boolean
      }
      join_as_client: { Args: never; Returns: undefined }
      leave_mycozyhome: { Args: never; Returns: undefined }
      my_conversations: {
        Args: never
        Returns: {
          booking_id: string
          client_avatar_url: string
          client_first_name: string
          client_id: string
          client_last_name: string
          created_at: string
          id: string
          last_content: string
          last_created_at: string
          last_message_at: string
          last_sender_id: string
          professional_avatar_url: string
          professional_first_name: string
          professional_id: string
          professional_last_name: string
          status: string
          unread_count_client: number
          unread_count_professional: number
          updated_at: string
        }[]
      }
      my_professional_id: { Args: never; Returns: string }
      my_unread_support_count: { Args: never; Returns: number }
      owns_booking_as_professional: {
        Args: { p_booking_id: string; p_professional_id: string }
        Returns: boolean
      }
      process_payout: {
        Args: { p_notes?: string; p_payout_id: string; p_status: string }
        Returns: undefined
      }
      process_pending_payment_releases: { Args: never; Returns: number }
      professional_set_booking_status: {
        Args: { p_booking_id: string; p_reason?: string; p_status: string }
        Returns: undefined
      }
      release_booking_payment: {
        Args: { p_booking_id: string }
        Returns: boolean
      }
      request_payout: {
        Args: { p_amount: number; p_iban: string }
        Returns: string
      }
      resolve_dispute_payment: {
        Args: { p_dispute_id: string; p_favor: string }
        Returns: boolean
      }
      simulate_wallet_top_up: { Args: { p_amount: number }; Returns: number }
      validate_promo_code: { Args: { p_code: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "professional" | "client"
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
        | "dog_sitter"
        | "wardrobe_seasonal"
        | "decluttering"
        | "post_renovation"
        | "seasonal_cleaning"
        | "garden_care"
        | "home_organizing"
        | "dog_walking"
        | "pet_care_travel"
        | "pet_space_cleaning"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "mycozyhome">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  mycozyhome: {
    Enums: {
      app_role: ["admin", "professional", "client"],
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
        "dog_sitter",
        "wardrobe_seasonal",
        "decluttering",
        "post_renovation",
        "seasonal_cleaning",
        "garden_care",
        "home_organizing",
        "dog_walking",
        "pet_care_travel",
        "pet_space_cleaning",
      ],
    },
  },
} as const
