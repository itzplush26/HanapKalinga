import { z } from "zod";

export const RATE_RANGE_IDS = [
  "500-1000",
  "1000-1500",
  "1500-2000",
  "2000-3000",
  "3000-plus"
] as const;

const rateRangeField = z.enum(RATE_RANGE_IDS).optional().or(z.literal(""));

export const familyProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required."),
  phone: z.string().min(10, "Enter a valid phone number.").optional().or(z.literal("")),
  region: z.string().min(2, "Region is required."),
  city: z.string().min(2, "City is required."),
  barangay: z.string().min(2, "Barangay is required."),
  address: z.string().min(5, "Home address is required.")
});

export const nurseProfileSchema = z
  .object({
    firstName: z.string().min(1, "First name is required."),
    middleName: z.string().optional(),
    lastName: z.string().min(1, "Last name is required."),
    providerType: z.enum(["nurse", "caregiver"]),
    region: z.string().min(2, "Region is required."),
    city: z.string().min(2, "City is required."),
    barangay: z.string().min(2, "Barangay is required."),
    bio: z.string().optional(),
    hourlyRateRange: rateRangeField,
    dailyRateRange: rateRangeField,
    specializations: z.array(z.string()).min(1, "Select at least one specialization."),
    prcDocumentUrl: z.string().min(1).optional(),
    tesdaDocumentUrl: z.string().min(1).optional(),
    nbiDocumentUrl: z.string().min(1, "NBI clearance is required.")
  })
  .superRefine((values, context) => {
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
