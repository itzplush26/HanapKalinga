import { sanitizeText } from "@/lib/validation/sanitize";

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
