"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
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
  variant?: "dashboard" | "profile";
  onDismiss?: () => void;
}

const statusStyles: Record<VerificationStatus, string> = {
  pending: "border-warning-border bg-warning-bg text-text-primary",
  under_review: "border-info-border bg-info-bg text-text-primary",
  verified: "border-success-border bg-success-bg text-text-primary",
  rejected: "border-error-border bg-error-bg text-text-primary",
  resubmission_required: "border-warning-border bg-warning-bg text-text-primary"
};

export function VerificationStatusBanner({
  status,
  rejectionReason,
  variant = "dashboard",
  onDismiss
}: VerificationStatusBannerProps) {
  const key = status as VerificationStatus;
  const progressIndex = getVerificationProgressIndex(key);
  const showProgress =
    variant === "dashboard" && (key === "pending" || key === "under_review");

  if (variant === "profile") {
    if (key === "verified") {
      return (
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white">
          <Check className="h-4 w-4" />
          Verified
        </div>
      );
    }

    if (key === "pending" || key === "under_review") {
      return (
        <div className="inline-flex items-center rounded-full bg-surface-alt px-3 py-1.5 text-sm font-medium text-text-secondary">
          Verification Pending
        </div>
      );
    }

    return null;
  }

  if (variant === "dashboard" && key === "verified") {
    return null;
  }

  return (
    <div className={cn("relative rounded-2xl border p-4 text-sm", statusStyles[key] ?? statusStyles.pending)}>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-500 hover:bg-white/60"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
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
                index < progressIndex
                  ? "bg-success-bg text-success"
                  : index === progressIndex
                    ? VERIFICATION_STATUS_BADGE_CLASSES[key === "under_review" ? "under_review" : "pending"]
                    : "bg-surface-alt text-text-muted"
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
