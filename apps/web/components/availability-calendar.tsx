"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatDayColumnHeader } from "@/lib/date-format";

type Shift = "morning" | "afternoon" | "evening" | "full_day";

export interface AvailabilitySlot {
  date: string;
  shift: Shift;
  isOpen: boolean;
}

interface AvailabilityCalendarProps {
  weekDates: string[];
  slots: AvailabilitySlot[];
  minDate?: string;
  onToggle: (slot: AvailabilitySlot) => void;
}

const shifts: Shift[] = ["morning", "afternoon", "evening", "full_day"];

export function AvailabilityCalendar({
  weekDates,
  slots,
  minDate,
  onToggle
}: AvailabilityCalendarProps) {
  const slotMap = useMemo(() => {
    return new Map(slots.map((slot) => [`${slot.date}-${slot.shift}`, slot]));
  }, [slots]);

  function isDateDisabled(date: string) {
    if (!minDate) return false;
    return date < minDate;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px] rounded-2xl border border-slate-200 bg-white">
        <div
          className="grid gap-2 border-b border-slate-200 p-3 text-xs font-semibold text-slate-600"
          style={{ gridTemplateColumns: `minmax(5rem,1fr) repeat(${weekDates.length}, minmax(4rem,1fr))` }}
        >
          <div>Shift</div>
          {weekDates.map((date) => (
            <div key={date} className={cn(isDateDisabled(date) && "text-slate-400")}>
              {formatDayColumnHeader(date)}
            </div>
          ))}
        </div>
        <div className="divide-y divide-slate-200">
          {shifts.map((shift) => (
            <div
              key={shift}
              className="grid gap-2 p-3 text-sm"
              style={{ gridTemplateColumns: `minmax(5rem,1fr) repeat(${weekDates.length}, minmax(4rem,1fr))` }}
            >
              <div className="text-slate-600 capitalize">{shift.replace("_", " ")}</div>
              {weekDates.map((date) => {
                const disabled = isDateDisabled(date);
                const slot = slotMap.get(`${date}-${shift}`) ?? {
                  date,
                  shift,
                  isOpen: false
                };
                return (
                  <button
                    key={`${date}-${shift}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle({ ...slot, isOpen: !slot.isOpen })}
                    className={cn(
                      "rounded-xl border px-2 py-2 text-xs",
                      disabled
                        ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                        : slot.isOpen
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                    )}
                  >
                    {disabled ? "—" : slot.isOpen ? "Open" : "Closed"}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
