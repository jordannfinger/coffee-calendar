import type { Database, Tables } from "./database.types";

// Typed overlay until the unapplied migration can be included in generated types.
export type SharedCoffee = Pick<Tables<"coffees">,
  "name" | "roaster" | "origin" | "region" | "producer" | "variety" |
  "elevation_m" | "process" | "process_subtype" | "roast_level" | "roast_date" |
  "tasting_notes" | "brew_method" | "grind_setting" | "recipe" | "dose_g" |
  "water_g" | "storage_method"
>;

export type ClientDatabase = Database & {
  public: {
    Functions: {
      get_shared_coffee: { Args: { token: string }; Returns: SharedCoffee[] };
    };
  };
};
