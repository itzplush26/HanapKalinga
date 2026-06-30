"use client";

import { cn } from "@/lib/utils";
import {
  SHIFTS,
  WEEKDAY_LABELS,
  type Shift,
  weeklySlotKey
} from "@/lib/availability-schedule";

interface WeeklyAvailabilityGridProps {
  pattern: Map<string, boolean>;
  onToggle: (dayOfWeek: number, shift: Shift) => void;
}

export function WeeklyAvailabilityGrid({ pattern, onToggle }: WeeklyAvailabilityGridProps) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px] rounded-2xl border border-slate-200 bg-white">
        <div
          className="grid gap-x-2 gap-y-2 border-b border-slate-200 p-3 text-xs font-semibold text-slate-600"
          style={{ gridTemplateColumns: "minmax(5rem,1fr) repeat(7, minmax(3.5rem,1fr))" }}
        >
          <div>Shift</div>
          {WEEKDAY_LABELS.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>
        <div className="divide-y divide-slate-200">
          {SHIFTS.map((shift) => (
            <div
              key={shift}
              className="grid gap-x-2 gap-y-2 p-3 text-sm"
              style={{ gridTemplateColumns: "minmax(5rem,1fr) repeat(7, minmax(3.5rem,1fr))" }}
            >
              <div className="text-slate-600 capitalize">{shift.replace("_", " ")}</div>
              {WEEKDAY_LABELS.map((_, index) => {
                const dayOfWeek = index + 1;
                const isOpen = pattern.get(weeklySlotKey(dayOfWeek, shift)) ?? false;
                return (
                  <button
                    key={`${dayOfWeek}-${shift}`}
                    type="button"
                    onClick={() => onToggle(dayOfWeek, shift)}
                    className={cn(
                      "w-full min-w-0 rounded-xl border px-1 py-2 text-[11px] sm:text-xs",
                      isOpen
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    )}
                  >
                    {isOpen ? "Open" : "Closed"}
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
