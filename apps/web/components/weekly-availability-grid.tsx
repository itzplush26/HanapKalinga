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

const FULL_DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const SHIFT_LABELS: Record<Shift, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  full_day: "Full Day"
};

function summarizeOpenShifts(dayOfWeek: number, pattern: Map<string, boolean>): string {
  const openShifts = SHIFTS.filter((shift) => pattern.get(weeklySlotKey(dayOfWeek, shift)) ?? false);
  if (openShifts.length === 0) return "No shifts open";
  if (openShifts.length === 1 && openShifts[0] === "full_day") return "Full day";
  return openShifts.map((shift) => SHIFT_LABELS[shift]).join(", ");
}

export function WeeklyAvailabilityGrid({ pattern, onToggle }: WeeklyAvailabilityGridProps) {
  return (
    <>
      <div className="space-y-4 sm:hidden">
        {FULL_DAY_LABELS.map((dayLabel, index) => {
          const dayOfWeek = index + 1;
          return (
            <details key={dayLabel} open className="rounded-2xl border border-slate-200 bg-white p-3">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">{dayLabel}</span>
                  <span className="text-xs text-slate-500">{summarizeOpenShifts(dayOfWeek, pattern)}</span>
                </div>
              </summary>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {SHIFTS.map((shift) => {
                  const isOpen = pattern.get(weeklySlotKey(dayOfWeek, shift)) ?? false;
                  return (
                    <button
                      key={`${dayOfWeek}-${shift}`}
                      type="button"
                      onClick={() => onToggle(dayOfWeek, shift)}
                      className={cn(
                        "w-full min-w-0 rounded-xl border px-1 py-2 text-[11px]",
                        isOpen
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                      )}
                    >
                      {SHIFT_LABELS[shift]}
                    </button>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto sm:block">
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
    </>
  );
}
