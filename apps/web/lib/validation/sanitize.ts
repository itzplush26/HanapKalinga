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
