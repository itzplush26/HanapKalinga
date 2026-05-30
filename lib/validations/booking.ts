import { z } from "zod";

export const bookingRequestSchema = z.object({
  nurseId: z.string().uuid(),
  requestedDate: z.string(),
  shift: z.enum(["morning", "afternoon", "evening", "full_day"]),
  notes: z.string().max(500).optional()
});
