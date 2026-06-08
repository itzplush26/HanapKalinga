export const DAILY_RATE_BAND_IDS = [
  "under_1500",
  "1500_2500",
  "2500_4000",
  "4000_6000",
  "above_6000",
  "open_to_discuss"
] as const;

export type DailyRateBandId = (typeof DAILY_RATE_BAND_IDS)[number];

export interface DailyRateBand {
  id: DailyRateBandId;
  label: string;
  min: number | null;
  max: number | null;
}

export const DAILY_RATE_BANDS: DailyRateBand[] = [
  { id: "under_1500", label: "Under ₱1,500", min: 0, max: 1499 },
  { id: "1500_2500", label: "₱1,500 – ₱2,500", min: 1500, max: 2500 },
  { id: "2500_4000", label: "₱2,500 – ₱4,000", min: 2500, max: 4000 },
  { id: "4000_6000", label: "₱4,000 – ₱6,000", min: 4000, max: 6000 },
  { id: "above_6000", label: "Above ₱6,000", min: 6000, max: null },
  { id: "open_to_discuss", label: "Open to discuss", min: null, max: null }
];

export function getDailyRateBand(id: string | null | undefined): DailyRateBand | undefined {
  if (!id) return undefined;
  return DAILY_RATE_BANDS.find((band) => band.id === id);
}

export function formatDailyRateBandLabel(
  bandId: string | null | undefined,
  min: number | null | undefined,
  max: number | null | undefined
): string | null {
  const band = getDailyRateBand(bandId ?? undefined);
  if (band) return band.label;
  if (min == null) return null;
  if (max != null && max !== min) {
    return `₱${min.toLocaleString("en-PH")} – ₱${max.toLocaleString("en-PH")}`;
  }
  return `₱${min.toLocaleString("en-PH")}+`;
}

export function resolveDailyRateBandValues(id: DailyRateBandId | null | undefined): {
  min: number | null;
  max: number | null;
} {
  const band = getDailyRateBand(id ?? undefined);
  if (!band) return { min: null, max: null };
  return { min: band.min, max: band.max };
}

export function inferDailyRateBandId(
  min: number | null | undefined,
  max: number | null | undefined,
  storedBandId: string | null | undefined
): DailyRateBandId | "" {
  if (storedBandId && getDailyRateBand(storedBandId)) {
    return storedBandId as DailyRateBandId;
  }
  if (min == null) return "";
  const match = DAILY_RATE_BANDS.find((band) => {
    if (band.min == null) return false;
    if (band.min !== min) return false;
    if (band.max == null) return max == null || max >= band.min;
    return band.max === max;
  });
  return match?.id ?? "";
}

export function nurseMatchesDailyRateBand(
  nurseMin: number | null | undefined,
  nurseMax: number | null | undefined,
  nurseBandId: string | null | undefined,
  filterBandId: string
): boolean {
  const filterBand = getDailyRateBand(filterBandId);
  if (!filterBand) return true;
  if (filterBand.id === "open_to_discuss") {
    return nurseBandId === "open_to_discuss" || (nurseMin == null && nurseMax == null);
  }
  if (nurseMin == null && nurseMax == null) return false;
  const rangeMin = nurseMin ?? 0;
  const rangeMax = nurseMax ?? nurseMin ?? Number.POSITIVE_INFINITY;
  const bandMin = filterBand.min ?? 0;
  const bandMax = filterBand.max ?? Number.POSITIVE_INFINITY;
  return rangeMax >= bandMin && rangeMin <= bandMax;
}
