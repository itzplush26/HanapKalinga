import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  VERIFICATION_STATUS_BADGE_CLASSES,
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_PROGRESS_STEPS,
  getVerificationProgressIndex,
  type VerificationStatus
} from "@/lib/verification";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import { Button } from "@/components/ui/button";

interface VerificationStatusBannerProps {
  status: VerificationStatus | string;
  rejectionReason?: string | null;
}

const statusStyles: Record<VerificationStatus, string> = {
  pending: "border-yellow-200 bg-yellow-50 text-yellow-900",
  under_review: "border-blue-200 bg-blue-50 text-blue-900",
  verified: "border-emerald-200 bg-emerald-50 text-emerald-900",
  rejected: "border-rose-200 bg-rose-50 text-rose-900",
  resubmission_required: "border-amber-200 bg-amber-50 text-amber-900"
};

export function VerificationStatusBanner({
  status,
  rejectionReason
}: VerificationStatusBannerProps) {
  const key = status as VerificationStatus;
  const progressIndex = getVerificationProgressIndex(key);
  const showProgress = key === "pending" || key === "under_review" || key === "verified";

  return (
    <div className={cn("rounded-2xl border p-4 text-sm", statusStyles[key] ?? statusStyles.pending)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">Verification status</p>
        <VerificationStatusBadge status={key} />
      </div>

      {showProgress ? (
        <ol className="mt-4 flex flex-wrap gap-2">
          {VERIFICATION_PROGRESS_STEPS.map((step, index) => (
            <li
              key={step.key}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                index <= progressIndex
                  ? VERIFICATION_STATUS_BADGE_CLASSES[
                      step.key === "verified" ? "verified" : index === progressIndex ? key : "pending"
                    ]
                  : "bg-white/70 text-slate-500"
              )}
            >
              {step.label}
            </li>
          ))}
        </ol>
      ) : null}

      <div className="mt-3 space-y-2">
        {key === "pending" && (
          <p>Your documents are pending review. This usually takes 1–3 business days.</p>
        )}
        {key === "under_review" && (
          <p>An administrator is currently reviewing your verification documents.</p>
        )}
        {key === "verified" && (
          <p>
            Congratulations! Your account has been successfully verified. You now have full access to all platform
            features.
          </p>
        )}
        {key === "rejected" && (
          <>
            <p>Unfortunately, your verification request was not approved.</p>
            {rejectionReason ? <p className="text-xs">Reason: {rejectionReason}</p> : null}
            <p className="text-xs">
              Please review the reason provided and submit updated documents for review.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href="/dashboard/nurse/profile">Update documents</Link>
            </Button>
          </>
        )}
        {key === "resubmission_required" && (
          <>
            <p>We need additional information or updated documents before we can approve your account.</p>
            {rejectionReason ? <p className="text-xs">Details: {rejectionReason}</p> : null}
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href="/dashboard/nurse/profile">Resubmit documents</Link>
            </Button>
          </>
        )}
      </div>

      <p className="mt-3 text-xs opacity-80">
        Current status: {VERIFICATION_STATUS_LABELS[key] ?? status}
      </p>
    </div>
  );
}
