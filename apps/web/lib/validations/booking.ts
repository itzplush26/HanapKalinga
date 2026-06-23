import { z } from "zod";
import { DAILY_RATE_BAND_IDS } from "@/lib/data/rates";
import { containsProfanity, sanitizeText } from "@/lib/validation/sanitize";

export const bookingRequestSchema = z
  .object({
    nurseId: z.string().uuid(),
    requestedDate: z.string().optional().default(""),
    shift: z.union([z.enum(["morning", "afternoon", "evening", "full_day", "custom"]), z.literal("")]),
    customStartTime: z.string().optional(),
    customEndTime: z.string().optional(),
    patientCondition: z.union([z.enum(["bedridden", "mobile", "assisted"]), z.literal("")]),
    requiredSkills: z.array(z.string()).default([]),
    customSkills: z.array(z.string()).max(10, "You can add up to 10 custom skills only.").default([]),
    budgetRange: z.enum(DAILY_RATE_BAND_IDS),
    additionalInstructions: z
      .string()
      .transform(sanitizeText)
      .refine((value) => !value || !containsProfanity(value), "Please keep your content appropriate.")
      .pipe(z.string().max(1200))
      .optional()
  })
  .superRefine((values, context) => {
    if (!values.requestedDate?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a date for the booking.",
        path: ["requestedDate"]
      });
    }

    if (!values.shift) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a shift or enter a custom time.",
        path: ["shift"]
      });
    }

    if (!values.patientCondition) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please describe the patient's condition.",
        path: ["patientCondition"]
      });
    }

    const totalSkills = (values.requiredSkills?.length ?? 0) + (values.customSkills?.length ?? 0);
    if (totalSkills < 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select or enter at least one required skill.",
        path: ["requiredSkills"]
      });
    }

    if (values.shift === "custom") {
      if (!values.customStartTime) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start time is required for custom shifts.",
          path: ["customStartTime"]
        });
      }
      if (!values.customEndTime) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End time is required for custom shifts.",
          path: ["customEndTime"]
        });
      }
    }
  });
