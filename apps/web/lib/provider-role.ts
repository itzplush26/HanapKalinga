export type ProfileRole = "family" | "nurse" | "caregiver" | "admin";

export type ProviderType = "nurse" | "caregiver";

export function isProviderRole(role: string | null | undefined): role is "nurse" | "caregiver" {
  return role === "nurse" || role === "caregiver";
}

export function profileRoleForProviderType(providerType: ProviderType): "nurse" | "caregiver" {
  return providerType === "caregiver" ? "caregiver" : "nurse";
}

export function providerTypeLabel(providerType: string | null | undefined): string {
  return providerType === "caregiver" ? "Caregiver" : "Nurse";
}
