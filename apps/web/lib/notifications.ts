export type NotificationType =
  | "verification_approved"
  | "verification_rejected"
  | "verification_renewal_rejected"
  | "verification_resubmission_required"
  | "verification_under_review"
  | "verification_renewal_under_review"
  | "verification_pending"
  | "booking_accepted"
  | "booking_declined"
  | "new_message"
  | "booking_reminder"
  | "review_prompt"
  | "license_expired"
  | "license_expiring"
  | "general";

const CRITICAL_NOTIFICATION_TYPES = new Set<NotificationType>([
  "verification_approved",
  "verification_rejected",
  "verification_renewal_rejected",
  "verification_resubmission_required",
  "booking_accepted",
  "booking_declined",
  "review_prompt",
  "license_expired",
  "license_expiring"
]);

export function shouldAutoDismissNotification(type: string): boolean {
  return !CRITICAL_NOTIFICATION_TYPES.has(type as NotificationType);
}

export const AUTO_DISMISS_MS = 8000;
export const FADE_OUT_MS = 400;
