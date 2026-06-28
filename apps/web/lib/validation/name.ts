import { z } from "zod";
import { containsProfanity, sanitizeText } from "@/lib/validation/sanitize";

export const NAME_LETTERS_REGEX = /^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s'\-]+$/;

const PROFANITY_MESSAGE = "Please enter a valid name.";

function lettersOnlyMessage(fieldLabel: string) {
  return `${fieldLabel} must contain letters only.`;
}

function hasInvalidNamePunctuation(value: string): boolean {
  if (/^['-]/.test(value) || /['-]$/.test(value)) return true;
  if (/['-]{2,}/.test(value)) return true;
  return false;
}

function isPlaceholderLikeName(value: string): boolean {
  const normalized = value.toLowerCase();
  if (/(.)\1\1/.test(normalized)) return true;
  if (/^(ah+|ha+|he+|hi+|ho+|uh+|hmm+|mm+)$/.test(normalized)) return true;
  if (/^(asdf|qwerty|test|random)$/.test(normalized)) return true;
  return false;
}

function requiredNameSchema(fieldLabel: string, minLength: number, maxLength: number) {
  return z
    .string()
    .transform(sanitizeText)
    .refine((value) => value.length >= minLength, {
      message: `${fieldLabel} is too short.`
    })
    .refine((value) => value.length <= maxLength, {
      message: `${fieldLabel} is too long.`
    })
    .refine((value) => NAME_LETTERS_REGEX.test(value), {
      message: lettersOnlyMessage(fieldLabel)
    })
    .refine((value) => !hasInvalidNamePunctuation(value), {
      message: lettersOnlyMessage(fieldLabel)
    })
    .refine((value) => !containsProfanity(value), {
      message: PROFANITY_MESSAGE
    })
    .refine((value) => !isPlaceholderLikeName(value), {
      message: PROFANITY_MESSAGE
    });
}

function optionalNameSchema(fieldLabel: string, minLength: number, maxLength: number) {
  return z
    .string()
    .transform(sanitizeText)
    .refine((value) => !value || value.length >= minLength, {
      message: `${fieldLabel} is too short.`
    })
    .refine((value) => !value || value.length <= maxLength, {
      message: `${fieldLabel} is too long.`
    })
    .refine((value) => !value || NAME_LETTERS_REGEX.test(value), {
      message: lettersOnlyMessage(fieldLabel)
    })
    .refine((value) => !value || !hasInvalidNamePunctuation(value), {
      message: lettersOnlyMessage(fieldLabel)
    })
    .refine((value) => !value || !containsProfanity(value), {
      message: PROFANITY_MESSAGE
    })
    .refine((value) => !value || !isPlaceholderLikeName(value), {
      message: PROFANITY_MESSAGE
    })
    .optional();
}

export const firstNameSchema = requiredNameSchema("First name", 2, 50);
export const lastNameSchema = requiredNameSchema("Last name", 2, 50);
export const middleNameSchema = optionalNameSchema("Middle name", 1, 50);
export const patientNameSchema = optionalNameSchema("Patient name", 2, 50);

export type ServerNameField = "firstName" | "middleName" | "lastName" | "patientName";

export function validateServerName(
  value: string | null | undefined,
  field: ServerNameField
): { ok: true; value: string } | { ok: false; message: string } {
  const normalized = sanitizeText(value ?? "");
  const required = field === "firstName" || field === "lastName";
  const minLength = field === "middleName" ? 1 : 2;

  if (!normalized) {
    if (required) {
      return { ok: false, message: "Name is too short." };
    }
    return { ok: true, value: "" };
  }

  if (normalized.length < minLength) {
    return { ok: false, message: "Name is too short." };
  }

  if (!NAME_LETTERS_REGEX.test(normalized) || hasInvalidNamePunctuation(normalized)) {
    return { ok: false, message: "Invalid name format provided." };
  }

  if (containsProfanity(normalized)) {
    return { ok: false, message: "Name contains inappropriate content." };
  }

  if (isPlaceholderLikeName(normalized)) {
    return { ok: false, message: "Invalid name format provided." };
  }

  return { ok: true, value: normalized };
}

export function validateServerRegistrationNames(values: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  patientName?: string | null;
}): { ok: true } | { ok: false; message: string } {
  for (const field of ["firstName", "middleName", "lastName", "patientName"] as const) {
    const result = validateServerName(values[field], field);
    if (!result.ok) {
      return result;
    }
  }

  return { ok: true };
}

// ponytail: self-check for name validation edge cases; upgrade path: small test file if rules grow
if (process.env.NODE_ENV !== "production") {
  const checks: Array<[string, ServerNameField, boolean]> = [
    ["Juan", "firstName", true],
    ["123456", "lastName", false],
    ["tangina", "firstName", false],
    ["t@ngina", "firstName", false],
    ["g@go", "firstName", false],
    ["0gag", "firstName", false],
    ["ogag", "firstName", false],
    ["panget", "firstName", false],
    ["bwisit", "firstName", false],
    ["siraulo", "firstName", false],
    ["inutil", "firstName", false],
    ["pu7a", "firstName", false],
    ["b0b0", "firstName", false],
    ["t@ng1na", "firstName", false],
    ["Ahhh", "firstName", false],
    ["Tangina", "firstName", false],
    ["Philip", "firstName", true],
    ["Filipina", "firstName", true],
    ["Loko", "firstName", false],
    ["Animal", "firstName", false],
    ["pangit", "firstName", false],
    ["De La Cruz", "lastName", true],
    ["O'Brien", "lastName", true],
    ["Juan-Carlos", "firstName", true],
    ["José", "firstName", true],
    ["-Juan", "firstName", false]
  ];

  for (const [value, field, shouldPass] of checks) {
    const result = validateServerName(value, field);
    if (result.ok !== shouldPass) {
      throw new Error(`name validation self-check failed for ${value}`);
    }
  }
}
