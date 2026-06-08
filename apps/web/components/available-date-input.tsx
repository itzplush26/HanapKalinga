"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";

interface AvailableDateInputProps {
  value: string;
  availableDates: string[];
  hasAvailabilitySet: boolean;
  onChange: (value: string) => void;
}

function toDateKey(value: string) {
  return value.slice(0, 10);
}

export function AvailableDateInput({
  value,
  availableDates,
  hasAvailabilitySet,
  onChange
}: AvailableDateInputProps) {
  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);
  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60);
  const maxDateKey = maxDate.toISOString().slice(0, 10);

  function handleChange(nextValue: string) {
    if (!nextValue) {
      onChange("");
      return;
    }
    if (!hasAvailabilitySet || availableSet.has(toDateKey(nextValue))) {
      onChange(nextValue);
    }
  }

  return (
    <div className="space-y-2">
      {hasAvailabilitySet ? (
        <p className="text-xs text-slate-500">
          Only dates this nurse marked available can be selected.
        </p>
      ) : (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          This nurse has not set availability yet. You can still send a request and confirm the date
          through chat.
        </p>
      )}
      <Input
        type="date"
        min={today}
        max={maxDateKey}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
      />
      {hasAvailabilitySet && availableDates.length > 0 ? (
        <p className="text-xs text-slate-500">
          {availableDates.length} available date{availableDates.length === 1 ? "" : "s"} in the next 60 days.
        </p>
      ) : null}
    </div>
  );
}
