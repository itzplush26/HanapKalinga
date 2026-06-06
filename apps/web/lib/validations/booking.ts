import { z } from "zod";

export const bookingRequestSchema = z.object({
  nurseId: z.string().uuid(),
  requestedDate: z.string(),
  shift: z.enum(["morning", "afternoon", "evening", "full_day"]),
  patientCondition: z.enum(["bedridden", "mobile", "assisted"]),
  requiredSkills: z.array(z.string()).min(1),
  budgetRange: z.enum(["under_1000", "1000_2000", "2000_3500", "3500_plus"]),
  additionalInstructions: z.string().max(1200).optional()
});
