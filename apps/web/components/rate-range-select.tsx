"use client";

import { DAILY_RATE_BANDS } from "@/lib/data/rates";
import { Select } from "@/components/ui/select";

interface RateRangeSelectProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  hasError?: boolean;
  disabled?: boolean;
  emptyLabel?: string;
}

export function RateRangeSelect({
  value,
  onChange,
  id,
  hasError,
  disabled,
  emptyLabel = "Select expected rate range (optional)"
}: RateRangeSelectProps) {
  return (
    <Select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={hasError ? "border-rose-500 focus:ring-rose-500" : undefined}
    >
      <option value="">{emptyLabel}</option>
      {DAILY_RATE_BANDS.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
