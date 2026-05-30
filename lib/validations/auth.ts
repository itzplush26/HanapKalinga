import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email(),
  token: z.string().length(6).optional()
});

export const roleSchema = z.object({
  role: z.enum(["family", "nurse"]) 
});
