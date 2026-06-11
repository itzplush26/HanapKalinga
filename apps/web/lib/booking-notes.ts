import { getDailyRateBand } from "@/lib/data/rates";

export type ParsedBookingNotes = {
  patientCondition?: string;
  requiredSkills?: string[];
  budgetRange?: string;
  additionalInstructions?: string;
  customStartTime?: string;
  customEndTime?: string;
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
      patientCondition: typeof raw.patientCondition === "string" ? raw.patientCondition : undefined,
      requiredSkills: skills?.filter((s): s is string => typeof s === "string"),
      budgetRange: budget,
      additionalInstructions: extra,
      customStartTime: typeof raw.customStartTime === "string" ? raw.customStartTime : undefined,
      customEndTime: typeof raw.customEndTime === "string" ? raw.customEndTime : undefined
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
  const band = getDailyRateBand(value);
  if (band) return band.label;
  return value.replace(/_/g, "-");
}

export const SHIFT_LABELS: Record<string, string> = {
  morning: "Morning (6am–2pm)",
  afternoon: "Afternoon (2pm–10pm)",
  evening: "Evening (10pm–6am)",
  full_day: "Full day (24hr)",
  custom: "Custom time"
};

export function formatShiftLabel(shift: string, notes: string | null | undefined) {
  if (shift !== "custom") {
    return SHIFT_LABELS[shift] ?? shift;
  }
  const parsed = parseBookingNotes(notes);
  if (parsed?.customStartTime && parsed?.customEndTime) {
    return `Custom: ${parsed.customStartTime} – ${parsed.customEndTime}`;
  }
  return SHIFT_LABELS.custom;
}
