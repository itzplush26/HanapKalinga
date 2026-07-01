export const APP_NAME = "HanapKalinga";

export const SUPPORT_EMAIL = "support@hanapkalinga.com";

export const PROVIDER_SPECIALIZATIONS = [
  "Elderly Care",
  "Post-Op Care",
  "Pediatric Care",
  "Stroke Rehabilitation",
  "Palliative Care",
  "Dementia Care",
  "Newborn Care",
  "ICU Home Care",
  "Special Needs Care",
  "Bedridden Patient Care"
] as const;

/** Maximum upload size for verification documents (5 MB). */
export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;

export const MAX_DOCUMENT_SIZE_LABEL = "5 MB";

/** Maximum upload size for profile photos before compression (8 MB). */
export const MAX_PROFILE_PHOTO_SIZE_BYTES = 8 * 1024 * 1024;

export const BOOKING_SKILLS = [
  "IV Therapy",
  "Wound Care",
  "Medication Management",
  "Post-Op Care",
  "Mobility Assistance",
  "Palliative Care"
] as const;
