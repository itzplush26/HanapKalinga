import type { SupabaseClient } from "@supabase/supabase-js";
import { getPostLoginPath, parseSafeRedirect } from "@/lib/auth-redirect";
import { isProviderRole, type ProfileRole } from "@/lib/provider-role";
import { mapSupabaseError } from "@/lib/user-errors";

export type { ProfileRole };

export async function fetchProfileRole(
  supabase: SupabaseClient,
  userId: string
): Promise<{ role: ProfileRole | null; suspended: boolean; error: string | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, suspended")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("post-auth.fetchProfileRole", error);
    return { role: null, suspended: false, error: mapSupabaseError(error, "profile") };
  }

  const role = data?.role;
  const suspended = Boolean(data?.suspended);
  if (role === "family" || role === "admin" || isProviderRole(role)) {
    return { role: role as ProfileRole, suspended, error: null };
  }

  return { role: null, suspended, error: null };
}

export function resolvePostLoginDestination(
  role: ProfileRole | null,
  redirectParam: string | null | undefined
): string | null {
  const safeRedirect = parseSafeRedirect(redirectParam ?? null);
  if (!role) return null;
  return getPostLoginPath(role, safeRedirect);
}
