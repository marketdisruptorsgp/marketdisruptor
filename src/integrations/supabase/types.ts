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
      api_keys: {
        Row: {
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_usage: {
        Row: {
          calls_used: number
          created_at: string
          id: string
          period_end: string
          period_start: string
          service: string
          updated_at: string
        }
        Insert: {
          calls_used?: number
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          service: string
          updated_at?: string
        }
        Update: {
          calls_used?: number
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          service?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_intel: {
        Row: {
          created_at: string
          data_type: string
          generated_at: string
          id: string
          payload: Json
        }
        Insert: {
          created_at?: string
          data_type: string
          generated_at?: string
          id?: string
          payload?: Json
        }
        Update: {
          created_at?: string
          data_type?: string
          generated_at?: string
          id?: string
          payload?: Json
        }
        Relationships: []
      }
      market_news: {
        Row: {
          category: string
          created_at: string
          id: string
          published_at: string | null
          scraped_at: string
          source_name: string
          source_url: string | null
          summary: string | null
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          published_at?: string | null
          scraped_at?: string
          source_name: string
          source_url?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          published_at?: string | null
          scraped_at?: string
          source_name?: string
          source_url?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      patent_filings: {
        Row: {
          abstract: string | null
          assignee: string | null
          category: string
          created_at: string
          filing_date: string | null
          id: string
          patent_number: string | null
          publication_date: string | null
          scraped_at: string
          source_url: string | null
          status: string | null
          title: string
        }
        Insert: {
          abstract?: string | null
          assignee?: string | null
          category: string
          created_at?: string
          filing_date?: string | null
          id?: string
          patent_number?: string | null
          publication_date?: string | null
          scraped_at?: string
          source_url?: string | null
          status?: string | null
          title: string
        }
        Update: {
          abstract?: string | null
          assignee?: string | null
          category?: string
          created_at?: string
          filing_date?: string | null
          id?: string
          patent_number?: string | null
          publication_date?: string | null
          scraped_at?: string
          source_url?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      platform_intel: {
        Row: {
          computed_at: string
          created_at: string
          id: string
          metric_type: string
          payload: Json
        }
        Insert: {
          computed_at?: string
          created_at?: string
          id?: string
          metric_type: string
          payload?: Json
        }
        Update: {
          computed_at?: string
          created_at?: string
          id?: string
          metric_type?: string
          payload?: Json
        }
        Relationships: []
      }
      portfolio_action_items: {
        Row: {
          analysis_id: string | null
          completed: boolean
          created_at: string
          id: string
          notes: string | null
          position: number
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_id?: string | null
          completed?: boolean
          created_at?: string
          id?: string
          notes?: string | null
          position?: number
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_id?: string | null
          completed?: boolean
          created_at?: string
          id?: string
          notes?: string | null
          position?: number
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string
          id: string
          last_seen_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name: string
          id?: string
          last_seen_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          last_seen_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_credited: boolean
          created_at: string
          id: string
          referral_code: string
          referred_email: string
          referred_user_id: string | null
          referrer_id: string
        }
        Insert: {
          bonus_credited?: boolean
          created_at?: string
          id?: string
          referral_code: string
          referred_email: string
          referred_user_id?: string | null
          referrer_id: string
        }
        Update: {
          bonus_credited?: boolean
          created_at?: string
          id?: string
          referral_code?: string
          referred_email?: string
          referred_user_id?: string | null
          referrer_id?: string
        }
        Relationships: []
      }
      saved_analyses: {
        Row: {
          analysis_data: Json | null
          analysis_depth: string
          analysis_type: string
          audience: string
          avg_revival_score: number | null
          batch_size: number
          category: string
          created_at: string
          era: string
          id: string
          is_anonymous: boolean
          product_count: number
          products: Json
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          analysis_data?: Json | null
          analysis_depth?: string
          analysis_type?: string
          audience: string
          avg_revival_score?: number | null
          batch_size?: number
          category: string
          created_at?: string
          era: string
          id?: string
          is_anonymous?: boolean
          product_count?: number
          products?: Json
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          analysis_data?: Json | null
          analysis_depth?: string
          analysis_type?: string
          audience?: string
          avg_revival_score?: number | null
          batch_size?: number
          category?: string
          created_at?: string
          era?: string
          id?: string
          is_anonymous?: boolean
          product_count?: number
          products?: Json
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trend_signals: {
        Row: {
          category: string
          created_at: string
          data_quality: string | null
          growth_note: string | null
          id: string
          interest_over_time: Json | null
          keyword: string
          opportunity_angle: string | null
          related_queries: Json | null
          scraped_at: string
          source: string | null
          source_urls: string[] | null
        }
        Insert: {
          category: string
          created_at?: string
          data_quality?: string | null
          growth_note?: string | null
          id?: string
          interest_over_time?: Json | null
          keyword: string
          opportunity_angle?: string | null
          related_queries?: Json | null
          scraped_at?: string
          source?: string | null
          source_urls?: string[] | null
        }
        Update: {
          category?: string
          created_at?: string
          data_quality?: string | null
          growth_note?: string | null
          id?: string
          interest_over_time?: Json | null
          keyword?: string
          opportunity_angle?: string | null
          related_queries?: Json | null
          scraped_at?: string
          source?: string | null
          source_urls?: string[] | null
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          analysis_count: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          analysis_count?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          analysis_count?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      user_usage: {
        Row: {
          analysis_count: number
          bonus_analyses: number
          created_at: string
          id: string
          period_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_count?: number
          bonus_analyses?: number
          created_at?: string
          id?: string
          period_start?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_count?: number
          bonus_analyses?: number
          created_at?: string
          id?: string
          period_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          active: boolean
          created_at: string
          events: string[]
          id: string
          url: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          events?: string[]
          id?: string
          url: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          events?: string[]
          id?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_usage: { Args: { p_user_id: string }; Returns: number }
      update_last_seen: { Args: { p_user_id: string }; Returns: undefined }
      upsert_user_streak: { Args: { p_user_id: string }; Returns: undefined }
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
