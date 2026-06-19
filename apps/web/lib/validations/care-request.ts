import { z } from "zod";
import { PROVIDER_SPECIALIZATIONS } from "@/lib/constants";
import { isCityInRegion } from "@/lib/data/ph-locations";
import { DAILY_RATE_BAND_IDS } from "@/lib/data/rates";
import { containsProfanity, sanitizeText } from "@/lib/validation/sanitize";

const APPROPRIATE_MESSAGE = "Please keep your content appropriate.";

const cleanText = (value: string) => sanitizeText(value);

export const careRequestSchema = z
  .object({
    title: z
      .string()
      .transform(cleanText)
      .refine((value) => value.length >= 5, "Title must be at least 5 characters.")
      .refine((value) => !containsProfanity(value), APPROPRIATE_MESSAGE),
    patientCondition: z
      .string()
      .transform(cleanText)
      .refine((value) => value.length >= 5, "Describe the patient's condition (at least 5 characters).")
      .refine((value) => !containsProfanity(value), APPROPRIATE_MESSAGE),
    careType: z.enum(["full_time", "part_time", "live_in", "per_shift"]),
    requiredSpecializations: z
      .array(z.string())
      .min(1, "Select at least one care category.")
      .refine(
        (items) => items.every((item) => PROVIDER_SPECIALIZATIONS.includes(item as (typeof PROVIDER_SPECIALIZATIONS)[number])),
        "Invalid care category selected."
      ),
    preferredProviderType: z.enum(["nurse", "caregiver", "both"]).default("both"),
    region: z.string().min(2, "Region is required."),
    city: z.string().min(2, "City is required."),
    barangay: z
      .string()
      .transform(cleanText)
      .refine((value) => value.length >= 2, "Barangay is required.")
      .refine((value) => !containsProfanity(value), APPROPRIATE_MESSAGE),
    budgetBand: z
      .union([z.enum(DAILY_RATE_BAND_IDS), z.literal("")])
      .refine((value) => value !== "", { message: "Select a budget band." }),
    durationDescription: z
      .string()
      .transform(cleanText)
      .refine((value) => value.length >= 3, "Duration is required (e.g. 3 months or ongoing).")
      .refine((value) => !containsProfanity(value), APPROPRIATE_MESSAGE),
    shiftPreference: z.string().optional(),
    startDate: z.string().optional()
  })
  .superRefine((values, context) => {
    if (values.region && values.city && !isCityInRegion(values.city, values.region)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a city in the chosen region.",
        path: ["city"]
      });
    }
  });

export type CareRequestFormValues = z.input<typeof careRequestSchema>;
export type CareRequestPayload = z.output<typeof careRequestSchema>;
