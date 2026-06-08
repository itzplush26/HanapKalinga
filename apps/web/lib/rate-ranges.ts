import {
  DAILY_RATE_BAND_IDS,
  DAILY_RATE_BANDS,
  formatDailyRateBandLabel,
  getDailyRateBand,
  inferDailyRateBandId,
  resolveDailyRateBandValues,
  type DailyRateBand,
  type DailyRateBandId
} from "@/lib/data/rates";

export {
  DAILY_RATE_BAND_IDS,
  DAILY_RATE_BANDS,
  formatDailyRateBandLabel,
  getDailyRateBand,
  inferDailyRateBandId,
  nurseMatchesDailyRateBand,
  resolveDailyRateBandValues,
  type DailyRateBand,
  type DailyRateBandId
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
