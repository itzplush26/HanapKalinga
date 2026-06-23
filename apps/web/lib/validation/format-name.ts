import { sanitizeText } from "@/lib/validation/sanitize";
import { normalizeNameSuffix } from "@/lib/validation/name-suffix";

function capitalize(value: string): string {
  if (!value) return "";
  return `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}`;
}

export function toTitleCase(value: string | null | undefined): string {
  if (!value) return "";

  return sanitizeText(value)
    .split(" ")
    .filter(Boolean)
    .map((part) => part.split("-").map((segment) => capitalize(segment)).join("-"))
    .join(" ");
}

export function toMiddleInitial(value: string | null | undefined): string {
  const normalized = toTitleCase(value);
  if (!normalized) return "";
  return `${normalized[0]}.`;
}

export function buildFormattedFullName(params: {
  firstName: string | null | undefined;
  middleName?: string | null | undefined;
  lastName: string | null | undefined;
  suffix?: string | null | undefined;
}): string {
  const firstName = toTitleCase(params.firstName);
  const middleName = toTitleCase(params.middleName);
  const lastName = toTitleCase(params.lastName);
  const suffix = normalizeNameSuffix(params.suffix);

  const parts = [firstName, middleName ? toMiddleInitial(middleName) : "", lastName, suffix ?? ""].filter(
    (part) => part && part.trim().length > 0
  );

  return parts.join(" ");
}
