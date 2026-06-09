export type Shift = "morning" | "afternoon" | "evening" | "full_day";

export const SHIFTS: Shift[] = ["morning", "afternoon", "evening", "full_day"];

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type WeeklySlot = {
  dayOfWeek: number;
  shift: Shift;
  isOpen: boolean;
};

export type DateException = {
  date: string;
  isOpen: boolean;
};

export type AvailabilityRow = {
  date: string;
  shift: Shift;
  is_open: boolean;
};

export const GENERATION_HORIZON_DAYS = 60;
export const PREVIEW_DAYS = 30;

export function weeklySlotKey(dayOfWeek: number, shift: Shift): string {
  return `${dayOfWeek}-${shift}`;
}

export function getIsoWeekdayFromDate(isoDate: string): number {
  const date = new Date(`${isoDate}T12:00:00+08:00`);
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

export function addDaysToDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function buildWeeklyPatternMap(slots: WeeklySlot[]): Map<string, boolean> {
  const map = new Map<string, boolean>();
  for (let day = 1; day <= 7; day += 1) {
    for (const shift of SHIFTS) {
      map.set(weeklySlotKey(day, shift), false);
    }
  }
  for (const slot of slots) {
    map.set(weeklySlotKey(slot.dayOfWeek, slot.shift), slot.isOpen);
  }
  return map;
}

export function applyQuickSetPreset(
  current: Map<string, boolean>,
  preset: "weekdays" | "weekends" | "every_day" | "clear_all"
): Map<string, boolean> {
  const next = new Map(current);
  for (let day = 1; day <= 7; day += 1) {
    const shouldOpen =
      preset === "every_day" ||
      (preset === "weekdays" && day <= 5) ||
      (preset === "weekends" && day >= 6);
    const open = preset === "clear_all" ? false : shouldOpen;

    for (const shift of SHIFTS) {
      next.set(weeklySlotKey(day, shift), open);
    }
  }
  return next;
}

export function generateAvailabilityRows(
  weeklyPattern: Map<string, boolean>,
  exceptions: Map<string, boolean>,
  startDate: string,
  days = GENERATION_HORIZON_DAYS
): AvailabilityRow[] {
  const rows: AvailabilityRow[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const date = addDaysToDate(startDate, offset);
    const exception = exceptions.get(date);

    if (exception !== undefined) {
      for (const shift of SHIFTS) {
        rows.push({ date, shift, is_open: exception });
      }
      continue;
    }

    const dayOfWeek = getIsoWeekdayFromDate(date);
    for (const shift of SHIFTS) {
      rows.push({
        date,
        shift,
        is_open: weeklyPattern.get(weeklySlotKey(dayOfWeek, shift)) ?? false
      });
    }
  }

  return rows;
}

export function isDateAvailable(
  weeklyPattern: Map<string, boolean>,
  exceptions: Map<string, boolean>,
  date: string
): boolean {
  const exception = exceptions.get(date);
  if (exception !== undefined) {
    return exception;
  }
  const dayOfWeek = getIsoWeekdayFromDate(date);
  return SHIFTS.some((shift) => weeklyPattern.get(weeklySlotKey(dayOfWeek, shift)));
}
