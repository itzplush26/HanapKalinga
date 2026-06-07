"use client";

import { type ReactNode } from "react";
import { PH_REGIONS, getCitiesForRegion } from "@/lib/ph-locations";
import { Select } from "@/components/ui/select";

interface RegionCitySelectsProps {
  region: string;
  city: string;
  onRegionChange: (region: string) => void;
  onCityChange: (city: string) => void;
  regionError?: boolean;
  cityError?: boolean;
  regionId?: string;
  cityId?: string;
  disabled?: boolean;
  regionLabel?: ReactNode;
  cityLabel?: ReactNode;
}

export function RegionCitySelects({
  region,
  city,
  onRegionChange,
  onCityChange,
  regionError,
  cityError,
  regionId = "region",
  cityId = "city",
  disabled,
  regionLabel,
  cityLabel
}: RegionCitySelectsProps) {
  const cities = getCitiesForRegion(region);

  return (
    <>
      <div className="space-y-1">
        {regionLabel}
        <Select
          id={regionId}
          value={region}
          disabled={disabled}
          onChange={(event) => {
            onRegionChange(event.target.value);
            onCityChange("");
          }}
          className={regionError ? "border-rose-500 focus:ring-rose-500" : undefined}
        >
          <option value="">Select region</option>
          {PH_REGIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        {cityLabel}
        <Select
          id={cityId}
          value={city}
          disabled={disabled || !region}
          onChange={(event) => onCityChange(event.target.value)}
          className={cityError ? "border-rose-500 focus:ring-rose-500" : undefined}
        >
          <option value="">{region ? "Select city" : "Select a region first"}</option>
          {cities.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>
    </>
  );
}
