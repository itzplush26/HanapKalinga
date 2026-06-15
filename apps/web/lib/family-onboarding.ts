export type FamilyTooltipKey = "browse" | "booking" | "messages";

export type FamilyTooltipsDismissed = Record<FamilyTooltipKey, boolean>;

export interface FamilyOnboardingRecord {
  has_browsed: boolean;
  checklist_dismissed: boolean;
  welcome_seen: boolean;
  tooltips_dismissed: FamilyTooltipsDismissed | null;
}

export interface FamilyChecklistProfile {
  region: string | null;
  city: string | null;
  address: string | null;
}

export interface FamilyChecklistBookings {
  hasAnyBooking: boolean;
  hasConfirmedBooking: boolean;
}

const DEFAULT_TOOLTIPS: FamilyTooltipsDismissed = {
  browse: false,
  booking: false,
  messages: false
};

export function parseTooltipsDismissed(value: unknown): FamilyTooltipsDismissed {
  if (!value || typeof value !== "object") return { ...DEFAULT_TOOLTIPS };
  const record = value as Partial<FamilyTooltipsDismissed>;
  return {
    browse: Boolean(record.browse),
    booking: Boolean(record.booking),
    messages: Boolean(record.messages)
  };
}

export function isFamilyProfileComplete(profile: FamilyChecklistProfile): boolean {
  return Boolean(
    profile.region?.trim() && profile.city?.trim() && profile.address?.trim()
  );
}

export interface FamilyChecklistItem {
  id: string;
  label: string;
  description: string;
  complete: boolean;
  href?: string;
  ctaLabel?: string;
}

export function buildFamilyChecklistItems(
  profile: FamilyChecklistProfile,
  family: Pick<FamilyOnboardingRecord, "has_browsed">,
  bookings: FamilyChecklistBookings
): FamilyChecklistItem[] {
  const profileComplete = isFamilyProfileComplete(profile);

  return [
    {
      id: "profile",
      label: "Complete your profile",
      description: "Add your region and home address so nurses know your area.",
      complete: profileComplete,
      href: "/dashboard/family/profile",
      ctaLabel: "Complete profile"
    },
    {
      id: "browse",
      label: "Browse nurses and caregivers",
      description: "Find verified professionals near you.",
      complete: family.has_browsed,
      href: "/nurses",
      ctaLabel: "Start browsing"
    },
    {
      id: "booking",
      label: "Send a booking request",
      description: "Found someone? Send them a request to get started.",
      complete: bookings.hasAnyBooking,
      href: "/nurses",
      ctaLabel: "Find someone"
    },
    {
      id: "confirmation",
      label: "Wait for confirmation",
      description: "The nurse or caregiver will accept or decline your request.",
      complete: bookings.hasConfirmedBooking
    }
  ];
}

export function isFamilyChecklistComplete(items: FamilyChecklistItem[]): boolean {
  return items.every((item) => item.complete);
}
