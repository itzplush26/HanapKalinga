import { BLOCKED_WORDS } from "@/lib/validation/blocked-words";

const PROFANITY_SUBSTITUTIONS: Record<string, string> = {
  "@": "a",
  "4": "a",
  "3": "e",
  "€": "e",
  "1": "i",
  "!": "i",
  "|": "i",
  "0": "o",
  "ø": "o",
  "Ø": "o",
  "5": "s",
  "$": "s",
  "7": "t",
  "+": "t",
  "ü": "u",
  "Ü": "u"
};

const INVISIBLE_CHARS = /[\u200B-\u200D\uFEFF\u2060\u00AD]/g;
const COMBINING_MARKS = /[\u0300-\u036f]/g;
const SPAN_SEPARATORS = "(?:[\\s\\-_.\\u200B-\\u200D\\uFEFF\\u2060\\u00AD]*)";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeBase(value: string): string {
  return value
    .replace(INVISIBLE_CHARS, "")
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .split("")
    .map((char) => PROFANITY_SUBSTITUTIONS[char] ?? char)
    .join("")
    .replace(/[^a-z0-9\s'\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collapseRepeatedChars(value: string, maxRepeats: number): string {
  if (maxRepeats <= 0) return value;
  return value.replace(/(.)\1+/g, (run, char: string) => char.repeat(Math.min(run.length, maxRepeats)));
}

function buildCharPattern(char: string): string {
  const lower = char.toLowerCase();
  switch (lower) {
    case "a":
      return "[a@4]";
    case "e":
      return "[e3€]";
    case "i":
      return "[i1!|]";
    case "o":
      return "[o0ø]";
    case "s":
      return "[s5$]";
    case "t":
      return "[t7+]";
    case "u":
      return "[uü]";
    default:
      return escapeRegex(lower);
  }
}

function canonicalizeBlockedWord(word: string): string {
  return normalizeBase(word).replace(/[\s'\-]+/g, "");
}

function buildProfanityRegex(word: string): RegExp | null {
  const canonical = canonicalizeBlockedWord(word);
  if (!canonical) return null;

  const sequence = canonical
    .split("")
    .map((char) => `${buildCharPattern(char)}+`)
    .join(SPAN_SEPARATORS);

  return new RegExp(`(?<![a-z0-9])(${sequence})(?![a-z0-9])`, "giu");
}

const BLOCKED_CANONICAL_WORDS = Array.from(
  new Set(
    BLOCKED_WORDS.map((word) => canonicalizeBlockedWord(word)).filter((word) => word.length > 0)
  )
);
const PROFANITY_REGEXES = BLOCKED_WORDS.map((word) => buildProfanityRegex(word)).filter(
  (regex): regex is RegExp => Boolean(regex)
);

export function sanitizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeForProfanityCheck(value: string): string {
  const base = normalizeBase(value);
  return collapseRepeatedChars(base, 2);
}

export function containsProfanity(value: string): boolean {
  if (!value) return false;

  const normalized = normalizeForProfanityCheck(value);
  const normalizedCollapsed = collapseRepeatedChars(normalized, 1);
  const normalizedCompact = normalized.replace(/[\s'\-]+/g, "");
  const normalizedCompactCollapsed = normalizedCollapsed.replace(/[\s'\-]+/g, "");
  const originalNormalized = normalizeBase(value);
  const originalCompact = originalNormalized.replace(/[\s'\-]+/g, "");

  for (const regex of PROFANITY_REGEXES) {
    regex.lastIndex = 0;
    if (regex.test(value)) return true;
  }

  for (const blocked of BLOCKED_CANONICAL_WORDS) {
    if (!blocked) continue;
    if (normalizedCompact.includes(blocked)) return true;
    if (normalizedCompactCollapsed.includes(blocked)) return true;
    if (originalCompact.includes(blocked)) return true;

    const boundary = new RegExp(`\\b${escapeRegex(blocked)}\\b`, "i");
    if (boundary.test(originalNormalized)) return true;
  }

  return false;
}

export function maskProfanity(value: string): string {
  if (!value) return value;

  // Ensure mask logic shares the same normalization path used by containsProfanity.
  void normalizeForProfanityCheck(value);

  const chars = Array.from(value);
  const maskFlags = new Array(chars.length).fill(false);

  for (const regex of PROFANITY_REGEXES) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null = regex.exec(value);

    while (match) {
      const start = match.index;
      const end = start + match[0].length;
      for (let index = start; index < end; index += 1) {
        if (/\s/.test(chars[index] ?? "")) continue;
        maskFlags[index] = true;
      }
      match = regex.exec(value);
    }
  }

  return chars.map((char, index) => (maskFlags[index] ? "#" : char)).join("");
}
