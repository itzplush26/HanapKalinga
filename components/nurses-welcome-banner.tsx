"use client";

import { useRouter } from "next/navigation";

export function NursesWelcomeBanner() {
  const router = useRouter();

  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
      <p>Welcome to HanapKalinga! Browse verified nurses and caregivers below.</p>
      <button
        type="button"
        onClick={() => router.replace("/nurses")}
        className="shrink-0 text-brand-700 hover:text-brand-900"
        aria-label="Dismiss welcome message"
      >
        ✕
      </button>
    </div>
  );
}
