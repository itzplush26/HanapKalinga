export type VerificationStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "rejected"
  | "resubmission_required";

export type VerificationAction =
  | "approve"
  | "reject"
  | "request_resubmission"
  | "mark_under_review";

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: "Pending Review",
  under_review: "Under Review",
  verified: "Approved",
  rejected: "Rejected",
  resubmission_required: "Resubmission Required"
};

export const VERIFICATION_STATUS_BADGE_CLASSES: Record<VerificationStatus, string> = {
  pending: "bg-warning-bg text-warning border-warning-border",
  under_review: "bg-info-bg text-info border-info-border",
  verified: "bg-success-bg text-success border-success-border",
  rejected: "bg-error-bg text-error border-error-border",
  resubmission_required: "bg-warning-bg text-warning border-warning-border"
};

export const VERIFICATION_PROGRESS_STEPS: {
  key: VerificationStatus;
  label: string;
}[] = [
  { key: "pending", label: "Submitted" },
  { key: "under_review", label: "Reviewing" },
  { key: "verified", label: "Approved" }
];

export function getVerificationProgressIndex(status: VerificationStatus): number {
  if (status === "verified") return 2;
  if (status === "under_review") return 1;
  if (status === "pending") return 0;
  if (status === "resubmission_required" || status === "rejected") return 0;
  return 0;
}

export function getVerificationNotificationContent(
  newStatus: VerificationStatus,
  rejectionReason?: string | null
): { title: string; body: string; type: string } {
  switch (newStatus) {
    case "verified":
      return {
        type: "verification_approved",
        title: "Verification approved",
        body:
          "Congratulations! Your account has been successfully verified. You now have full access to all platform features."
      };
    case "rejected":
      return {
        type: "verification_rejected",
        title: "Verification not approved",
        body: rejectionReason
          ? `Unfortunately, your verification request was not approved. Reason: ${rejectionReason}. Please review the reason provided and submit updated documents for review.`
          : "Unfortunately, your verification request was not approved. Please review the reason provided and submit updated documents for review."
      };
    case "resubmission_required":
      return {
        type: "verification_resubmission_required",
        title: "Additional documents required",
        body: rejectionReason
          ? `We need additional information before we can approve your account. ${rejectionReason} Please update your documents and resubmit for review.`
          : "We need additional information before we can approve your account. Please update your documents and resubmit for review."
      };
    case "under_review":
      return {
        type: "verification_under_review",
        title: "Verification under review",
        body: "An administrator is now reviewing your verification documents. We will notify you once a decision has been made."
      };
    default:
      return {
        type: "verification_pending",
        title: "Verification submitted",
        body: "Your documents have been submitted and are waiting for review. This usually takes 1–3 business days."
      };
  }
}

export function actionToStatus(action: VerificationAction): VerificationStatus {
  switch (action) {
    case "approve":
      return "verified";
    case "reject":
      return "rejected";
    case "request_resubmission":
      return "resubmission_required";
    case "mark_under_review":
      return "under_review";
  }
}

export const ACTIVE_VERIFICATION_STATUSES: VerificationStatus[] = ["pending", "under_review"];

export function isVerifiedProvider(status: VerificationStatus): boolean {
  return status === "verified";
}
