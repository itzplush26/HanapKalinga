import { z } from "zod";
import { DAILY_RATE_BAND_IDS } from "@/lib/data/rates";
import { containsProfanity, sanitizeText } from "@/lib/validation/sanitize";

export const bookingRequestSchema = z
  .object({
    nurseId: z.string().uuid(),
    requestedDate: z.string().min(1, "Select a date."),
    shift: z.enum(["morning", "afternoon", "evening", "full_day", "custom"]),
    customStartTime: z.string().optional(),
    customEndTime: z.string().optional(),
    patientCondition: z.enum(["bedridden", "mobile", "assisted"]),
    requiredSkills: z.array(z.string()).min(1),
    budgetRange: z.enum(DAILY_RATE_BAND_IDS),
    additionalInstructions: z
      .string()
      .transform(sanitizeText)
      .refine((value) => !value || !containsProfanity(value), "Please keep your content appropriate.")
      .pipe(z.string().max(1200))
      .optional()
  })
  .superRefine((values, context) => {
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
