"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

type Shift = "morning" | "afternoon" | "evening" | "full_day";

export interface AvailabilitySlot {
  date: string;
  shift: Shift;
  isOpen: boolean;
}

interface AvailabilityCalendarProps {
  weekDates: string[];
  slots: AvailabilitySlot[];
  onToggle: (slot: AvailabilitySlot) => void;
}

const shifts: Shift[] = ["morning", "afternoon", "evening", "full_day"];

export function AvailabilityCalendar({
  weekDates,
  slots,
  onToggle
}: AvailabilityCalendarProps) {
  const slotMap = useMemo(() => {
    return new Map(slots.map((slot) => [`${slot.date}-${slot.shift}`, slot]));
  }, [slots]);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px] rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-5 gap-2 border-b border-slate-200 p-3 text-xs font-semibold text-slate-600">
          <div>Shift</div>
          {weekDates.map((date) => (
            <div key={date}>{date}</div>
          ))}
        </div>
        <div className="divide-y divide-slate-200">
          {shifts.map((shift) => (
            <div key={shift} className="grid grid-cols-5 gap-2 p-3 text-sm">
              <div className="text-slate-600">{shift.replace("_", " ")}</div>
              {weekDates.map((date) => {
                const slot = slotMap.get(`${date}-${shift}`) ?? {
                  date,
                  shift,
                  isOpen: false
                };
                return (
                  <button
                    key={`${date}-${shift}`}
                    type="button"
                    onClick={() => onToggle({ ...slot, isOpen: !slot.isOpen })}
                    className={cn(
                      "rounded-xl border px-2 py-2 text-xs",
                      slot.isOpen
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    )}
                  >
                    {slot.isOpen ? "Open" : "Closed"}
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
