export const PRC_LICENSE_LENGTH = 7;

export const TESDA_CERTIFICATE_MIN_LENGTH = 10;
export const TESDA_CERTIFICATE_MAX_LENGTH = 20;

export const PRC_LICENSE_PATTERN = /^\d{7}$/;

/** Format A: all digits. Format B: uppercase letters then digits (e.g. CSS0123040011). */
const TESDA_FORMAT_A = /^\d+$/;
const TESDA_FORMAT_B = /^[A-Z]+\d+$/;
const TESDA_ALLOWED_CHARS = /^[A-Z0-9]+$/;

const TESDA_BLOCKED_EXAMPLES = new Set(["011304000123", "CSS0123040011"]);

export const PRC_LICENSE_ERROR = "Please enter a valid PRC License Number.";
export const TESDA_CERTIFICATE_ERROR =
  "Please enter a valid TESDA certificate number using only letters and numbers, with no spaces or hyphens.";

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

function hasObviouslyFakeTesdaPattern(value: string): boolean {
  if (/^(.)\1+$/.test(value)) return true;
  if (TESDA_BLOCKED_EXAMPLES.has(value)) return true;
  if (/^\d+$/.test(value) && hasObviouslyFakeNumericPattern(value)) return true;
  return false;
}

function matchesTesdaCertificateFormat(normalized: string): boolean {
  if (normalized.length < TESDA_CERTIFICATE_MIN_LENGTH || normalized.length > TESDA_CERTIFICATE_MAX_LENGTH) {
    return false;
  }
  if (!TESDA_ALLOWED_CHARS.test(normalized)) return false;
  if (!/^[0-9A-Z]/.test(normalized)) return false;
  return TESDA_FORMAT_A.test(normalized) || TESDA_FORMAT_B.test(normalized);
}

export function isValidPrcLicenseNo(value: string | null | undefined): boolean {
  const trimmed = value?.trim() ?? "";
  if (!PRC_LICENSE_PATTERN.test(trimmed)) return false;
  return !hasObviouslyFakeNumericPattern(trimmed);
}

export function isValidTesdaCertificateNo(value: string | null | undefined): boolean {
  const normalized = normalizeTesdaCertificateInput(value ?? "");
  if (!normalized) return false;
  if (!matchesTesdaCertificateFormat(normalized)) return false;
  return !hasObviouslyFakeTesdaPattern(normalized);
}

export function normalizePrcLicenseInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, PRC_LICENSE_LENGTH);
}

export function normalizeTesdaCertificateInput(value: string): string {
  return value.trim().toUpperCase();
}

export function getTesdaCertificateSegments(value: string): {
  firstFour: string;
  lastFour: string;
} | null {
  const normalized = normalizeTesdaCertificateInput(value);
  if (normalized.length < TESDA_CERTIFICATE_MIN_LENGTH) return null;
  return {
    firstFour: normalized.slice(0, 4),
    lastFour: normalized.slice(-4)
  };
}

export function tesdaCertificateHasInvalidSeparators(value: string | null | undefined): boolean {
  const raw = value?.trim() ?? "";
  return /[\s.\-]/.test(raw);
}

// ponytail: self-check; upgrade path — move to a test file if validation rules grow further.
if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  const assert = (label: string, ok: boolean) => {
    if (!ok) console.error("prc-license.tesda.self_check_failed", label);
  };
  assert("blocks doc examples", !isValidTesdaCertificateNo("011304000123"));
  assert("blocks doc examples 2", !isValidTesdaCertificateNo("CSS0123040011"));
  assert("accepts numeric format", isValidTesdaCertificateNo("011304000124"));
  assert("accepts alpha format", isValidTesdaCertificateNo("CSS0123040012"));
  assert("rejects short", !isValidTesdaCertificateNo("ABC123"));
  assert("segments at min length", getTesdaCertificateSegments("0123456789")?.firstFour === "0123");
}
