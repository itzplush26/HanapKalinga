"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PH_REGIONS, getCitiesForRegion } from "@/lib/data/ph-locations";
import { PH_SPECIALIZATIONS } from "@/lib/ph-locations";
import { DAILY_RATE_BANDS } from "@/lib/data/rates";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface NurseFiltersProps {
  onActiveCountChange?: (count: number) => void;
}

function countActiveFilters(params: {
  region: string;
  city: string;
  providerType: string;
  availability: string;
  dailyRateBand: string;
  specializations: string[];
}) {
  let count = 0;
  if (params.region) count += 1;
  if (params.city) count += 1;
  if (params.providerType) count += 1;
  if (params.availability) count += 1;
  if (params.dailyRateBand) count += 1;
  if (params.specializations.length) count += 1;
  return count;
}

export function NurseFilters({ onActiveCountChange }: NurseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialSpecializations = useMemo(() => {
    const value = searchParams.get("specializations");
    return value ? value.split(",").filter(Boolean) : [];
  }, [searchParams]);

  const [region, setRegion] = useState(searchParams.get("region") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [providerType, setProviderType] = useState(searchParams.get("providerType") ?? "");
  const [selected, setSelected] = useState<string[]>(initialSpecializations);
  const [dailyRateBand, setDailyRateBand] = useState(searchParams.get("dailyRateBand") ?? "");
  const [availability, setAvailability] = useState(searchParams.get("availability") ?? "");

  const cities = getCitiesForRegion(region);

  useEffect(() => {
    onActiveCountChange?.(
      countActiveFilters({ region, city, providerType, availability, dailyRateBand, specializations: selected })
    );
  }, [region, city, providerType, availability, dailyRateBand, selected, onActiveCountChange]);

  function toggleSpecialization(value: string) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  }

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());
    if (region) params.set("region", region);
    else params.delete("region");

    if (city) params.set("city", city);
    else params.delete("city");

    if (selected.length) params.set("specializations", selected.join(","));
    else params.delete("specializations");

    if (dailyRateBand) params.set("dailyRateBand", dailyRateBand);
    else params.delete("dailyRateBand");

    params.delete("minDailyRate");
    params.delete("maxDailyRate");

    if (availability) params.set("availability", availability);
    else params.delete("availability");

    if (providerType) params.set("providerType", providerType);
    else params.delete("providerType");

    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    setRegion("");
    setCity("");
    setSelected([]);
    setDailyRateBand("");
    setAvailability("");
    setProviderType("");
    router.push(pathname);
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-slate-700">Region</label>
        <Select
          value={region}
          onChange={(event) => {
            setRegion(event.target.value);
            setCity("");
          }}
        >
          <option value="">All regions</option>
          {PH_REGIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">City</label>
        <Select
          value={city}
          disabled={!region}
          onChange={(event) => setCity(event.target.value)}
        >
          <option value="">{region ? "All cities in region" : "Select a region first"}</option>
          {cities.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Provider type</label>
        <Select value={providerType} onChange={(event) => setProviderType(event.target.value)}>
          <option value="">Both</option>
          <option value="nurse">Nurse</option>
          <option value="caregiver">Caregiver</option>
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
        <label className="text-sm font-medium text-slate-700">Daily rate band</label>
        <Select value={dailyRateBand} onChange={(event) => setDailyRateBand(event.target.value)}>
          <option value="">Any rate</option>
          {DAILY_RATE_BANDS.map((band) => (
            <option key={band.id} value={band.id}>
              {band.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" size="sm" onClick={applyFilters}>
          Apply filters
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>
          Clear all filters
        </Button>
      </div>
    </div>
  );
}
