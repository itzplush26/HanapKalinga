import { z } from "zod";

export const familyProfileSchema = z.object({
  firstName: z.string().min(2),
  middleName: z.string().optional(),
  lastName: z.string().min(2),
  phone: z.string().min(8),
  region: z.string().min(2),
  city: z.string().min(2),
  barangay: z.string().min(2),
  address: z.string().min(5),
  patientName: z.string().min(2),
  patientAge: z.number().int().min(0),
  patientCondition: z.string().min(2)
});

export const nurseProfileSchema = z.object({
  firstName: z.string().min(2),
  middleName: z.string().optional(),
  lastName: z.string().min(2),
  phone: z.string().min(8),
  region: z.string().min(2),
  city: z.string().min(2),
  barangay: z.string().min(2),
  address: z.string().min(5),
  prcLicenseNo: z.string().min(5),
  specializations: z.array(z.string()).min(1),
  yearsExperience: z.number().int().min(0),
  bio: z.string().min(20),
  hourlyRate: z.number().min(0),
  dailyRate12hr: z.number().min(0),
  profilePhotoUrl: z.string().url().optional(),
  nbiDocumentUrl: z.string().url().optional()
});
