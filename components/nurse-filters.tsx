"use client";

import { useState } from "react";
import { PH_CITIES, PH_SPECIALIZATIONS } from "@/lib/ph-locations";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function NurseFilters() {
  const [city, setCity] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  function toggleSpecialization(value: string) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
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
    </div>
  );
}
