export const FAMILY_NAME_SUFFIXES = ["Jr.", "Sr.", "II", "III", "IV", "MD", "RN"] as const;
export const PROVIDER_NAME_SUFFIXES = ["RN", "MD"] as const;

export function normalizeNameSuffix(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
