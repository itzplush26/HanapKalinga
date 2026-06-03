export type AvailabilitySlot = {
  date: string;
  is_open: boolean;
};

export type AvailabilityStatus = "available_now" | "available_next_week" | "not_accepting";

export function deriveAvailabilityStatus(
  slots: AvailabilitySlot[],
  referenceDate = new Date()
): AvailabilityStatus {
  const openSlots = slots.filter((slot) => slot.is_open);
  if (!openSlots.length) return "not_accepting";

  const todayStart = new Date(referenceDate);
  todayStart.setHours(0, 0, 0, 0);

  let hasNearTerm = false;
  let hasNextWeek = false;

  for (const slot of openSlots) {
    const slotDate = new Date(`${slot.date}T00:00:00`);
    if (Number.isNaN(slotDate.getTime())) continue;
    const diffMs = slotDate.getTime() - todayStart.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 1) {
      hasNearTerm = true;
      break;
    }
    if (diffDays >= 2 && diffDays <= 7) {
      hasNextWeek = true;
    }
  }

  if (hasNearTerm) return "available_now";
  if (hasNextWeek) return "available_next_week";
  return "not_accepting";
}
