import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve the authenticated user id for client-side flows.
 * Validates with the server via getUser() — never trusts a cached local session alone.
 */
export async function resolveAuthUserId(
  supabase: SupabaseClient,
  _preferredUserId?: string | null
): Promise<string | null> {
  const { data: authData, error } = await supabase.auth.getUser();
  if (!error && authData.user?.id) {
    return authData.user.id;
  }

  // Drop stale client session when the server rejects the user (deleted account, expired JWT, etc.)
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session) {
    await supabase.auth.signOut({ scope: "local" });
  }

  return null;
}
