export const PRC_LICENSE_LENGTH = 7;

export const PRC_LICENSE_PATTERN = /^\d{7}$/;

export const PRC_LICENSE_ERROR = "PRC license number must be exactly 7 digits.";

export function isValidPrcLicenseNo(value: string | null | undefined): boolean {
  const trimmed = value?.trim() ?? "";
  return PRC_LICENSE_PATTERN.test(trimmed);
}

export function normalizePrcLicenseInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, PRC_LICENSE_LENGTH);
}
