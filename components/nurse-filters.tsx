"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PH_CITIES, PH_SPECIALIZATIONS } from "@/lib/ph-locations";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NurseFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialSpecializations = useMemo(() => {
    const value = searchParams.get("specializations");
    return value ? value.split(",").filter(Boolean) : [];
  }, [searchParams]);

  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [selected, setSelected] = useState<string[]>(initialSpecializations);
  const [minDailyRate, setMinDailyRate] = useState(searchParams.get("minDailyRate") ?? "");
  const [maxDailyRate, setMaxDailyRate] = useState(searchParams.get("maxDailyRate") ?? "");
  const [availability, setAvailability] = useState(searchParams.get("availability") ?? "");

  function toggleSpecialization(value: string) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  }

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());
    if (city) params.set("city", city);
    else params.delete("city");

    if (selected.length) params.set("specializations", selected.join(","));
    else params.delete("specializations");

    if (minDailyRate) params.set("minDailyRate", minDailyRate);
    else params.delete("minDailyRate");

    if (maxDailyRate) params.set("maxDailyRate", maxDailyRate);
    else params.delete("maxDailyRate");

    if (availability) params.set("availability", availability);
    else params.delete("availability");

    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    setCity("");
    setSelected([]);
    setMinDailyRate("");
    setMaxDailyRate("");
    setAvailability("");
    router.push(pathname);
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-slate-700">City</label>
        <Select value={city} onChange={(event) => setCity(event.target.value)}>
          <option value="">All cities</option>
          {PH_CITIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Availability</label>
        <Select value={availability} onChange={(event) => setAvailability(event.target.value)}>
          <option value="">Any</option>
          <option value="available_now">Available now</option>
          <option value="available_next_week">Available next week</option>
          <option value="not_accepting">Not accepting clients</option>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Daily rate range</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Min"
            value={minDailyRate}
            onChange={(event) => setMinDailyRate(event.target.value)}
          />
          <Input
            type="number"
            min={0}
            placeholder="Max"
            value={maxDailyRate}
            onChange={(event) => setMaxDailyRate(event.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Specializations</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PH_SPECIALIZATIONS.map((item) => {
            const active = selected.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleSpecialization(item)}
                className={
                  active
                    ? "rounded-full border border-brand-300 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
                    : "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                }
              >
                {item}
              </button>
            );
          })}
        </div>
        {selected.length ? (
          <div className="mt-2 text-xs text-slate-500">
            Selected: {selected.join(", ")}
          </div>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={applyFilters}>
          Apply filters
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>
          Clear
        </Button>
      </div>
    </div>
  );
}
