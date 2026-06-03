import type { SupabaseClient } from "@supabase/supabase-js";
import { getPostLoginPath, parseSafeRedirect } from "@/lib/auth-redirect";

export type ProfileRole = "family" | "nurse" | "admin";

export async function fetchProfileRole(
  supabase: SupabaseClient,
  userId: string
): Promise<{ role: ProfileRole | null; error: string | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("post-auth.fetchProfileRole", error);
    return { role: null, error: error.message };
  }

  const role = data?.role;
  if (role === "family" || role === "nurse" || role === "admin") {
    return { role, error: null };
  }

  return { role: null, error: null };
}

export function resolvePostLoginDestination(
  role: ProfileRole | null,
  redirectParam: string | null | undefined
): string | null {
  const safeRedirect = parseSafeRedirect(redirectParam ?? null);
  if (!role) return null;
  return getPostLoginPath(role, safeRedirect);
}
