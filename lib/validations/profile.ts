import { z } from "zod";

export const familyProfileSchema = z.object({
  fullName: z.string().min(2),
  city: z.string().min(2),
  barangay: z.string().min(2),
  contactPersonName: z.string().min(2),
  relationshipToPatient: z.string().min(2),
  patientName: z.string().min(2),
  patientAge: z.number().int().min(0),
  careNeeded: z.string().optional()
});

export const nurseProfileSchema = z
  .object({
    fullName: z.string().min(2),
    providerType: z.enum(["nurse", "caregiver"]),
    city: z.string().min(2),
    barangay: z.string().min(2),
    bio: z.string().optional(),
    hourlyRate: z.number().min(0).optional(),
    dailyRate12hr: z.number().min(0).optional(),
    prcDocumentUrl: z.string().url().optional(),
    tesdaDocumentUrl: z.string().url().optional(),
    nbiDocumentUrl: z.string().url()
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
