"use client";

import Link from "next/link";
import { Check, Clock, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_PROGRESS_STEPS,
  getVerificationProgressIndex,
  type VerificationStatus
} from "@/lib/verification";
import { Button } from "@/components/ui/button";

interface VerificationStatusBannerProps {
  status: VerificationStatus | string;
  rejectionReason?: string | null;
  variant?: "dashboard" | "profile";
  onDismiss?: () => void;
}

const cardAccentClass: Partial<Record<VerificationStatus, string>> = {
  pending: "verification-status-card--pending",
  under_review: "verification-status-card--under_review",
  rejected: "verification-status-card--rejected",
  resubmission_required: "verification-status-card--resubmission_required"
};

function VerificationProgressSteps({ status }: { status: VerificationStatus }) {
  const progressIndex = getVerificationProgressIndex(status);

  function pillClass(index: number): string {
    const isApprovedStep = index === VERIFICATION_PROGRESS_STEPS.length - 1;
    if (isApprovedStep && progressIndex >= index) {
      return "verification-step-pill--approved";
    }
    if (index < progressIndex) {
      return "verification-step-pill--completed";
    }
    if (index === progressIndex) {
      return "verification-step-pill--active";
    }
    return "verification-step-pill--future";
  }

  function pillIcon(index: number) {
    const isApprovedStep = index === VERIFICATION_PROGRESS_STEPS.length - 1;
    if (isApprovedStep && progressIndex >= index) {
      return <Check className="h-3 w-3 shrink-0" aria-hidden />;
    }
    if (index < progressIndex) {
      return <Check className="h-3 w-3 shrink-0" aria-hidden />;
    }
    if (index === progressIndex) {
      return status === "under_review" ? (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden />
      ) : (
        <Clock className="h-3 w-3 shrink-0" aria-hidden />
      );
    }
    return null;
  }

  return (
    <ol className="mt-4 flex flex-wrap items-center gap-y-2">
      {VERIFICATION_PROGRESS_STEPS.map((step, index) => (
        <li key={step.key} className="flex items-center">
          {index > 0 ? (
            <span
              className={cn(
                "verification-step-connector",
                index <= progressIndex && "verification-step-connector--completed"
              )}
              aria-hidden
            />
          ) : null}
          <span className={cn("verification-step-pill", pillClass(index))}>
            {pillIcon(index)}
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function VerificationStatusBanner({
  status,
  rejectionReason,
  variant = "dashboard",
  onDismiss
}: VerificationStatusBannerProps) {
  const key = status as VerificationStatus;
  const showProgress = variant === "dashboard" && (key === "pending" || key === "under_review");

  if (variant === "profile") {
    if (key === "verified") {
      return (
        <div className="inline-flex items-center gap-2 rounded-full bg-success px-3 py-1.5 text-sm font-medium text-white">
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
    <div
      className={cn(
        "verification-status-card relative",
        cardAccentClass[key] ?? "verification-status-card--pending"
      )}
    >
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-text-muted hover:bg-surface-alt"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
        <p className="font-medium">Verification status</p>
        <span className="verification-status-badge">{VERIFICATION_STATUS_LABELS[key] ?? status}</span>
      </div>

      {showProgress ? <VerificationProgressSteps status={key} /> : null}

      <div className="mt-3 space-y-2 text-text-secondary">
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

      <p className="mt-3 text-xs text-text-muted">
        Current status: {VERIFICATION_STATUS_LABELS[key] ?? status}
      </p>
    </div>
  );
}
