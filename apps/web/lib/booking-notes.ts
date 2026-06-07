export type ParsedBookingNotes = {
  patientCondition?: string;
  requiredSkills?: string[];
  budgetRange?: string;
  additionalInstructions?: string;
};

const BUDGET_LABELS: Record<string, string> = {
  under_1000: "Under PHP 1,000 / day",
  "1000_2000": "PHP 1,000 – 2,000 / day",
  "2000_3500": "PHP 2,000 – 3,500 / day",
  "3500_plus": "PHP 3,500+ / day"
};

const CONDITION_LABELS: Record<string, string> = {
  bedridden: "Bedridden",
  mobile: "Mobile",
  assisted: "Needs assistance"
};

export function parseBookingNotes(notes: string | null | undefined): ParsedBookingNotes | null {
  if (!notes?.trim()) return null;
  try {
    const raw = JSON.parse(notes) as Record<string, unknown>;
    const skills =
      (Array.isArray(raw.requiredSkills) ? raw.requiredSkills : null) ??
      (Array.isArray(raw.skills) ? raw.skills : null);
    const budget =
      typeof raw.budgetRange === "string"
        ? raw.budgetRange
        : typeof raw.budgetBand === "string"
          ? raw.budgetBand
          : undefined;
    const extra =
      typeof raw.additionalInstructions === "string"
        ? raw.additionalInstructions
        : typeof raw.notes === "string"
          ? raw.notes
          : undefined;

    return {
      patientCondition:
        typeof raw.patientCondition === "string" ? raw.patientCondition : undefined,
      requiredSkills: skills?.filter((s): s is string => typeof s === "string"),
      budgetRange: budget,
      additionalInstructions: extra
    };
  } catch {
    return { additionalInstructions: notes };
  }
}

export function formatPatientCondition(value?: string) {
  if (!value) return null;
  return CONDITION_LABELS[value] ?? value;
}

export function formatBudgetRange(value?: string) {
  if (!value) return null;
  return BUDGET_LABELS[value] ?? value;
}

export const SHIFT_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Night",
  full_day: "24-hour"
};
