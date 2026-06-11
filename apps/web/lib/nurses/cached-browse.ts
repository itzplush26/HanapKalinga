import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

export async function fetchVerifiedNursesForBrowse() {
  const service = createServiceClient();
  const { data, error } = await service
    .from("nurses")
    .select(
      "id, provider_type, specializations, years_experience, daily_rate_12hr, daily_rate_12hr_max, daily_rate_range, profile_photo_url, prc_license_expiry, tesda_cert_expiry, nbi_expiry, profiles(full_name, first_name, last_name, city, region, barangay)"
    )
    .eq("verification_status", "verified");

  if (error) {
    console.error("nurses.browse.cache_fetch", error);
    return [];
  }

  return data ?? [];
}

export const getCachedVerifiedNurses = unstable_cache(
  fetchVerifiedNursesForBrowse,
  ["verified-nurses-browse"],
  { revalidate: 60 }
);
