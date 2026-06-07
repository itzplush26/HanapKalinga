import { z } from "zod";

export const availabilitySchema = z.object({
  date: z.string(),
  shift: z.enum(["morning", "afternoon", "evening", "full_day"]),
  isOpen: z.boolean()
});
