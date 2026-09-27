import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/today";
  let destination = new URL("/today", origin);
  try {
    const candidate = new URL(next, origin);
    if (next.startsWith("/") && candidate.origin === origin && !candidate.username && !candidate.password) {
      destination = candidate;
    }
  } catch {
    // Malformed destinations use the same safe fallback as external URLs.
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(destination);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
