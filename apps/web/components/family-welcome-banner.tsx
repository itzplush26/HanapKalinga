"use client";

import { useRouter } from "next/navigation";

export function FamilyWelcomeBanner() {
  const router = useRouter();

  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
      <p>
        Welcome to HanapKalinga! Your account is ready. Browse nurses from your dashboard or start a booking
        request.
      </p>
      <button
        type="button"
        onClick={() => router.replace("/dashboard/family")}
        className="shrink-0 text-brand-700 hover:text-brand-900"
        aria-label="Dismiss welcome message"
      >
        ✕
      </button>
    </div>
  );
}
