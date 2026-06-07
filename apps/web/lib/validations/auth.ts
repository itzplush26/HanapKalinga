import { z } from "zod";

export const signupOtpSchema = z.object({
  email: z.string().email(),
  token: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().length(6).optional()
  )
});

/** @deprecated Use signupOtpSchema for registration OTP steps */
export const authSchema = signupOtpSchema;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required")
});

export const passwordSetupSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

export const resetPasswordRequestSchema = z.object({
  email: z.string().email()
});

export const roleSchema = z.object({
  role: z.enum(["family", "nurse"])
});
