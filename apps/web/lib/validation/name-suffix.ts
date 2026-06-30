export const GENERAL_NAME_SUFFIXES = ["Jr.", "Sr.", "II", "III", "IV", "V"] as const;
export const PROFESSIONAL_NAME_SUFFIXES = ["RN", "MD", "LPN"] as const;

export const FAMILY_NAME_SUFFIXES = ["Jr.", "Sr.", "II", "III", "IV", "V", "RN", "MD", "LPN"] as const;
export const PROVIDER_NAME_SUFFIXES = ["Jr.", "Sr.", "II", "III", "IV", "V", "RN", "MD", "LPN"] as const;

export const NAME_SUFFIX_OPTION_GROUPS = [
  { label: "General suffixes", options: GENERAL_NAME_SUFFIXES },
  { label: "Professional suffixes", options: PROFESSIONAL_NAME_SUFFIXES }
] as const;

export function normalizeNameSuffix(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
