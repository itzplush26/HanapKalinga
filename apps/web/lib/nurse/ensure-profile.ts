import type { SupabaseClient } from "@supabase/supabase-js";

export type NurseProviderType = "nurse" | "caregiver";

/**
 * Ensures a `nurses` row exists for the given user.
 * Safe to call multiple times (upsert with onConflict id).
 */
export async function ensureNurseProfile(
  supabase: SupabaseClient,
  userId: string,
  providerType: NurseProviderType = "nurse"
) {
  return supabase.from("nurses").upsert(
    {
      id: userId,
      provider_type: providerType,
      verification_status: "pending"
    },
    { onConflict: "id" }
  );
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
