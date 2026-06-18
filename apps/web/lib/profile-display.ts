import { toTitleCase } from "@/lib/validation/format-name";

export type ProfileNameFields = {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

export function resolveProfileDisplayName(
  profile: ProfileNameFields | null | undefined,
  fallback = "Care provider"
): string {
  const fullName = profile?.full_name?.trim();
  if (fullName) return toTitleCase(fullName);

  const parts = [profile?.first_name, profile?.last_name]
    .map((part) => part?.trim())
    .filter((part): part is string => !!part);

  if (parts.length > 0) return toTitleCase(parts.join(" "));
  return fallback;
}

export function resolveProfileCity(city: string | null | undefined): string {
  const trimmed = city?.trim();
  return trimmed || "Location not set";
}

export function formatYearsExperience(years: number | null | undefined): string {
  if (years == null || years <= 0) return "New";
  return `${years} yrs exp`;
}
