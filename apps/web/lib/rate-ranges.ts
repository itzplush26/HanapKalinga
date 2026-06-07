export const RATE_RANGE_IDS = [
  "500-1000",
  "1000-1500",
  "1500-2000",
  "2000-3000",
  "3000-plus"
] as const;

export type RateRangeId = (typeof RATE_RANGE_IDS)[number];

export interface RateRangeOption {
  id: RateRangeId;
  label: string;
  min: number;
  max: number | null;
}

export const RATE_RANGE_OPTIONS: RateRangeOption[] = [
  { id: "500-1000", label: "₱500 – ₱1,000", min: 500, max: 1000 },
  { id: "1000-1500", label: "₱1,000 – ₱1,500", min: 1000, max: 1500 },
  { id: "1500-2000", label: "₱1,500 – ₱2,000", min: 1500, max: 2000 },
  { id: "2000-3000", label: "₱2,000 – ₱3,000", min: 2000, max: 3000 },
  { id: "3000-plus", label: "₱3,000+", min: 3000, max: null }
];

export function getRateRangeOption(id: string | null | undefined): RateRangeOption | undefined {
  if (!id) return undefined;
  return RATE_RANGE_OPTIONS.find((option) => option.id === id);
}

export function resolveRateRangeValues(id: RateRangeId | null | undefined): {
  min: number | null;
  max: number | null;
} {
  const option = getRateRangeOption(id ?? undefined);
  if (!option) return { min: null, max: null };
  return { min: option.min, max: option.max };
}

export function formatRateRangeDisplay(
  rangeId: string | null | undefined,
  min: number | null | undefined,
  max: number | null | undefined
): string | null {
  const option = getRateRangeOption(rangeId ?? undefined);
  if (option) return option.label;

  if (min == null) return null;
  if (max != null && max !== min) {
    return `₱${min.toLocaleString("en-PH")} – ₱${max.toLocaleString("en-PH")}`;
  }
  return `₱${min.toLocaleString("en-PH")}+`;
}

export function inferRateRangeId(
  min: number | null | undefined,
  max: number | null | undefined,
  storedRangeId: string | null | undefined
): RateRangeId | "" {
  if (storedRangeId && getRateRangeOption(storedRangeId)) {
    return storedRangeId as RateRangeId;
  }
  if (min == null) return "";

  const match = RATE_RANGE_OPTIONS.find((option) => {
    if (option.min !== min) return false;
    if (option.max == null) return max == null || max >= option.min;
    return option.max === max;
  });

  return match?.id ?? "";
}
