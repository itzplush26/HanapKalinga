import { z } from "zod";
import { isCityInRegion } from "@/lib/data/ph-locations";
import { DAILY_RATE_BAND_IDS, HOURLY_RATE_BAND_IDS } from "@/lib/data/rates";
import { containsProfanity, sanitizeText } from "@/lib/validation/sanitize";
import { philippineMobileSchema } from "@/lib/validation/phone";

const APPROPRIATE_MESSAGE = "Please keep your content appropriate.";

const requiredText = (minLength: number, requiredMessage: string) =>
  z
    .string()
    .transform(sanitizeText)
    .refine((value) => value.length >= minLength, requiredMessage)
    .refine((value) => !containsProfanity(value), APPROPRIATE_MESSAGE);

const optionalText = () =>
  z
    .string()
    .transform(sanitizeText)
    .refine((value) => !value || !containsProfanity(value), APPROPRIATE_MESSAGE)
    .optional();

const hourlyRateRangeField = z.union([z.enum(HOURLY_RATE_BAND_IDS), z.literal("")]);
const dailyRateRangeField = z.union([z.enum(DAILY_RATE_BAND_IDS), z.literal("")]);

function validateCityInRegion(
  values: { region?: string; city?: string },
  context: z.RefinementCtx
) {
  if (values.region && values.city && !isCityInRegion(values.city, values.region)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Select a city in the chosen region.",
      path: ["city"]
    });
  }
}

export const familyProfileSchema = z
  .object({
    firstName: requiredText(1, "First name is required."),
    middleName: optionalText(),
    lastName: requiredText(1, "Last name is required."),
    phone: philippineMobileSchema.optional(),
    region: z.string().min(2, "Region is required."),
    city: z.string().min(2, "City is required."),
    barangay: requiredText(2, "Barangay is required."),
    address: requiredText(5, "Home address is required.")
  })
  .superRefine(validateCityInRegion);

export const nurseProfileFieldsSchema = z.object({
  firstName: requiredText(1, "First name is required."),
  middleName: optionalText(),
  lastName: requiredText(1, "Last name is required."),
  providerType: z.enum(["nurse", "caregiver"]),
  region: z.string().min(2, "Region is required."),
  city: z.string().min(2, "City is required."),
  barangay: requiredText(2, "Barangay is required."),
  bio: optionalText(),
  hourlyRateRange: hourlyRateRangeField,
  dailyRateRange: dailyRateRangeField,
  specializations: z.array(z.string()).min(1, "Select at least one specialization."),
  prcLicenseNo: z.string().optional(),
  tesdaCertificateNo: z.string().optional()
});

export const nurseProfileFormSchema = nurseProfileFieldsSchema
  .superRefine(validateCityInRegion)
  .superRefine((values, ctx) => {
    if (values.providerType === "nurse") {
      const prcNo = values.prcLicenseNo?.trim() ?? "";
      if (!prcNo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "PRC license number is required.",
          path: ["prcLicenseNo"]
        });
      } else if (!/^\d{5,10}$/.test(prcNo)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "PRC license number must be 5–10 digits.",
          path: ["prcLicenseNo"]
        });
      }
    }
    if (values.providerType === "caregiver" && !values.tesdaCertificateNo?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "TESDA certificate number is required.",
        path: ["tesdaCertificateNo"]
      });
    }
  });

export type NurseProfileFormValues = z.infer<typeof nurseProfileFormSchema>;

export const nurseProfileSchema = nurseProfileFieldsSchema
  .extend({
    prcDocumentUrl: z.string().min(1).optional(),
    tesdaDocumentUrl: z.string().min(1).optional(),
    nbiDocumentUrl: z.string().min(1, "NBI clearance is required.")
  })
  .superRefine((values, context) => {
    validateCityInRegion(values, context);
    if (values.providerType === "nurse" && !values.prcDocumentUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PRC license is required for nurses.",
        path: ["prcDocumentUrl"]
      });
    }
    if (values.providerType === "caregiver" && !values.tesdaDocumentUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "TESDA NC II certificate is required for caregivers.",
        path: ["tesdaDocumentUrl"]
      });
    }
  });

export const nurseProfileEditSchema = z
  .object({
    firstName: requiredText(1, "First name is required."),
    middleName: optionalText(),
    lastName: requiredText(1, "Last name is required."),
    phone: philippineMobileSchema.optional(),
    region: z.string().min(2, "Region is required."),
    city: z.string().min(2, "City is required."),
    barangay: requiredText(2, "Barangay is required."),
    address: optionalText(),
    prcLicenseNo: optionalText(),
    tesdaCertificateNo: optionalText(),
    specializations: requiredText(1, "Enter at least one specialization."),
    yearsExperience: z.number().min(0, "Years of experience cannot be negative."),
    bio: optionalText(),
    hourlyRateRange: hourlyRateRangeField,
    dailyRateRange: dailyRateRangeField,
    profile_photo_url: z.string().optional(),
    prc_document_url: z.string().optional(),
    tesda_document_url: z.string().optional(),
    nbi_document_url: z.string().optional()
  })
  .superRefine(validateCityInRegion);

export type NurseProfileEditValues = z.infer<typeof nurseProfileEditSchema>;
