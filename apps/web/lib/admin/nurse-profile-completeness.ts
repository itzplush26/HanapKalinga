export interface NurseProfileCompletenessInput {
  bio: string | null;
  specializations: string[] | null;
  daily_rate_range: string | null;
  hourly_rate_range: string | null;
  profile_photo_url: string | null;
  profiles?: {
    city: string | null;
    region: string | null;
    profile_photo_url?: string | null;
  } | null;
}

export interface ProfileCompletenessField {
  key: string;
  label: string;
  complete: boolean;
}

export function getProfileCompletenessFields(
  nurse: NurseProfileCompletenessInput
): ProfileCompletenessField[] {
  const profile = nurse.profiles;
  const photo = nurse.profile_photo_url ?? profile?.profile_photo_url ?? null;

  return [
    { key: "bio", label: "Bio", complete: Boolean(nurse.bio?.trim()) },
    {
      key: "specializations",
      label: "Specializations",
      complete: (nurse.specializations?.length ?? 0) > 0
    },
    {
      key: "daily_rate",
      label: "Daily rate",
      complete: Boolean(nurse.daily_rate_range?.trim())
    },
    {
      key: "hourly_rate",
      label: "Hourly rate",
      complete: Boolean(nurse.hourly_rate_range?.trim())
    },
    { key: "photo", label: "Profile photo", complete: Boolean(photo?.trim()) },
    {
      key: "location",
      label: "City and region",
      complete: Boolean(profile?.city?.trim() && profile?.region?.trim())
    }
  ];
}

export function isProfileComplete(nurse: NurseProfileCompletenessInput): boolean {
  return getProfileCompletenessFields(nurse).every((field) => field.complete);
}
