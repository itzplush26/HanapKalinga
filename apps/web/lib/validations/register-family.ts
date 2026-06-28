import { z } from "zod";
import { familyProfileSchema } from "@/lib/validations/profile";

export const completeFamilyRegistrationSchema = familyProfileSchema.and(
  z.object({
    termsAcceptedAt: z.string().datetime().optional()
  })
);

export type CompleteFamilyRegistrationValues = z.infer<typeof completeFamilyRegistrationSchema>;
