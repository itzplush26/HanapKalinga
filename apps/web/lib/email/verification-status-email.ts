import {
  buildVerificationApprovedEmailHtml,
  buildVerificationApprovedEmailText,
  VERIFICATION_APPROVED_SUBJECT
} from "@/lib/email/verification-approved-email";
import {
  buildVerificationRejectedEmailHtml,
  buildVerificationRejectedEmailText,
  VERIFICATION_REJECTED_SUBJECT
} from "@/lib/email/templates/verification-rejected";
import {
  buildVerificationResubmissionEmailHtml,
  buildVerificationResubmissionEmailText,
  VERIFICATION_RESUBMISSION_SUBJECT
} from "@/lib/email/templates/verification-resubmission-required";
import {
  buildVerificationUnderReviewEmailHtml,
  buildVerificationUnderReviewEmailText,
  VERIFICATION_UNDER_REVIEW_SUBJECT
} from "@/lib/email/templates/verification-under-review";
import type { VerificationStatus } from "@/lib/verification";

interface VerificationStatusEmailParams {
  status: VerificationStatus;
  firstName: string;
  notificationTitle: string;
  notificationBody: string;
  reason?: string | null;
  details?: string | null;
}

export interface VerificationStatusEmailPayload {
  subject: string;
  html: string;
  text: string;
}

export function buildVerificationStatusEmailPayload(
  params: VerificationStatusEmailParams
): VerificationStatusEmailPayload {
  const firstName = params.firstName.trim() || "there";
  const reason = params.reason?.trim() ?? "";
  const details = params.details?.trim() || null;

  if (params.status === "verified") {
    return {
      subject: VERIFICATION_APPROVED_SUBJECT,
      html: buildVerificationApprovedEmailHtml(firstName),
      text: buildVerificationApprovedEmailText(firstName)
    };
  }

  if (params.status === "under_review") {
    return {
      subject: VERIFICATION_UNDER_REVIEW_SUBJECT,
      html: buildVerificationUnderReviewEmailHtml(firstName),
      text: buildVerificationUnderReviewEmailText(firstName)
    };
  }

  if (params.status === "renewal_under_review") {
    return {
      subject: "Renewal documents under review",
      html: `<p>Hi ${firstName},</p><p>We received your renewed document submission and it is now under review.</p><p>Your verified status remains active while we review your renewal.</p>`,
      text: `Hi ${firstName},\n\nWe received your renewed document submission and it is now under review.\n\nYour verified status remains active while we review your renewal.`
    };
  }

  if (params.status === "resubmission_required") {
    if (reason.length < 5) {
      throw new Error("Resubmission emails require a reason with at least 5 characters.");
    }

    return {
      subject: VERIFICATION_RESUBMISSION_SUBJECT,
      html: buildVerificationResubmissionEmailHtml({
        firstName,
        reason,
        details
      }),
      text: buildVerificationResubmissionEmailText({
        firstName,
        reason,
        details
      })
    };
  }

  if (params.status === "rejected") {
    if (reason.length < 5) {
      throw new Error("Rejection emails require a reason with at least 5 characters.");
    }

    return {
      subject: VERIFICATION_REJECTED_SUBJECT,
      html: buildVerificationRejectedEmailHtml({
        firstName,
        reason,
        details
      }),
      text: buildVerificationRejectedEmailText({
        firstName,
        reason,
        details
      })
    };
  }

  return {
    subject: `[HanapKalinga] ${params.notificationTitle}`,
    html: `<p>${params.notificationBody}</p>`,
    text: params.notificationBody
  };
}
