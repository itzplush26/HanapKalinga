import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve the authenticated user id for client-side flows.
 * Only returns an id when Supabase has an active session — never trusts a cached signup id.
 */
export async function resolveAuthUserId(
  supabase: SupabaseClient,
  _preferredUserId?: string | null
): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user?.id) {
    return sessionData.session.user.id;
  }

  const { data: authData } = await supabase.auth.getUser();
  return authData.user?.id ?? null;
}
