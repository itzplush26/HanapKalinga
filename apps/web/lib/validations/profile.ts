import { z } from "zod";

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

export const nurseProfileFormSchema = z.object({
  fullName: z.string().min(2),
  providerType: z.enum(["nurse", "caregiver"]),
  city: z.string().min(2),
  barangay: z.string().min(2),
  bio: z.string().optional(),
  hourlyRate: z.number().min(0).optional(),
  dailyRate12hr: z.number().min(0).optional(),
  specializations: z.array(z.string()).min(1, "Select at least one specialization.")
});

export type NurseProfileFormValues = z.infer<typeof nurseProfileFormSchema>;

export const nurseProfileSchema = nurseProfileFormSchema
  .extend({
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
