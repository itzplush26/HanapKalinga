export const PRC_LICENSE_LENGTH = 7;

export const PRC_LICENSE_PATTERN = /^\d{7}$/;

export const PRC_LICENSE_ERROR = "Please enter a valid PRC License Number.";
export const TESDA_CERTIFICATE_ERROR = "Please enter a valid TESDA Certificate Number.";

function hasIdenticalDigits(value: string): boolean {
  return /^(.)\1+$/.test(value);
}

function hasSequentialDigits(value: string, direction: "asc" | "desc"): boolean {
  for (let index = 1; index < value.length; index += 1) {
    const previous = Number(value[index - 1]);
    const current = Number(value[index]);
    if (direction === "asc" && current !== previous + 1) return false;
    if (direction === "desc" && current !== previous - 1) return false;
  }
  return true;
}

function hasObviouslyFakeNumericPattern(value: string): boolean {
  return (
    hasIdenticalDigits(value) || hasSequentialDigits(value, "asc") || hasSequentialDigits(value, "desc")
  );
}

export function isValidPrcLicenseNo(value: string | null | undefined): boolean {
  const trimmed = value?.trim() ?? "";
  if (!PRC_LICENSE_PATTERN.test(trimmed)) return false;
  return !hasObviouslyFakeNumericPattern(trimmed);
}

export function isValidTesdaCertificateNo(value: string | null | undefined): boolean {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return false;
  if (!/^\d+$/.test(trimmed)) return true;
  return !hasObviouslyFakeNumericPattern(trimmed);
}

export function normalizePrcLicenseInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, PRC_LICENSE_LENGTH);
}
