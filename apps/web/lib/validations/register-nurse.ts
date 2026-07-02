import { z } from "zod";
import { isCityInRegion } from "@/lib/data/ph-locations";
import { nurseProfileFieldsSchema } from "@/lib/validations/profile";
import { containsProfanity } from "@/lib/validation/sanitize";
import {
  isValidPrcLicenseNo,
  isValidTesdaCertificateNo,
  PRC_LICENSE_ERROR,
  TESDA_CERTIFICATE_ERROR
} from "@/lib/validation/prc-license";
import { PROVIDER_NAME_SUFFIXES } from "@/lib/validation/name-suffix";

export const completeNurseRegistrationSchema = nurseProfileFieldsSchema
  .extend({
    prcDocumentPath: z.string().optional(),
    tesdaDocumentPath: z.string().optional(),
    nbiDocumentPath: z.string().min(1, "NBI clearance is required."),
    termsAcceptedAt: z.string().datetime().optional(),
    nameSuffix: z.union([z.literal(""), z.enum(PROVIDER_NAME_SUFFIXES)]).optional()
  })
  .superRefine((values, ctx) => {
    const region = typeof values.region === "string" ? values.region : "";
    const city = typeof values.city === "string" ? values.city : "";
    if (region && city && !isCityInRegion(city, region)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a city in the chosen region.",
        path: ["city"]
      });
    }

    const prcDocumentPath =
      typeof values.prcDocumentPath === "string" ? values.prcDocumentPath.trim() : "";
    const tesdaDocumentPath =
      typeof values.tesdaDocumentPath === "string" ? values.tesdaDocumentPath.trim() : "";
    const hasPrc = Boolean(prcDocumentPath);
    const hasTesda = Boolean(tesdaDocumentPath);

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
      const tesdaNo =
        typeof values.tesdaCertificateNo === "string" ? values.tesdaCertificateNo.trim() : "";
      if (!tesdaNo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "TESDA certificate number is required.",
          path: ["tesdaCertificateNo"]
        });
      } else if (!isValidTesdaCertificateNo(tesdaNo)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: TESDA_CERTIFICATE_ERROR,
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
