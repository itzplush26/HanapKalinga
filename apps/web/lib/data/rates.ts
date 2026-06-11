export const HOURLY_RATE_BAND_IDS = [
  "under_150",
  "150_250",
  "250_400",
  "400_600",
  "above_600",
  "open_to_discuss"
] as const;

export type HourlyRateBandId = (typeof HOURLY_RATE_BAND_IDS)[number];

export interface HourlyRateBand {
  id: HourlyRateBandId;
  label: string;
  min: number | null;
  max: number | null;
}

export const HOURLY_RATE_BANDS: HourlyRateBand[] = [
  { id: "under_150", label: "Under ₱150/hr", min: 0, max: 149 },
  { id: "150_250", label: "₱150 – ₱250/hr", min: 150, max: 250 },
  { id: "250_400", label: "₱250 – ₱400/hr", min: 250, max: 400 },
  { id: "400_600", label: "₱400 – ₱600/hr", min: 400, max: 600 },
  { id: "above_600", label: "Above ₱600/hr", min: 600, max: null },
  { id: "open_to_discuss", label: "Open to discuss", min: null, max: null }
];

export function getHourlyRateBand(id: string | null | undefined): HourlyRateBand | undefined {
  if (!id) return undefined;
  return HOURLY_RATE_BANDS.find((band) => band.id === id);
}

export function formatHourlyRateBandLabel(
  bandId: string | null | undefined,
  min: number | null | undefined,
  max: number | null | undefined
): string | null {
  const band = getHourlyRateBand(bandId ?? undefined);
  if (band) return band.label;
  if (min == null) return null;
  if (max != null && max !== min) {
    return `₱${min.toLocaleString("en-PH")} – ₱${max.toLocaleString("en-PH")}/hr`;
  }
  return `₱${min.toLocaleString("en-PH")}+/hr`;
}

export function resolveHourlyRateBandValues(id: HourlyRateBandId | null | undefined): {
  min: number | null;
  max: number | null;
} {
  const band = getHourlyRateBand(id ?? undefined);
  if (!band) return { min: null, max: null };
  return { min: band.min, max: band.max };
}

export function inferHourlyRateBandId(
  min: number | null | undefined,
  max: number | null | undefined,
  storedBandId: string | null | undefined
): HourlyRateBandId | "" {
  if (storedBandId && getHourlyRateBand(storedBandId)) {
    return storedBandId as HourlyRateBandId;
  }
  if (min == null) return "";
  const match = HOURLY_RATE_BANDS.find((band) => {
    if (band.min == null) return false;
    if (band.min !== min) return false;
    if (band.max == null) return max == null || max >= band.min;
    return band.max === max;
  });
  return match?.id ?? "";
}

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
