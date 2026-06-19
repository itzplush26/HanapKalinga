"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { NurseFilters } from "@/components/nurse-filters";
import { NurseSearchInput } from "@/components/nurse-search-input";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

interface NursesBrowseHeaderProps {
  viewerRole: string | null;
}

export function NursesBrowseHeader({ viewerRole }: NursesBrowseHeaderProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  const backHref = viewerRole === "family" ? "/dashboard/family" : "/";
  const backLabel = viewerRole === "family" ? "Back to dashboard" : "Back to home";

  const badgeLabel = useMemo(() => {
    if (activeFilterCount <= 0) return null;
    return activeFilterCount > 9 ? "9+" : String(activeFilterCount);
  }, [activeFilterCount]);

  return (
    <div className="space-y-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>
      <div id="family-browse-filters" className="space-y-4">
        <Suspense fallback={null}>
          <NurseSearchInput />
        </Suspense>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Browse verified nurses and caregivers</h1>
            <p className="mt-1 text-sm text-slate-600">
              Filter by location, specialization, daily rate, and availability.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className="relative inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {badgeLabel ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-semibold text-white">
                {badgeLabel}
              </span>
            ) : null}
          </button>
        </div>
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            filtersOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <NurseFilters onActiveCountChange={setActiveFilterCount} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
