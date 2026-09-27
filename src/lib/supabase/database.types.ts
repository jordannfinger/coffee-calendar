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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      brew_logs: {
        Row: {
          brew_method: string | null
          brewed_at: string
          coffee_id: string
          created_at: string
          dose_g: number | null
          drawdown: string | null
          grind_setting: string | null
          id: string
          locked: boolean
          notes: string | null
          rating: number | null
          tasting_notes: string | null
          updated_at: string
          user_id: string
          water_g: number | null
        }
        Insert: {
          brew_method?: string | null
          brewed_at?: string
          coffee_id: string
          created_at?: string
          dose_g?: number | null
          drawdown?: string | null
          grind_setting?: string | null
          id?: string
          locked?: boolean
          notes?: string | null
          rating?: number | null
          tasting_notes?: string | null
          updated_at?: string
          user_id: string
          water_g?: number | null
        }
        Update: {
          brew_method?: string | null
          brewed_at?: string
          coffee_id?: string
          created_at?: string
          dose_g?: number | null
          drawdown?: string | null
          grind_setting?: string | null
          id?: string
          locked?: boolean
          notes?: string | null
          rating?: number | null
          tasting_notes?: string | null
          updated_at?: string
          user_id?: string
          water_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "brew_logs_coffee_owner_fkey"
            columns: ["coffee_id", "user_id"]
            isOneToOne: false
            referencedRelation: "coffees"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      coffees: {
        Row: {
          bag_opened_date: string | null
          bag_size_g: number | null
          brew_method: string | null
          created_at: string
          dose_g: number | null
          elevation_m: number | null
          grind_setting: string | null
          harvest_year: number | null
          id: string
          lot: string | null
          name: string
          notes: string | null
          order_date: string | null
          origin: string
          process: Database["public"]["Enums"]["coffee_process"]
          process_subtype: string | null
          producer: string | null
          rating: number | null
          recipe: string | null
          region: string | null
          remaining_percent: number | null
          roast_date: string
          roast_level: Database["public"]["Enums"]["roast_level"]
          roaster: string
          share_token: string | null
          storage_method: string | null
          tasting_notes: string | null
          updated_at: string
          user_id: string
          variety: string | null
          water_g: number | null
        }
        Insert: {
          bag_opened_date?: string | null
          bag_size_g?: number | null
          brew_method?: string | null
          created_at?: string
          dose_g?: number | null
          elevation_m?: number | null
          grind_setting?: string | null
          harvest_year?: number | null
          id?: string
          lot?: string | null
          name: string
          notes?: string | null
          order_date?: string | null
          origin: string
          process: Database["public"]["Enums"]["coffee_process"]
          process_subtype?: string | null
          producer?: string | null
          rating?: number | null
          recipe?: string | null
          region?: string | null
          remaining_percent?: number | null
          roast_date: string
          roast_level: Database["public"]["Enums"]["roast_level"]
          roaster: string
          share_token?: string | null
          storage_method?: string | null
          tasting_notes?: string | null
          updated_at?: string
          user_id: string
          variety?: string | null
          water_g?: number | null
        }
        Update: {
          bag_opened_date?: string | null
          bag_size_g?: number | null
          brew_method?: string | null
          created_at?: string
          dose_g?: number | null
          elevation_m?: number | null
          grind_setting?: string | null
          harvest_year?: number | null
          id?: string
          lot?: string | null
          name?: string
          notes?: string | null
          order_date?: string | null
          origin?: string
          process?: Database["public"]["Enums"]["coffee_process"]
          process_subtype?: string | null
          producer?: string | null
          rating?: number | null
          recipe?: string | null
          region?: string | null
          remaining_percent?: number | null
          roast_date?: string
          roast_level?: Database["public"]["Enums"]["roast_level"]
          roaster?: string
          share_token?: string | null
          storage_method?: string | null
          tasting_notes?: string | null
          updated_at?: string
          user_id?: string
          variety?: string | null
          water_g?: number | null
        }
        Relationships: []
      }
      process_profiles: {
        Row: {
          confidence: Database["public"]["Enums"]["profile_confidence"]
          created_at: string
          drinkable_end_days: number
          id: string
          min_rest_days: number
          notes: string | null
          peak_end_days: number
          peak_start_days: number
          process: Database["public"]["Enums"]["coffee_process"]
          roast_level: Database["public"]["Enums"]["roast_level"]
          subtype: string | null
          too_old_days: number
          updated_at: string
        }
        Insert: {
          confidence?: Database["public"]["Enums"]["profile_confidence"]
          created_at?: string
          drinkable_end_days: number
          id?: string
          min_rest_days: number
          notes?: string | null
          peak_end_days: number
          peak_start_days: number
          process: Database["public"]["Enums"]["coffee_process"]
          roast_level: Database["public"]["Enums"]["roast_level"]
          subtype?: string | null
          too_old_days: number
          updated_at?: string
        }
        Update: {
          confidence?: Database["public"]["Enums"]["profile_confidence"]
          created_at?: string
          drinkable_end_days?: number
          id?: string
          min_rest_days?: number
          notes?: string | null
          peak_end_days?: number
          peak_start_days?: number
          process?: Database["public"]["Enums"]["coffee_process"]
          roast_level?: Database["public"]["Enums"]["roast_level"]
          subtype?: string | null
          too_old_days?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_shared_coffee: {
        Args: { token: string }
        Returns: {
          brew_method: string
          dose_g: number
          elevation_m: number
          grind_setting: string
          name: string
          origin: string
          process: Database["public"]["Enums"]["coffee_process"]
          process_subtype: string
          producer: string
          recipe: string
          region: string
          roast_date: string
          roast_level: Database["public"]["Enums"]["roast_level"]
          roaster: string
          storage_method: string
          tasting_notes: string
          variety: string
          water_g: number
        }[]
      }
    }
    Enums: {
      coffee_process:
        | "washed"
        | "natural"
        | "honey"
        | "anaerobic"
        | "anaerobic_natural"
        | "anaerobic_washed"
        | "carbonic_maceration"
        | "carbonic_maceration_natural"
        | "thermal_shock"
        | "koji"
        | "lactic"
        | "yeast_inoculated"
        | "extended_fermentation"
        | "wet_hulled"
        | "experimental"
      profile_confidence: "high" | "medium" | "low"
      roast_level: "light" | "light_medium" | "medium" | "medium_dark"
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
  public: {
    Enums: {
      coffee_process: [
        "washed",
        "natural",
        "honey",
        "anaerobic",
        "anaerobic_natural",
        "anaerobic_washed",
        "carbonic_maceration",
        "carbonic_maceration_natural",
        "thermal_shock",
        "koji",
        "lactic",
        "yeast_inoculated",
        "extended_fermentation",
        "wet_hulled",
        "experimental",
      ],
      profile_confidence: ["high", "medium", "low"],
      roast_level: ["light", "light_medium", "medium", "medium_dark"],
    },
  },
} as const
