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
      ai_extractions: {
        Row: {
          anomalies: Json | null
          classification: string | null
          confidence: number | null
          created_at: string
          explanation: string | null
          fields: Json
          id: string
          model: string
          raw_message_id: string
          recommended_action: string | null
        }
        Insert: {
          anomalies?: Json | null
          classification?: string | null
          confidence?: number | null
          created_at?: string
          explanation?: string | null
          fields?: Json
          id?: string
          model: string
          raw_message_id: string
          recommended_action?: string | null
        }
        Update: {
          anomalies?: Json | null
          classification?: string | null
          confidence?: number | null
          created_at?: string
          explanation?: string | null
          fields?: Json
          id?: string
          model?: string
          raw_message_id?: string
          recommended_action?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_extractions_raw_message_id_fkey"
            columns: ["raw_message_id"]
            isOneToOne: false
            referencedRelation: "raw_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          code: string
          created_at: string
          id: string
          merchant_id: string
          message: string
          metadata: Json | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          merchant_id: string
          message: string
          metadata?: Json | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          merchant_id?: string
          message?: string
          metadata?: Json | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          label: string
          last_used_at: string | null
          merchant_id: string
          revoked_at: string | null
          scopes: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          label: string
          last_used_at?: string | null
          merchant_id: string
          revoked_at?: string | null
          scopes?: string[]
        }
        Update: {
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          label?: string
          last_used_at?: string | null
          merchant_id?: string
          revoked_at?: string | null
          scopes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          diff: Json | null
          entity: string | null
          entity_id: string | null
          id: string
          merchant_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          merchant_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          merchant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          android_id: string | null
          app_version: string | null
          created_at: string
          device_token_hash: string | null
          id: string
          is_online: boolean
          label: string
          last_seen_at: string | null
          merchant_id: string
        }
        Insert: {
          android_id?: string | null
          app_version?: string | null
          created_at?: string
          device_token_hash?: string | null
          id?: string
          is_online?: boolean
          label: string
          last_seen_at?: string | null
          merchant_id: string
        }
        Update: {
          android_id?: string | null
          app_version?: string | null
          created_at?: string
          device_token_hash?: string | null
          id?: string
          is_online?: boolean
          label?: string
          last_seen_at?: string | null
          merchant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_members: {
        Row: {
          id: string
          invited_at: string | null
          joined_at: string
          merchant_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          invited_at?: string | null
          joined_at?: string
          merchant_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          invited_at?: string | null
          joined_at?: string
          merchant_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_members_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          display_name: string
          id: string
          legal_name: string
          plan_id: string | null
          settings: Json
          slug: string
          status: Database["public"]["Enums"]["merchant_status"]
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          display_name: string
          id?: string
          legal_name: string
          plan_id?: string | null
          settings?: Json
          slug: string
          status?: Database["public"]["Enums"]["merchant_status"]
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          display_name?: string
          id?: string
          legal_name?: string
          plan_id?: string | null
          settings?: Json
          slug?: string
          status?: Database["public"]["Enums"]["merchant_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      order_matches: {
        Row: {
          amount_matched: number
          created_at: string
          id: string
          order_id: string
          transaction_id: string
        }
        Insert: {
          amount_matched: number
          created_at?: string
          id?: string
          order_id: string
          transaction_id: string
        }
        Update: {
          amount_matched?: number
          created_at?: string
          id?: string
          order_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_matches_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_matches_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "parsed_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_label: string | null
          expires_at: string | null
          external_ref: string | null
          id: string
          merchant_id: string
          metadata: Json
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_label?: string | null
          expires_at?: string | null
          external_ref?: string | null
          id?: string
          merchant_id: string
          metadata?: Json
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_label?: string | null
          expires_at?: string | null
          external_ref?: string | null
          id?: string
          merchant_id?: string
          metadata?: Json
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      parsed_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          balance_before: number | null
          confidence: number
          created_at: string
          currency: string
          id: string
          matched_order_id: string | null
          merchant_id: string
          message_timestamp: string | null
          notes: string | null
          provider: Database["public"]["Enums"]["source_provider"] | null
          raw_message_id: string | null
          receiver_identifier: string | null
          reference: string | null
          risk: Database["public"]["Enums"]["risk_level"]
          sender_identifier: string | null
          source_id: string | null
          status: Database["public"]["Enums"]["txn_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          balance_before?: number | null
          confidence?: number
          created_at?: string
          currency?: string
          id?: string
          matched_order_id?: string | null
          merchant_id: string
          message_timestamp?: string | null
          notes?: string | null
          provider?: Database["public"]["Enums"]["source_provider"] | null
          raw_message_id?: string | null
          receiver_identifier?: string | null
          reference?: string | null
          risk?: Database["public"]["Enums"]["risk_level"]
          sender_identifier?: string | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["txn_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          balance_before?: number | null
          confidence?: number
          created_at?: string
          currency?: string
          id?: string
          matched_order_id?: string | null
          merchant_id?: string
          message_timestamp?: string | null
          notes?: string | null
          provider?: Database["public"]["Enums"]["source_provider"] | null
          raw_message_id?: string | null
          receiver_identifier?: string | null
          reference?: string | null
          risk?: Database["public"]["Enums"]["risk_level"]
          sender_identifier?: string | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["txn_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parsed_transactions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parsed_transactions_raw_message_id_fkey"
            columns: ["raw_message_id"]
            isOneToOne: false
            referencedRelation: "raw_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parsed_transactions_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "payment_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      parser_rules: {
        Row: {
          field: string
          id: string
          priority: number
          regex: string
          template_id: string
        }
        Insert: {
          field: string
          id?: string
          priority?: number
          regex: string
          template_id: string
        }
        Update: {
          field?: string
          id?: string
          priority?: number
          regex?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parser_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "parser_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      parser_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          provider: Database["public"]["Enums"]["source_provider"]
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          provider: Database["public"]["Enums"]["source_provider"]
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          provider?: Database["public"]["Enums"]["source_provider"]
          version?: number
        }
        Relationships: []
      }
      payment_sources: {
        Row: {
          created_at: string
          daily_usage: number
          device_id: string | null
          estimated_balance: number
          id: string
          identifier: string
          label: string
          last_message_at: string | null
          merchant_id: string
          monthly_usage: number
          previous_balance: number | null
          provider: Database["public"]["Enums"]["source_provider"]
          status: Database["public"]["Enums"]["source_status"]
        }
        Insert: {
          created_at?: string
          daily_usage?: number
          device_id?: string | null
          estimated_balance?: number
          id?: string
          identifier: string
          label: string
          last_message_at?: string | null
          merchant_id: string
          monthly_usage?: number
          previous_balance?: number | null
          provider: Database["public"]["Enums"]["source_provider"]
          status?: Database["public"]["Enums"]["source_status"]
        }
        Update: {
          created_at?: string
          daily_usage?: number
          device_id?: string | null
          estimated_balance?: number
          id?: string
          identifier?: string
          label?: string
          last_message_at?: string | null
          merchant_id?: string
          monthly_usage?: number
          previous_balance?: number | null
          provider?: Database["public"]["Enums"]["source_provider"]
          status?: Database["public"]["Enums"]["source_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payment_sources_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_sources_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          code: string
          created_at: string
          features: Json
          id: string
          is_active: boolean
          max_devices: number
          max_sources: number
          monthly_price_egp: number
          name_ar: string
          name_en: string
        }
        Insert: {
          code: string
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          max_devices?: number
          max_sources?: number
          monthly_price_egp?: number
          name_ar: string
          name_en: string
        }
        Update: {
          code?: string
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          max_devices?: number
          max_sources?: number
          monthly_price_egp?: number
          name_ar?: string
          name_en?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          locale: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          locale?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          locale?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      raw_messages: {
        Row: {
          body: string
          device_id: string | null
          id: string
          idempotency_key: string | null
          ingested_at: string
          merchant_id: string
          message_hash: string
          provider: Database["public"]["Enums"]["source_provider"] | null
          received_at: string
          sender: string | null
          source_id: string | null
        }
        Insert: {
          body: string
          device_id?: string | null
          id?: string
          idempotency_key?: string | null
          ingested_at?: string
          merchant_id: string
          message_hash: string
          provider?: Database["public"]["Enums"]["source_provider"] | null
          received_at: string
          sender?: string | null
          source_id?: string | null
        }
        Update: {
          body?: string
          device_id?: string | null
          id?: string
          idempotency_key?: string | null
          ingested_at?: string
          merchant_id?: string
          message_hash?: string
          provider?: Database["public"]["Enums"]["source_provider"] | null
          received_at?: string
          sender?: string | null
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raw_messages_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_messages_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_messages_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "payment_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_reviews: {
        Row: {
          created_at: string
          id: string
          level: Database["public"]["Enums"]["risk_level"]
          merchant_id: string
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          level: Database["public"]["Enums"]["risk_level"]
          merchant_id: string
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["risk_level"]
          merchant_id?: string
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_reviews_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_reviews_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "parsed_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      source_balances: {
        Row: {
          balance: number
          detected_at: string
          id: string
          reason: string | null
          source_id: string
        }
        Insert: {
          balance: number
          detected_at?: string
          id?: string
          reason?: string | null
          source_id: string
        }
        Update: {
          balance?: number
          detected_at?: string
          id?: string
          reason?: string | null
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_balances_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "payment_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          merchant_id: string
          plan_id: string
          status: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          merchant_id: string
          plan_id: string
          status?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          merchant_id?: string
          plan_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          transaction_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          transaction_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_events_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "parsed_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: string
          merchant_id: string
          metadata: Json | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          kind: string
          merchant_id: string
          metadata?: Json | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          merchant_id?: string
          metadata?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          merchant_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          merchant_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          merchant_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempts: number
          created_at: string
          event_type: string
          id: string
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          status_code: number | null
          succeeded: boolean
          webhook_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          event_type: string
          id?: string
          next_retry_at?: string | null
          payload: Json
          response_body?: string | null
          status_code?: number | null
          succeeded?: boolean
          webhook_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          event_type?: string
          id?: string
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          status_code?: number | null
          succeeded?: boolean
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean
          merchant_id: string
          secret: string
          url: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          merchant_id: string
          secret: string
          url: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          merchant_id?: string
          secret?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_demo_merchant: { Args: { _user_id: string }; Returns: string }
      current_user_merchant_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_internal_admin: { Args: { _user_id: string }; Returns: boolean }
      is_merchant_member: {
        Args: { _merchant_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      alert_severity: "info" | "warning" | "error" | "critical"
      app_role:
        | "super_admin"
        | "internal_admin"
        | "merchant_owner"
        | "merchant_admin"
        | "operator"
        | "finance_viewer"
        | "support_agent"
      merchant_status: "pending" | "active" | "suspended" | "closed"
      order_status:
        | "awaiting_payment"
        | "partially_matched"
        | "confirmed"
        | "manual_review"
        | "expired"
        | "cancelled"
      risk_level: "low" | "medium" | "high" | "critical"
      source_provider:
        | "vodafone_cash"
        | "etisalat_cash"
        | "orange_cash"
        | "we_pay"
        | "instapay"
        | "bank_sms"
        | "other"
      source_status: "active" | "paused" | "offline" | "limit_risk"
      txn_status:
        | "pending"
        | "confirmed"
        | "rejected"
        | "duplicate"
        | "manual_review"
        | "expired"
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
      alert_severity: ["info", "warning", "error", "critical"],
      app_role: [
        "super_admin",
        "internal_admin",
        "merchant_owner",
        "merchant_admin",
        "operator",
        "finance_viewer",
        "support_agent",
      ],
      merchant_status: ["pending", "active", "suspended", "closed"],
      order_status: [
        "awaiting_payment",
        "partially_matched",
        "confirmed",
        "manual_review",
        "expired",
        "cancelled",
      ],
      risk_level: ["low", "medium", "high", "critical"],
      source_provider: [
        "vodafone_cash",
        "etisalat_cash",
        "orange_cash",
        "we_pay",
        "instapay",
        "bank_sms",
        "other",
      ],
      source_status: ["active", "paused", "offline", "limit_risk"],
      txn_status: [
        "pending",
        "confirmed",
        "rejected",
        "duplicate",
        "manual_review",
        "expired",
      ],
    },
  },
} as const
