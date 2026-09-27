import type { User } from "@supabase/supabase-js";
import { createClient } from "./client";

let pending: Promise<User> | null = null;

/** Let startup finish before explicit login can replace its session. */
export async function waitForSessionInitialization(): Promise<void> {
  // A failed guest startup must not prevent an intentional login.
  await pending?.catch(() => undefined);
}

/** Share startup across mounted consumers; a failed lookup is never a missing session. */
export function ensureSession(): Promise<User> {
  if (!pending) {
    pending = initialize().finally(() => { pending = null; });
  }
  return pending;
}

async function initialize(): Promise<User> {
  const supabase = createClient();
  const { data: stored, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  const { data, error } = stored.session
    ? await supabase.auth.getUser()
    : await supabase.auth.signInAnonymously();

  if (error) throw error;
  if (!data.user) throw new Error("Couldn't start your session. Please try again.");
  return data.user;
}
