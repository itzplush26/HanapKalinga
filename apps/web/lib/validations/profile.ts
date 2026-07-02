import { z } from "zod";
import { isCityInRegion } from "@/lib/data/ph-locations";
import { DAILY_RATE_BAND_IDS, HOURLY_RATE_BAND_IDS } from "@/lib/data/rates";
import { containsProfanity, sanitizeText } from "@/lib/validation/sanitize";
import { firstNameSchema, lastNameSchema, middleNameSchema, patientNameSchema } from "@/lib/validation/name";
import { philippineMobileSchema } from "@/lib/validation/phone";
import {
  isValidPrcLicenseNo,
  isValidTesdaCertificateNo,
  PRC_LICENSE_ERROR,
  TESDA_CERTIFICATE_ERROR
} from "@/lib/validation/prc-license";
import {
  DOB_MIN_AGE,
  getDateOfBirthBounds,
  isValidDateOnly
} from "@/lib/validation/date-of-birth";
import { FAMILY_NAME_SUFFIXES, PROVIDER_NAME_SUFFIXES } from "@/lib/validation/name-suffix";

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
const dateOfBirthBounds = getDateOfBirthBounds();

const dateOfBirthRequiredSchema = z
  .string()
  .trim()
  .min(1, "Date of birth is required.")
  .refine((value) => isValidDateOnly(value), "Date of birth is required.")
  .refine((value) => value <= dateOfBirthBounds.max, {
    message: `You must be at least ${DOB_MIN_AGE} years old to register.`
  })
  .refine((value) => value >= dateOfBirthBounds.min, "Please enter a valid date of birth.");

function validateCityInRegion(
  values: { region?: unknown; city?: unknown },
  context: z.RefinementCtx
) {
  const region = typeof values.region === "string" ? values.region : "";
  const city = typeof values.city === "string" ? values.city : "";
  if (region && city && !isCityInRegion(city, region)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Select a city in the chosen region.",
      path: ["city"]
    });
  }
}

export const familyProfileSchema = z
  .object({
    firstName: firstNameSchema,
    middleName: middleNameSchema,
    lastName: lastNameSchema,
    nameSuffix: z.union([z.literal(""), z.enum(FAMILY_NAME_SUFFIXES)]).optional(),
    phone: philippineMobileSchema.optional(),
    region: z.string().min(2, "Region is required."),
    city: z.string().min(2, "City is required."),
    barangay: requiredText(2, "Barangay is required."),
    address: requiredText(5, "Home address is required."),
    patientName: patientNameSchema
  })
  .superRefine(validateCityInRegion);

export const nurseProfileFieldsSchema = z.object({
  firstName: firstNameSchema,
  middleName: middleNameSchema,
  lastName: lastNameSchema,
  nameSuffix: z.union([z.literal(""), z.enum(PROVIDER_NAME_SUFFIXES)]).optional(),
  dateOfBirth: dateOfBirthRequiredSchema,
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
      const prcNo = typeof values.prcLicenseNo === "string" ? values.prcLicenseNo.trim() : "";
      if (!prcNo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "PRC license number is required.",
          path: ["prcLicenseNo"]
        });
      } else if (!isValidPrcLicenseNo(prcNo)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: PRC_LICENSE_ERROR,
          path: ["prcLicenseNo"]
        });
      }
    }
    const tesdaNo =
      typeof values.tesdaCertificateNo === "string" ? values.tesdaCertificateNo.trim() : "";
    if (values.providerType === "caregiver" && !tesdaNo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "TESDA certificate number is required.",
        path: ["tesdaCertificateNo"]
      });
    } else if (values.providerType === "caregiver" && tesdaNo && !isValidTesdaCertificateNo(tesdaNo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: TESDA_CERTIFICATE_ERROR,
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
    firstName: firstNameSchema,
    middleName: middleNameSchema,
    lastName: lastNameSchema,
    nameSuffix: z.union([z.literal(""), z.enum(PROVIDER_NAME_SUFFIXES)]).optional(),
    dateOfBirth: dateOfBirthRequiredSchema,
    phone: philippineMobileSchema.optional(),
    region: z.string().min(2, "Region is required."),
    city: z.string().min(2, "City is required."),
    barangay: requiredText(2, "Barangay is required."),
    address: optionalText(),
    prcLicenseNo: optionalText(),
    tesdaCertificateNo: optionalText(),
    selectedSpecializations: z.array(z.string()).min(1, "Select at least one specialization."),
    customSpecialization: optionalText(),
    yearsExperience: z.number().min(0, "Years of experience cannot be negative."),
    bio: optionalText(),
    hourlyRateRange: hourlyRateRangeField,
    dailyRateRange: dailyRateRangeField,
    profile_photo_url: z.string().optional(),
    prc_document_url: z.string().optional(),
    tesda_document_url: z.string().optional(),
    nbi_document_url: z.string().optional()
  })
  .superRefine((values, context) => {
    validateCityInRegion(values, context);
    const prcNo = typeof values.prcLicenseNo === "string" ? values.prcLicenseNo.trim() : "";
    if (prcNo && !isValidPrcLicenseNo(prcNo)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: PRC_LICENSE_ERROR,
        path: ["prcLicenseNo"]
      });
    }
    const tesdaNo =
      typeof values.tesdaCertificateNo === "string" ? values.tesdaCertificateNo.trim() : "";
    if (tesdaNo && !isValidTesdaCertificateNo(tesdaNo)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: TESDA_CERTIFICATE_ERROR,
        path: ["tesdaCertificateNo"]
      });
    }
  });

export type NurseProfileEditValues = z.infer<typeof nurseProfileEditSchema>;
