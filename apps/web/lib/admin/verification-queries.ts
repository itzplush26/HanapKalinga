import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";

/** Statuses shown on the admin "Pending" stat card and pending queue tab. */
export const PENDING_VERIFICATION_STATUSES = ["pending"] as const;

export const VERIFICATION_QUEUE_SELECT =
  "id, provider_type, verification_status, submitted_at, profile_photo_url, prc_document_url, tesda_document_url, nbi_document_url, prc_license_expiry, tesda_cert_expiry, nbi_expiry, bio, specializations, daily_rate_range, hourly_rate_range, profiles!nurses_id_fkey(full_name, first_name, last_name, city, region, profile_photo_url)";

export function getAdminDataClient(sessionClient: SupabaseClient) {
  try {
    return createServiceClient();
  } catch {
    return sessionClient;
  }
}

export async function countPendingVerifications(client: SupabaseClient) {
  return client
    .from("nurses")
    .select("id", { count: "exact", head: true })
    .in("verification_status", [...PENDING_VERIFICATION_STATUSES]);
}

export async function countPendingVerificationsByProviderType(client: SupabaseClient) {
  const { data, error } = await client
    .from("nurses")
    .select("provider_type")
    .in("verification_status", [...PENDING_VERIFICATION_STATUSES]);

  if (error) {
    console.error("admin.countPendingByProviderType", error);
    return { nurses: 0, caregivers: 0, total: 0 };
  }

  const rows = data ?? [];
  const nurses = rows.filter((row) => row.provider_type !== "caregiver").length;
  const caregivers = rows.filter((row) => row.provider_type === "caregiver").length;

  return { nurses, caregivers, total: rows.length };
}

export async function fetchVerificationQueueRows(client: SupabaseClient) {
  return client
    .from("nurses")
    .select(VERIFICATION_QUEUE_SELECT)
    .order("submitted_at", { ascending: false, nullsFirst: false });
}
