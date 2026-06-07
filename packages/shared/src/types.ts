// Shared type definitions
export type UserRole = "family" | "nurse" | "admin";

export type VerificationStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "rejected"
  | "resubmission_required";

export type BookingStatus = "pending" | "accepted" | "declined" | "completed" | "cancelled";

export type Shift = "morning" | "afternoon" | "evening" | "full_day";

export type ProviderType = "nurse" | "caregiver";

export type PatientCondition = "bedridden" | "mobile" | "assisted";

export type BudgetRange = "under_1000" | "1000_2000" | "2000_3500" | "3500_plus";

// Database types
export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  phone: string | null;
  region: string | null;
  city: string | null;
  barangay: string | null;
  address: string | null;
  created_at: string;
}

export interface Nurse {
  id: string;
  prc_license_no: string | null;
  prc_document_url: string | null;
  nbi_document_url: string | null;
  specializations: string[] | null;
  years_experience: number | null;
  bio: string | null;
  hourly_rate: number | null;
  hourly_rate_max: number | null;
  hourly_rate_range: string | null;
  daily_rate_12hr: number | null;
  daily_rate_12hr_max: number | null;
  daily_rate_range: string | null;
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  verified_at: string | null;
}

export interface Family {
  id: string;
  patient_name: string | null;
  patient_age: number | null;
  patient_condition: string | null;
  address: string | null;
}

export interface Booking {
  id: string;
  family_id: string;
  nurse_id: string;
  requested_date: string | null;
  shift: Shift | null;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
}

export interface Availability {
  id: string;
  nurse_id: string;
  date: string;
  shift: Shift;
  is_open: boolean;
}

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}
