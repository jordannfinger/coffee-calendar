import { createBrowserClient } from "@supabase/ssr";
import type { ClientDatabase } from "./sharedCoffee";

export function createClient() {
  return createBrowserClient<ClientDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
