import type { SupabaseClient } from "@supabase/supabase-js";

export type NurseProviderType = "nurse" | "caregiver";

/**
 * Ensures a `nurses` row exists for the given user.
 * Inserts a pending stub only when missing — never resets verification on update.
 */
export async function ensureNurseProfile(
  supabase: SupabaseClient,
  userId: string,
  providerType: NurseProviderType = "nurse"
) {
  const { data: existing, error: readError } = await supabase
    .from("nurses")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (readError) {
    return { data: null, error: readError };
  }

  if (existing) {
    return { data: existing, error: null };
  }

  return supabase.from("nurses").insert({
    id: userId,
    provider_type: providerType,
    verification_status: "pending"
  });
}

/**
 * ONE-TIME DATA REPAIR — run in Supabase SQL Editor after migration 0025 is applied.
 *
 * Finds nurse profiles with no matching `nurses` row and creates a pending stub.
 *
 * ```sql
 * insert into public.nurses (id, provider_type, verification_status)
 * select p.id, 'nurse', 'pending'
 * from public.profiles p
 * left join public.nurses n on n.id = p.id
 * where p.role = 'nurse'
 *   and n.id is null;
 * ```
 */
