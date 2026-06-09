const MANILA_TZ = "Asia/Manila";

export function formatMessageTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();

  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: MANILA_TZ }).format(now);
  const messageDayStr = new Intl.DateTimeFormat("en-CA", { timeZone: MANILA_TZ }).format(date);

  if (messageDayStr === todayStr) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: MANILA_TZ
    }).format(date);
  }

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date > weekAgo) {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: MANILA_TZ
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: MANILA_TZ
  }).format(date);
}
