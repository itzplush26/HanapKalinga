"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROVIDER_SPECIALIZATIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SpecializationsPickerProps {
  selected: string[];
  customValue: string;
  onSelectedChange: (value: string[]) => void;
  onCustomChange: (value: string) => void;
  error?: string;
}

export function SpecializationsPicker({
  selected,
  customValue,
  onSelectedChange,
  onCustomChange,
  error
}: SpecializationsPickerProps) {
  return (
    <div className="space-y-3">
      <Label>Specializations</Label>
      <div className="flex flex-wrap gap-2">
        {PROVIDER_SPECIALIZATIONS.map((item) => {
          const isSelected = selected.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => {
                const next = isSelected ? selected.filter((value) => value !== item) : [...selected, item];
                onSelectedChange(next);
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-text-secondary hover:border-primary/40"
              )}
            >
              {item}
            </button>
          );
        })}
      </div>
      <div className="space-y-1">
        <Label htmlFor="customSpecialization">Other specializations (optional)</Label>
        <Input
          id="customSpecialization"
          placeholder="e.g. Diabetes management, Wound care"
          value={customValue}
          onChange={(event) => onCustomChange(event.target.value)}
        />
        <p className="text-xs text-text-muted">Separate multiple custom specializations with commas.</p>
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

export function splitStoredSpecializations(values: string[] | null | undefined): {
  selected: string[];
  custom: string;
} {
  const existing = values ?? [];
  const predefined = PROVIDER_SPECIALIZATIONS as readonly string[];
  const selected = existing.filter((item) => predefined.includes(item));
  const custom = existing.filter((item) => !predefined.includes(item)).join(", ");
  return { selected, custom };
}

export function mergeSpecializations(selected: string[], customValue: string): string[] {
  const customItems = customValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return [...new Set([...selected, ...customItems])];
}
