// Auto-generated from the Supabase schema. Regenerate with:
//   (via the Supabase MCP `generate_typescript_types` tool, or)
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
// Do not hand-edit.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      brew_logs: {
        Row: {
          brew_method: string | null;
          brewed_at: string;
          coffee_id: string;
          created_at: string;
          dose_g: number | null;
          drawdown: string | null;
          grind_setting: string | null;
          id: string;
          locked: boolean;
          notes: string | null;
          rating: number | null;
          tasting_notes: string | null;
          updated_at: string;
          user_id: string;
          water_g: number | null;
        };
        Insert: {
          brew_method?: string | null;
          brewed_at?: string;
          coffee_id: string;
          created_at?: string;
          dose_g?: number | null;
          drawdown?: string | null;
          grind_setting?: string | null;
          id?: string;
          locked?: boolean;
          notes?: string | null;
          rating?: number | null;
          tasting_notes?: string | null;
          updated_at?: string;
          user_id: string;
          water_g?: number | null;
        };
        Update: {
          brew_method?: string | null;
          brewed_at?: string;
          coffee_id?: string;
          created_at?: string;
          dose_g?: number | null;
          drawdown?: string | null;
          grind_setting?: string | null;
          id?: string;
          locked?: boolean;
          notes?: string | null;
          rating?: number | null;
          tasting_notes?: string | null;
          updated_at?: string;
          user_id?: string;
          water_g?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "brew_logs_coffee_id_fkey";
            columns: ["coffee_id"];
            isOneToOne: false;
            referencedRelation: "coffees";
            referencedColumns: ["id"];
          },
        ];
      };
      coffees: {
        Row: {
          bag_opened_date: string | null;
          bag_size_g: number | null;
          brew_method: string | null;
          created_at: string;
          dose_g: number | null;
          elevation_m: number | null;
          grind_setting: string | null;
          harvest_year: number | null;
          id: string;
          lot: string | null;
          name: string;
          notes: string | null;
          order_date: string | null;
          origin: string;
          process: Database["public"]["Enums"]["coffee_process"];
          process_subtype: string | null;
          producer: string | null;
          rating: number | null;
          recipe: string | null;
          region: string | null;
          remaining_percent: number | null;
          roast_date: string;
          roast_level: Database["public"]["Enums"]["roast_level"];
          roaster: string;
          share_token: string | null;
          storage_method: string | null;
          tasting_notes: string | null;
          updated_at: string;
          user_id: string;
          variety: string | null;
          water_g: number | null;
        };
        Insert: {
          bag_opened_date?: string | null;
          bag_size_g?: number | null;
          brew_method?: string | null;
          created_at?: string;
          dose_g?: number | null;
          elevation_m?: number | null;
          grind_setting?: string | null;
          harvest_year?: number | null;
          id?: string;
          lot?: string | null;
          name: string;
          notes?: string | null;
          order_date?: string | null;
          origin: string;
          process: Database["public"]["Enums"]["coffee_process"];
          process_subtype?: string | null;
          producer?: string | null;
          rating?: number | null;
          recipe?: string | null;
          region?: string | null;
          remaining_percent?: number | null;
          roast_date: string;
          roast_level: Database["public"]["Enums"]["roast_level"];
          roaster: string;
          share_token?: string | null;
          storage_method?: string | null;
          tasting_notes?: string | null;
          updated_at?: string;
          user_id: string;
          variety?: string | null;
          water_g?: number | null;
        };
        Update: {
          bag_opened_date?: string | null;
          bag_size_g?: number | null;
          brew_method?: string | null;
          created_at?: string;
          dose_g?: number | null;
          elevation_m?: number | null;
          grind_setting?: string | null;
          harvest_year?: number | null;
          id?: string;
          lot?: string | null;
          name?: string;
          notes?: string | null;
          order_date?: string | null;
          origin?: string;
          process?: Database["public"]["Enums"]["coffee_process"];
          process_subtype?: string | null;
          producer?: string | null;
          rating?: number | null;
          recipe?: string | null;
          region?: string | null;
          remaining_percent?: number | null;
          roast_date?: string;
          roast_level?: Database["public"]["Enums"]["roast_level"];
          roaster?: string;
          share_token?: string | null;
          storage_method?: string | null;
          tasting_notes?: string | null;
          updated_at?: string;
          user_id?: string;
          variety?: string | null;
          water_g?: number | null;
        };
        Relationships: [];
      };
      process_profiles: {
        Row: {
          confidence: Database["public"]["Enums"]["profile_confidence"];
          created_at: string;
          drinkable_end_days: number;
          id: string;
          min_rest_days: number;
          notes: string | null;
          peak_end_days: number;
          peak_start_days: number;
          process: Database["public"]["Enums"]["coffee_process"];
          roast_level: Database["public"]["Enums"]["roast_level"];
          subtype: string | null;
          too_old_days: number;
          updated_at: string;
        };
        Insert: {
          confidence?: Database["public"]["Enums"]["profile_confidence"];
          created_at?: string;
          drinkable_end_days: number;
          id?: string;
          min_rest_days: number;
          notes?: string | null;
          peak_end_days: number;
          peak_start_days: number;
          process: Database["public"]["Enums"]["coffee_process"];
          roast_level: Database["public"]["Enums"]["roast_level"];
          subtype?: string | null;
          too_old_days: number;
          updated_at?: string;
        };
        Update: {
          confidence?: Database["public"]["Enums"]["profile_confidence"];
          created_at?: string;
          drinkable_end_days?: number;
          id?: string;
          min_rest_days?: number;
          notes?: string | null;
          peak_end_days?: number;
          peak_start_days?: number;
          process?: Database["public"]["Enums"]["coffee_process"];
          roast_level?: Database["public"]["Enums"]["roast_level"];
          subtype?: string | null;
          too_old_days?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
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
        | "experimental";
      profile_confidence: "high" | "medium" | "low";
      roast_level: "light" | "light_medium" | "medium" | "medium_dark";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
