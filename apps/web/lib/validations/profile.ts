import { z } from "zod";
import { isCityInRegion } from "@/lib/data/ph-locations";
import { DAILY_RATE_BAND_IDS, HOURLY_RATE_BAND_IDS } from "@/lib/data/rates";

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
    firstName: z.string().min(1, "First name is required."),
    middleName: z.string().optional(),
    lastName: z.string().min(1, "Last name is required."),
    phone: z.string().min(10, "Enter a valid phone number.").optional().or(z.literal("")),
    region: z.string().min(2, "Region is required."),
    city: z.string().min(2, "City is required."),
    barangay: z.string().min(2, "Barangay is required."),
    address: z.string().min(5, "Home address is required.")
  })
  .superRefine(validateCityInRegion);

const nurseProfileFieldsSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required."),
  providerType: z.enum(["nurse", "caregiver"]),
  region: z.string().min(2, "Region is required."),
  city: z.string().min(2, "City is required."),
  barangay: z.string().min(2, "Barangay is required."),
  bio: z.string().optional(),
  hourlyRateRange: hourlyRateRangeField,
  dailyRateRange: dailyRateRangeField,
  specializations: z.array(z.string()).min(1, "Select at least one specialization.")
});

export const nurseProfileFormSchema = nurseProfileFieldsSchema.superRefine(validateCityInRegion);

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
    firstName: z.string().min(1, "First name is required."),
    middleName: z.string().optional(),
    lastName: z.string().min(1, "Last name is required."),
    phone: z.string().min(10, "Enter a valid phone number.").optional().or(z.literal("")),
    region: z.string().min(2, "Region is required."),
    city: z.string().min(2, "City is required."),
    barangay: z.string().min(2, "Barangay is required."),
    address: z.string().optional(),
    prcLicenseNo: z.string().optional(),
    specializations: z.string().min(1, "Enter at least one specialization."),
    yearsExperience: z.number().min(0, "Years of experience cannot be negative."),
    bio: z.string().optional(),
    hourlyRateRange: hourlyRateRangeField,
    dailyRateRange: dailyRateRangeField,
    profile_photo_url: z.string().optional(),
    prc_document_url: z.string().optional(),
    tesda_document_url: z.string().optional(),
    nbi_document_url: z.string().optional()
  })
  .superRefine(validateCityInRegion);

export type NurseProfileEditValues = z.infer<typeof nurseProfileEditSchema>;
