"use client";

import { useMemo, useRef } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DatePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
}

function formatDateLabel(value: string): string {
  if (!value) return "";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function DatePickerField({
  value,
  onChange,
  min,
  max,
  placeholder = "Select date",
  className
}: DatePickerFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const label = useMemo(() => formatDateLabel(value) || placeholder, [value, placeholder]);

  function openPicker() {
    const input = inputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.focus();
    input.click();
  }

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="date"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="sr-only"
      />
      <Button
        type="button"
        variant="outline"
        onClick={openPicker}
        className="w-full justify-between text-left font-normal"
      >
        <span className={value ? "text-text-primary" : "text-slate-500"}>{label}</span>
        <Calendar className="h-4 w-4 text-slate-400" />
      </Button>
    </div>
  );
}
