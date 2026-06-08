const MANILA_TZ = "Asia/Manila";

export function formatDayColumnHeader(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00+08:00`);
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: MANILA_TZ
  }).format(date);
  const day = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    timeZone: MANILA_TZ
  }).format(date);
  return `${weekday} (${day})`;
}

export function getManilaDateString(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function getWeekStartDateString(weekOffset: number, anchor = new Date()): string {
  const manilaToday = getManilaDateString(anchor);
  const [year, month, day] = manilaToday.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day + weekOffset * 7));
  return start.toISOString().slice(0, 10);
}

export function getWeekDatesFromOffset(weekOffset: number, anchor = new Date()): string[] {
  const manilaToday = getManilaDateString(anchor);
  const [year, month, day] = manilaToday.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day + weekOffset * 7));

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

export function getAccountCreationWeekStart(createdAt: string): string {
  const createdDate = createdAt.slice(0, 10);
  const date = new Date(`${createdDate}T12:00:00+08:00`);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}
