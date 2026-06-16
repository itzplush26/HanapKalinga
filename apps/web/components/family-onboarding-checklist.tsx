"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildFamilyChecklistItems,
  isFamilyChecklistComplete,
  type FamilyChecklistBookings,
  type FamilyChecklistProfile,
  type FamilyOnboardingRecord
} from "@/lib/family-onboarding";
import { cn } from "@/lib/utils";
import { useFamilyOnboardingAction } from "@/components/contextual-tooltip";

interface FamilyOnboardingChecklistProps {
  profile: FamilyChecklistProfile;
  family: FamilyOnboardingRecord;
  bookings: FamilyChecklistBookings;
}

function StepIndicator({ state }: { state: "complete" | "current" | "future" }) {
  return (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
        state === "complete" && "border-primary bg-primary text-white",
        state === "current" && "border-primary bg-transparent",
        state === "future" && "border-border bg-transparent opacity-50"
      )}
    >
      {state === "complete" ? <Check className="h-4 w-4" /> : null}
    </span>
  );
}

export function FamilyOnboardingChecklist({
  profile,
  family,
  bookings
}: FamilyOnboardingChecklistProps) {
  const { dismissChecklist } = useFamilyOnboardingAction();
  const items = buildFamilyChecklistItems(profile, family, bookings);
  const allComplete = isFamilyChecklistComplete(items);
  const completedCount = items.filter((item) => item.complete).length;

  if (family.checklist_dismissed && !allComplete) {
    return null;
  }

  if (allComplete) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-text-primary">You&apos;re all set!</h2>
        <p className="mt-1 text-sm text-text-secondary">
          You can browse and book anytime.
        </p>
        <Button asChild size="sm" className="mt-4">
          <Link href="/nurses">Browse caregivers</Link>
        </Button>
      </div>
    );
  }

  let currentAssigned = false;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Getting started</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">
            {completedCount}/{items.length} complete
          </span>
          <button
            type="button"
            onClick={() => dismissChecklist()}
            className="rounded p-1 text-text-muted hover:bg-surface-alt"
            aria-label="Dismiss checklist"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(completedCount / items.length) * 100}%` }}
        />
      </div>
      <ul className="mt-4 space-y-3">
        {items.map((item) => {
          let state: "complete" | "current" | "future";
          if (item.complete) {
            state = "complete";
          } else if (!currentAssigned) {
            state = "current";
            currentAssigned = true;
          } else {
            state = "future";
          }

          return (
            <li
              key={item.id}
              className={cn(
                "rounded-xl p-2",
                state === "current" && "bg-primary-light/60",
                state === "future" && "opacity-60"
              )}
            >
              <div className="flex items-start gap-3">
                <StepIndicator state={state} />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      state === "complete" && "text-text-muted line-through",
                      state === "current" && "text-text-primary",
                      state === "future" && "text-text-muted"
                    )}
                  >
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">{item.description}</p>
                  {state === "current" && item.href && item.ctaLabel ? (
                    <Button asChild size="sm" className="mt-2">
                      <Link href={item.href}>{item.ctaLabel}</Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
