import { Fragment } from "react";
import { Check } from "lucide-react";
import {
  SHIFTS,
  WEEKDAY_LABELS,
  weeklySlotKey,
  type Shift,
  type WeeklySlot
} from "@/lib/availability-schedule";
import { cn } from "@/lib/utils";

const SHIFT_LABELS: Record<Shift, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  full_day: "Full Day"
};

interface PublicWeeklyAvailabilityGridProps {
  slots: WeeklySlot[];
}

export function PublicWeeklyAvailabilityGrid({ slots }: PublicWeeklyAvailabilityGridProps) {
  const pattern = new Map<string, boolean>();
  for (let day = 1; day <= 7; day += 1) {
    for (const shift of SHIFTS) {
      pattern.set(weeklySlotKey(day, shift), false);
    }
  }
  for (const slot of slots) {
    if (slot.isOpen) {
      pattern.set(weeklySlotKey(slot.dayOfWeek, slot.shift), true);
    }
  }

  const hasAnyOpen = slots.some((slot) => slot.isOpen);

  if (!hasAnyOpen) {
    return (
      <p className="rounded-2xl border border-border bg-surface p-3 text-sm text-text-secondary">
        Schedule not yet set. Contact to discuss availability.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[320px] rounded-2xl border border-border bg-surface p-3">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: "minmax(4.5rem,1fr) repeat(7, minmax(2rem,1fr))" }}
        >
          <div />
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="text-center text-[11px] font-medium text-text-muted">
              {label}
            </div>
          ))}

          {SHIFTS.map((shift) => (
            <Fragment key={shift}>
              <div className="flex items-center pr-1 text-xs text-text-muted">
                {SHIFT_LABELS[shift]}
              </div>
              {WEEKDAY_LABELS.map((_, index) => {
                const dayOfWeek = index + 1;
                const isOpen = pattern.get(weeklySlotKey(dayOfWeek, shift)) ?? false;
                return (
                  <div
                    key={`${shift}-${dayOfWeek}`}
                    className={cn(
                      "flex h-8 items-center justify-center rounded-lg",
                      isOpen ? "bg-primary-light" : "bg-transparent"
                    )}
                    aria-label={`${SHIFT_LABELS[shift]} ${WEEKDAY_LABELS[index]} ${isOpen ? "available" : "unavailable"}`}
                  >
                    {isOpen ? (
                      <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} />
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
