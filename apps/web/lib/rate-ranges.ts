import {
  DAILY_RATE_BAND_IDS,
  DAILY_RATE_BANDS,
  HOURLY_RATE_BAND_IDS,
  HOURLY_RATE_BANDS,
  formatDailyRateBandLabel,
  formatHourlyRateBandLabel,
  getDailyRateBand,
  getHourlyRateBand,
  inferDailyRateBandId,
  inferHourlyRateBandId,
  resolveDailyRateBandValues,
  resolveHourlyRateBandValues,
  type DailyRateBand,
  type DailyRateBandId,
  type HourlyRateBand,
  type HourlyRateBandId
} from "@/lib/data/rates";

export {
  DAILY_RATE_BAND_IDS,
  DAILY_RATE_BANDS,
  HOURLY_RATE_BAND_IDS,
  HOURLY_RATE_BANDS,
  formatDailyRateBandLabel,
  formatHourlyRateBandLabel,
  getDailyRateBand,
  getHourlyRateBand,
  inferDailyRateBandId,
  inferHourlyRateBandId,
  nurseMatchesDailyRateBand,
  resolveDailyRateBandValues,
  resolveHourlyRateBandValues,
  type DailyRateBand,
  type DailyRateBandId,
  type HourlyRateBand,
  type HourlyRateBandId
} from "@/lib/data/rates";

/** @deprecated Use DAILY_RATE_BAND_IDS */
export const RATE_RANGE_IDS = DAILY_RATE_BAND_IDS;
/** @deprecated Use DailyRateBandId */
export type RateRangeId = DailyRateBandId;
/** @deprecated Use DAILY_RATE_BANDS */
export const RATE_RANGE_OPTIONS = DAILY_RATE_BANDS;
/** @deprecated Use getDailyRateBand */
export const getRateRangeOption = getDailyRateBand;
/** @deprecated Use resolveDailyRateBandValues */
export const resolveRateRangeValues = resolveDailyRateBandValues;
/** @deprecated Use formatDailyRateBandLabel */
export const formatRateRangeDisplay = formatDailyRateBandLabel;
/** @deprecated Use inferDailyRateBandId */
export const inferRateRangeId = inferDailyRateBandId;
