export const YEARS_EXPERIENCE_OPTIONS = [
  { value: 0, label: "Less than 1 year" },
  { value: 1, label: "1 year" },
  { value: 2, label: "2 years" },
  { value: 3, label: "3 years" },
  { value: 4, label: "4 years" },
  { value: 5, label: "5 years" },
  { value: 7, label: "6-10 years" },
  { value: 11, label: "10+ years" }
] as const;

export function yearsExperienceLabel(value: number | null | undefined): string {
  const match = YEARS_EXPERIENCE_OPTIONS.find((option) => option.value === value);
  if (match) return match.label;
  if (value == null || value < 1) return "Less than 1 year";
  if (value >= 10) return "10+ years";
  if (value >= 6) return "6-10 years";
  return `${value} year${value === 1 ? "" : "s"}`;
}
