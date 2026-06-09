import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/lib/verification";

interface OnboardingData {
  hasPhoto: boolean;
  profileComplete: boolean;
  hasAvailability: boolean;
  verificationStatus: VerificationStatus;
  rejectionReason?: string | null;
}

function StepIndicator({ state }: { state: "complete" | "action" | "waiting" | "rejected" }) {
  return (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
        state === "complete" && "border-emerald-500 bg-emerald-500 text-white",
        state === "action" && "border-amber-500 bg-amber-50 text-amber-700",
        state === "waiting" && "border-slate-300 bg-slate-100 text-slate-500",
        state === "rejected" && "border-rose-500 bg-rose-50 text-rose-700"
      )}
    >
      {state === "complete" ? <Check className="h-4 w-4" /> : state === "rejected" ? "!" : ""}
    </span>
  );
}

export function NurseOnboardingChecklist({ data }: { data: OnboardingData }) {
  const steps = [
    {
      label: "Upload a profile photo",
      complete: data.hasPhoto,
      state: data.hasPhoto ? ("complete" as const) : ("action" as const),
      href: "/dashboard/nurse/profile#photo",
      hint: data.hasPhoto ? null : "Add a photo to build trust"
    },
    {
      label: "Complete your profile",
      complete: data.profileComplete,
      state: data.profileComplete ? ("complete" as const) : ("action" as const),
      href: "/dashboard/nurse/profile",
      hint: data.profileComplete ? null : "Bio, skills, and rates required"
    },
    {
      label: "Set your availability",
      complete: data.hasAvailability,
      state: data.hasAvailability ? ("complete" as const) : ("action" as const),
      href: "/dashboard/nurse/availability",
      hint: data.hasAvailability ? null : "Families book based on your schedule"
    },
    {
      label: "Verification approved",
      complete: data.verificationStatus === "verified",
      state:
        data.verificationStatus === "verified"
          ? ("complete" as const)
          : data.verificationStatus === "rejected"
            ? ("rejected" as const)
            : ("waiting" as const),
      href: "/dashboard/nurse/profile",
      hint:
        data.verificationStatus === "verified"
          ? null
          : data.verificationStatus === "rejected"
            ? data.rejectionReason ?? "Please re-upload documents"
            : "Under review — usually 1 to 3 days"
    }
  ];

  const completedCount = steps.filter((s) => s.complete).length;
  if (completedCount === steps.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-navy-900">Get started checklist</h2>
        <span className="text-xs text-slate-500">
          {completedCount}/{steps.length} complete
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>
      <ul className="mt-4 space-y-3">
        {steps.map((step) => (
          <li key={step.label}>
            <Link href={step.href} className="flex items-start gap-3 rounded-xl p-2 hover:bg-slate-50">
              <StepIndicator state={step.state} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-navy-900">{step.label}</p>
                {step.hint ? <p className="text-xs text-slate-500">{step.hint}</p> : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-xl bg-brand-50 p-3 text-xs text-brand-900">
        <p className="font-semibold">Tips for new nurses</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>Set your availability to attract bookings</li>
          <li>Add a clear profile photo to build trust</li>
          <li>Write a detailed bio to help families understand your experience</li>
        </ul>
      </div>
    </div>
  );
}
