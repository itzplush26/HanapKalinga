"use client";

import { cn } from "@/lib/utils";
import { addDaysToDate, isDateAvailable } from "@/lib/availability-schedule";
import { getManilaDateString } from "@/lib/date-format";

interface AvailabilityPreviewCalendarProps {
  weeklyPattern: Map<string, boolean>;
  exceptions: Map<string, boolean>;
  days?: number;
}

export function AvailabilityPreviewCalendar({
  weeklyPattern,
  exceptions,
  days = 30
}: AvailabilityPreviewCalendarProps) {
  const startDate = getManilaDateString();
  const dates = Array.from({ length: days }, (_, i) => addDaysToDate(startDate, i));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-navy-900">Next {days} days preview</h3>
      <div className="mt-3 grid grid-cols-7 gap-2">
        {dates.map((date) => {
          const available = isDateAvailable(weeklyPattern, exceptions, date);
          const dayNum = date.slice(8, 10);
          return (
            <div key={date} className="flex flex-col items-center gap-1 text-center">
              <span className="text-[10px] text-slate-500">{dayNum}</span>
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  available ? "bg-emerald-500" : "bg-slate-300"
                )}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-300" /> Unavailable
        </span>
      </div>
    </div>
  );
}
