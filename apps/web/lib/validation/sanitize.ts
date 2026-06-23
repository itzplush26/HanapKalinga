import { BLOCKED_WORDS } from "@/lib/validation/blocked-words";

const LEET_MAP: Record<string, string> = {
  "@": "a",
  "4": "a",
  "3": "e",
  "0": "o",
  "1": "i",
  "!": "i",
  "|": "i",
  "$": "s",
  "5": "s",
  "7": "t"
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeForProfanity(value: string): string {
  return value
    .toLowerCase()
    .split("")
    .map((char) => LEET_MAP[char] ?? char)
    .join("")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function containsProfanity(value: string): boolean {
  const normalized = normalizeForProfanity(value);
  if (!normalized) return false;

  return BLOCKED_WORDS.some((word) => {
    const normalizedBlockedWord = normalizeForProfanity(word);
    if (!normalizedBlockedWord) return false;

    const pattern = normalizedBlockedWord.includes(" ")
      ? `(?:^|\\b)${escapeRegex(normalizedBlockedWord)}(?:\\b|$)`
      : `\\b${escapeRegex(normalizedBlockedWord)}\\b`;

    return new RegExp(pattern, "i").test(normalized);
  });
}

function buildProfanityRegex(word: string): RegExp | null {
  const normalizedBlockedWord = normalizeForProfanity(word);
  if (!normalizedBlockedWord) return null;

  if (normalizedBlockedWord.includes(" ")) {
    const phrase = normalizedBlockedWord
      .split(" ")
      .map((part) => escapeRegex(part))
      .join("\\s+");
    return new RegExp(`(^|[^A-Za-z0-9_])(${phrase})(?=$|[^A-Za-z0-9_])`, "gi");
  }

  return new RegExp(`\\b(${escapeRegex(normalizedBlockedWord)})\\b`, "gi");
}

export function maskProfanity(value: string): string {
  if (!value) return value;

  let masked = value;
  for (const word of BLOCKED_WORDS) {
    const regex = buildProfanityRegex(word);
    if (!regex) continue;

    masked = masked.replace(regex, (match, prefix: string, captured: string) => {
      if (typeof captured === "string") {
        return `${prefix ?? ""}${"#".repeat(captured.length)}`;
      }
      return "#".repeat(match.length);
    });
  }

  return masked;
}
