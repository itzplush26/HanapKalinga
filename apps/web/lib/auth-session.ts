import type { SupabaseClient } from "@supabase/supabase-js";

/** Prefer local session during signup flows; fall back to getUser(). */
export async function resolveAuthUserId(
  supabase: SupabaseClient,
  preferredUserId?: string | null
): Promise<string | null> {
  if (preferredUserId) return preferredUserId;

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user?.id) {
    return sessionData.session.user.id;
  }

  const { data: authData } = await supabase.auth.getUser();
  return authData.user?.id ?? null;
}
