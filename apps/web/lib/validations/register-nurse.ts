import { z } from "zod";
import { isCityInRegion } from "@/lib/data/ph-locations";
import { nurseProfileFieldsSchema } from "@/lib/validations/profile";
import { containsProfanity } from "@/lib/validation/sanitize";

export const completeNurseRegistrationSchema = nurseProfileFieldsSchema
  .extend({
    prcDocumentPath: z.string().optional(),
    tesdaDocumentPath: z.string().optional(),
    nbiDocumentPath: z.string().min(1, "NBI clearance is required."),
    termsAcceptedAt: z.string().datetime().optional()
  })
  .superRefine((values, ctx) => {
    if (values.region && values.city && !isCityInRegion(values.city, values.region)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a city in the chosen region.",
        path: ["city"]
      });
    }

    const hasPrc = Boolean(values.prcDocumentPath?.trim());
    const hasTesda = Boolean(values.tesdaDocumentPath?.trim());

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
      if (!hasPrc) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "PRC license is required.",
          path: ["prcDocumentPath"]
        });
      }
      if (hasTesda) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Caregiver documents are not allowed for nurse accounts.",
          path: ["tesdaDocumentPath"]
        });
      }
    }

    if (values.providerType === "caregiver") {
      if (!values.tesdaCertificateNo?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "TESDA certificate number is required.",
          path: ["tesdaCertificateNo"]
        });
      }
      if (!hasTesda) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "TESDA NC II certificate is required.",
          path: ["tesdaDocumentPath"]
        });
      }
      if (hasPrc) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "PRC documents are not allowed for caregiver accounts.",
          path: ["prcDocumentPath"]
        });
      }
    }

    if (containsProfanity(values.firstName)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please keep your content appropriate.",
        path: ["firstName"]
      });
    }
    if (values.middleName && containsProfanity(values.middleName)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please keep your content appropriate.",
        path: ["middleName"]
      });
    }
    if (containsProfanity(values.lastName)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please keep your content appropriate.",
        path: ["lastName"]
      });
    }
    if (containsProfanity(values.barangay)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please keep your content appropriate.",
        path: ["barangay"]
      });
    }
    if (values.bio && containsProfanity(values.bio)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please keep your content appropriate.",
        path: ["bio"]
      });
    }
  });

export type CompleteNurseRegistrationValues = z.infer<typeof completeNurseRegistrationSchema>;
