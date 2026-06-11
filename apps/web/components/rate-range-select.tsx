"use client";

import { DAILY_RATE_BANDS, HOURLY_RATE_BANDS } from "@/lib/data/rates";
import { Select } from "@/components/ui/select";

interface RateRangeSelectProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  hasError?: boolean;
  disabled?: boolean;
  emptyLabel?: string;
  variant?: "hourly" | "daily";
}

export function RateRangeSelect({
  value,
  onChange,
  id,
  hasError,
  disabled,
  emptyLabel = "Select expected rate range (optional)",
  variant = "daily"
}: RateRangeSelectProps) {
  const options = variant === "hourly" ? HOURLY_RATE_BANDS : DAILY_RATE_BANDS;

  return (
    <Select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={hasError ? "border-rose-500 focus:ring-rose-500" : undefined}
    >
      <option value="">{emptyLabel}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
