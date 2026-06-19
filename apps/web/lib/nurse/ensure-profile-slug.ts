import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureNurseProfileSlug(
  service: SupabaseClient,
  nurseId: string,
  fullName: string | null | undefined
): Promise<string | null> {
  const { data: existing } = await service
    .from("nurses")
    .select("profile_slug")
    .eq("id", nurseId)
    .maybeSingle();

  if (existing?.profile_slug?.trim()) {
    return existing.profile_slug;
  }

  const { data: slug, error } = await service.rpc("generate_nurse_profile_slug", {
    p_nurse_id: nurseId,
    p_full_name: fullName?.trim() || "Nurse"
  });

  if (error || !slug) {
    console.error("nurse.ensure_profile_slug", error);
    return null;
  }

  const { error: updateError } = await service
    .from("nurses")
    .update({ profile_slug: slug })
    .eq("id", nurseId);

  if (updateError) {
    console.error("nurse.ensure_profile_slug.update", updateError);
    return null;
  }

  return slug as string;
}
