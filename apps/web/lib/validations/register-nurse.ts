import { z } from "zod";
import { isCityInRegion } from "@/lib/data/ph-locations";
import { nurseProfileFieldsSchema } from "@/lib/validations/profile";

export const completeNurseRegistrationSchema = nurseProfileFieldsSchema
  .extend({
    prcDocumentPath: z.string().optional(),
    tesdaDocumentPath: z.string().optional(),
    nbiDocumentPath: z.string().min(1, "NBI clearance is required.")
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
  });

export type CompleteNurseRegistrationValues = z.infer<typeof completeNurseRegistrationSchema>;
