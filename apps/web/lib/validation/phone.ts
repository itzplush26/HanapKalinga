import { z } from "zod";

export const PHONE_ERROR_MESSAGE =
  "Please enter a valid Philippine mobile number starting with 09 followed by 9 more digits.";

export function normalizePhoneNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

export const philippineMobileSchema = z
  .string()
  .transform((value) => normalizePhoneNumber(value))
  .refine((value) => value === "" || /^09\d{9}$/.test(value), {
    message: PHONE_ERROR_MESSAGE
  });
