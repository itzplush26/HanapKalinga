import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";

export const SIGNUP_LIMITS = {
  nurse: 25,
  caregiver: 15,
  family: 40
} as const;

export type SignupCapacityKind = keyof typeof SIGNUP_LIMITS;

export function getSignupLimitClient(sessionClient: SupabaseClient) {
  try {
    return createServiceClient();
  } catch {
    return sessionClient;
  }
}

export async function countNursesByProviderType(
  client: SupabaseClient,
  providerType: "nurse" | "caregiver"
) {
  return client
    .from("nurses")
    .select("id", { count: "exact", head: true })
    .eq("provider_type", providerType);
}

export async function countFamilies(client: SupabaseClient) {
  return client
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "family");
}

export function signupCapacityMessage(kind: SignupCapacityKind): string {
  if (kind === "family") {
    return `Signup is currently full for family accounts (${SIGNUP_LIMITS.family} max). Please contact support for waitlist options.`;
  }

  const providerLabel = kind === "caregiver" ? "caregiver" : "nurse";
  return `Signup is currently full for ${providerLabel} accounts (${SIGNUP_LIMITS[kind]} max). Please contact support for waitlist options.`;
}

export async function getSignupCapacity(
  client: SupabaseClient,
  kind: SignupCapacityKind
): Promise<{ available: boolean; count: number; limit: number }> {
  const limit = SIGNUP_LIMITS[kind];

  if (kind === "family") {
    const { count, error } = await countFamilies(client);
    if (error) {
      throw error;
    }

    const currentCount = count ?? 0;
    return { available: currentCount < limit, count: currentCount, limit };
  }

  const { count, error } = await countNursesByProviderType(client, kind);
  if (error) {
    throw error;
  }

  const currentCount = count ?? 0;
  return { available: currentCount < limit, count: currentCount, limit };
}
