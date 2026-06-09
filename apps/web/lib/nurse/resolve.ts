import type { SupabaseClient } from "@supabase/supabase-js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export async function resolveNurseId(supabase: SupabaseClient, param: string): Promise<string | null> {
  if (isUuid(param)) return param;

  const { data } = await supabase
    .from("nurses")
    .select("id")
    .eq("profile_slug", param)
    .maybeSingle();

  return data?.id ?? null;
}
