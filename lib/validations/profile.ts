import { z } from "zod";

export const familyProfileSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  city: z.string().min(2),
  barangay: z.string().min(2),
  patientName: z.string().min(2),
  patientAge: z.number().int().min(0),
  patientCondition: z.string().min(2),
  address: z.string().min(5)
});

export const nurseProfileSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  city: z.string().min(2),
  barangay: z.string().min(2),
  specializations: z.array(z.string()).min(1),
  yearsExperience: z.number().int().min(0),
  bio: z.string().min(20),
  hourlyRate: z.number().min(0),
  dailyRate12hr: z.number().min(0)
});
