"use client";

import { useFamilyOnboardingAction } from "@/components/contextual-tooltip";

export function FamilyFirstLoginBanner() {
  const { dismissWelcome } = useFamilyOnboardingAction();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-4 text-white shadow-sm">
      <button
        type="button"
        onClick={() => dismissWelcome()}
        className="absolute right-3 top-3 rounded p-1 text-white/80 hover:text-white"
        aria-label="Dismiss welcome banner"
      >
        ✕
      </button>
      <p className="pr-8 text-sm font-semibold">Welcome to HanapKalinga! Here&apos;s how it works:</p>
      <ol className="mt-4 flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:gap-2">
        <li className="flex flex-1 items-start gap-2 rounded-xl bg-white/15 p-2.5 sm:items-center">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-primary">
            1
          </span>
          <span>Browse verified nurses and caregivers</span>
        </li>
        <span className="hidden text-white/70 sm:inline" aria-hidden>
          →
        </span>
        <li className="flex flex-1 items-start gap-2 rounded-xl bg-white/15 p-2.5 sm:items-center">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-primary">
            2
          </span>
          <span>Send a booking request</span>
        </li>
        <span className="hidden text-white/70 sm:inline" aria-hidden>
          →
        </span>
        <li className="flex flex-1 items-start gap-2 rounded-xl bg-white/15 p-2.5 sm:items-center">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-primary">
            3
          </span>
          <span>Connect directly and arrange care</span>
        </li>
      </ol>
    </div>
  );
}
