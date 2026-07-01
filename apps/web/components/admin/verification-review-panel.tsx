"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/admin/use-toast";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import { DocumentViewer } from "@/components/admin/document-viewer";
import { Badge } from "@/components/ui/badge";
import { VerificationDocumentStatus } from "@/components/admin/verification-document-status";
import { VerifyNurseDialog } from "@/components/admin/verify-nurse-dialog";
import { RejectNurseDialog } from "@/components/admin/reject-nurse-dialog";
import {
  getDocumentSlots,
  getMissingDocumentsTooltip,
  hasRequiredDocuments
} from "@/lib/admin/verification-documents";
import {
  getProfileCompletenessFields,
  isProfileComplete
} from "@/lib/admin/nurse-profile-completeness";
import type { VerificationStatus } from "@/lib/verification";

interface AuditLogEntry {
  id: string;
  action: string;
  previous_status: string | null;
  new_status: string;
  rejection_reason: string | null;
  review_notes: string | null;
  created_at: string;
  admin_name: string;
}

interface VerificationReviewPanelProps {
  nurseId: string;
  fullName: string;
  providerType: string;
  city: string | null;
  region: string | null;
  barangay: string | null;
  phone: string | null;
  submittedAt: string | null;
  status: VerificationStatus;
  prcDocumentUrl: string | null;
  tesdaDocumentUrl: string | null;
  nbiDocumentUrl: string | null;
  prcSignedUrl: string | null;
  tesdaSignedUrl: string | null;
  nbiSignedUrl: string | null;
  bio: string | null;
  specializations: string[] | null;
  dailyRateRange: string | null;
  hourlyRateRange: string | null;
  profilePhotoUrl: string | null;
  prcLicenseNo?: string | null;
  tesdaCertificateNo?: string | null;
  prcLicenseExpiry?: string | null;
  tesdaCertExpiry?: string | null;
  nbiExpiry?: string | null;
  auditLogs: AuditLogEntry[];
}

interface ActionErrorState {
  heading: string;
  message: string;
  timestamp: string;
  action:
    | "approve"
    | "reject"
    | "reject_renewal"
    | "request_resubmission"
    | "mark_under_review"
    | "resend_status_email";
}

export function VerificationReviewPanel({
  nurseId,
  fullName,
  providerType,
  city,
  region,
  barangay,
  phone,
  submittedAt,
  status,
  prcDocumentUrl,
  tesdaDocumentUrl,
  nbiDocumentUrl,
  prcSignedUrl,
  tesdaSignedUrl,
  nbiSignedUrl,
  bio,
  specializations,
  dailyRateRange,
  hourlyRateRange,
  profilePhotoUrl,
  prcLicenseNo,
  tesdaCertificateNo,
  prcLicenseExpiry: initialPrcExpiry,
  tesdaCertExpiry: initialTesdaExpiry,
  nbiExpiry: initialNbiExpiry,
  auditLogs
}: VerificationReviewPanelProps) {
  const router = useRouter();
  const { showToast, Toast } = useToast();
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionDetails, setRejectionDetails] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | "reject_renewal" | "request_resubmission" | "mark_under_review" | null
  >(null);
  const [prcLicenseExpiry, setPrcLicenseExpiry] = useState(initialPrcExpiry?.slice(0, 10) ?? "");
  const [tesdaCertExpiry, setTesdaCertExpiry] = useState(initialTesdaExpiry?.slice(0, 10) ?? "");
  const [nbiExpiry, setNbiExpiry] = useState(initialNbiExpiry?.slice(0, 10) ?? "");
  const [actionError, setActionError] = useState<ActionErrorState | null>(null);
  const [resendingStatusEmail, setResendingStatusEmail] = useState(false);
  const [resendStatusMessage, setResendStatusMessage] = useState<string | null>(null);

  const nurseDocuments = useMemo(
    () => ({
      provider_type: providerType,
      prc_document_url: prcDocumentUrl,
      tesda_document_url: tesdaDocumentUrl,
      nbi_document_url: nbiDocumentUrl,
      prc_license_expiry: prcLicenseExpiry || initialPrcExpiry,
      tesda_cert_expiry: tesdaCertExpiry || initialTesdaExpiry,
      nbi_expiry: nbiExpiry || initialNbiExpiry
    }),
    [
      providerType,
      prcDocumentUrl,
      tesdaDocumentUrl,
      nbiDocumentUrl,
      prcLicenseExpiry,
      tesdaCertExpiry,
      nbiExpiry,
      initialPrcExpiry,
      initialTesdaExpiry,
      initialNbiExpiry
    ]
  );

  const documentSlots = useMemo(() => getDocumentSlots(nurseDocuments), [nurseDocuments]);
  const documentsReady = hasRequiredDocuments(nurseDocuments);
  const verifyTooltip = getMissingDocumentsTooltip(nurseDocuments);
  const profileComplete = isProfileComplete({
    bio,
    specializations,
    daily_rate_range: dailyRateRange,
    hourly_rate_range: hourlyRateRange,
    profile_photo_url: profilePhotoUrl,
    profiles: { city, region, profile_photo_url: profilePhotoUrl }
  });
  const completenessFields = getProfileCompletenessFields({
    bio,
    specializations,
    daily_rate_range: dailyRateRange,
    hourly_rate_range: hourlyRateRange,
    profile_photo_url: profilePhotoUrl,
    profiles: { city, region, profile_photo_url: profilePhotoUrl }
  });

  function setPersistentActionError(
    action: ActionErrorState["action"],
    message: string,
    heading = "Action failed"
  ) {
    const timestamp = new Date().toISOString();
    const errorRecord: ActionErrorState = {
      action,
      heading,
      message,
      timestamp
    };
    setActionError(errorRecord);
    console.error("admin.verification.action_error", errorRecord);
  }

  async function copyActionError() {
    if (!actionError) return;
    const details = [
      actionError.heading,
      `Action: ${actionError.action}`,
      `Timestamp: ${new Date(actionError.timestamp).toLocaleString()}`,
      `Message: ${actionError.message}`
    ].join("\n");

    try {
      await navigator.clipboard.writeText(details);
      showToast("Error details copied.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Clipboard copy failed.";
      showToast(`Could not copy error details: ${message}`, "error", { durationMs: 8000 });
      console.error("admin.verification.copy_error_failed", {
        timestamp: new Date().toISOString(),
        message
      });
    }
  }

  async function resendStatusEmail() {
    setResendingStatusEmail(true);
    setResendStatusMessage(null);
    setActionError(null);

    try {
      const response = await fetch("/api/admin/resend-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nurseId })
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        const message = payload.error ?? "Failed to resend status email.";
        setPersistentActionError("resend_status_email", message);
        showToast(message, "error", { durationMs: 8000 });
        return;
      }

      const message = payload.message ?? "Verification status email resent successfully.";
      setResendStatusMessage(message);
      showToast(message, "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error while resending status email.";
      setPersistentActionError("resend_status_email", message);
      showToast(message, "error", { durationMs: 8000 });
    } finally {
      setResendingStatusEmail(false);
    }
  }

  async function submitAction(
    action: "approve" | "reject" | "reject_renewal" | "request_resubmission" | "mark_under_review"
  ) {
    setLoading(true);
    setActionError(null);
    setResendStatusMessage(null);
    try {
      const response = await fetch("/api/admin/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nurseId,
          action,
          rejectionReason:
            action === "reject" || action === "request_resubmission" || action === "reject_renewal"
              ? rejectionReason.trim() || undefined
              : undefined,
          reviewNotes:
            action === "approve"
              ? verificationNotes.trim() || undefined
              : action === "reject"
                ? rejectionDetails.trim() || undefined
                : reviewNotes.trim() || undefined,
          ...(action === "approve"
            ? {
                prcLicenseExpiry: prcLicenseExpiry || undefined,
                tesdaCertExpiry: tesdaCertExpiry || undefined,
                nbiExpiry: nbiExpiry || undefined
              }
            : {})
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        result?: "success" | "partial_success";
        message?: string;
        emailSent?: boolean;
        emailError?: string;
        emailStage?: "template" | "delivery" | "missing_recipient";
      };

      if (!response.ok) {
        const message = payload.error ?? "Action failed.";
        setPersistentActionError(action, message);
        showToast(message, "error", { durationMs: 8000 });
        return;
      }

      const partialSuccess = payload.result === "partial_success";

      if (partialSuccess) {
        const partialMessage =
          payload.message ??
          "Verification status updated successfully, but the notification email could not be sent. Please notify the nurse manually or try resending from the nurse detail page.";
        showToast(partialMessage, "error", { durationMs: 8000 });
      } else if (action === "approve") {
        showToast("Nurse verified successfully. Email notification sent.", "success");
      } else if (action === "reject") {
        showToast("Verification rejected. Nurse has been notified.", "success");
      } else if (action === "mark_under_review") {
        showToast("Nurse marked under review. Email notification sent.", "success");
      } else if (action === "reject_renewal") {
        showToast("Renewal rejected. Current verified status remains active.", "success");
      } else {
        showToast("Resubmission requested. Nurse has been notified.", "success");
      }

      setConfirmAction(null);
      if (partialSuccess) {
        router.refresh();
        return;
      }

      router.push("/admin/verifications");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error while updating verification.";
      setPersistentActionError(action, message);
      showToast(message, "error", { durationMs: 8000 });
    } finally {
      setLoading(false);
    }
  }

  const isCaregiver = providerType === "caregiver";
  const canReview = ["pending", "under_review", "resubmission_required"].includes(status);
  const canReviewRenewal = status === "renewal_under_review";
  const canVerify =
    documentsReady &&
    Boolean(nbiExpiry) &&
    (isCaregiver ? Boolean(tesdaCertExpiry) : Boolean(prcLicenseExpiry));
  const canResendStatusEmail =
    status === "verified" || status === "under_review" || status === "renewal_under_review";

  return (
    <>
      {Toast}
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">{fullName}</h2>
              <VerificationStatusBadge status={status} />
              <Badge className={isCaregiver ? "bg-amber-100 text-amber-800" : "bg-brand-100 text-brand-800"}>
                {isCaregiver ? "Caregiver" : "Nurse"}
              </Badge>
              <Badge
                className={
                  profileComplete
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }
              >
                {profileComplete ? "Profile complete" : "Profile incomplete"}
              </Badge>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Region</dt>
                <dd className="font-medium text-slate-900">{region ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">City</dt>
                <dd className="font-medium text-slate-900">{city ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Barangay</dt>
                <dd className="font-medium text-slate-900">{barangay ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-medium text-slate-900">{phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Submitted</dt>
                <dd className="font-medium text-slate-900">
                  {submittedAt ? new Date(submittedAt).toLocaleString() : "—"}
                </dd>
              </div>
            </dl>
          </div>

          {canReview || canReviewRenewal ? (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">Review actions</h3>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">
                  Internal review notes for resubmission requests (optional)
                </label>
                <Textarea
                  placeholder="Visible to administrators in the audit log only"
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {status === "pending" ? (
                  <Button type="button" variant="outline" onClick={() => setConfirmAction("mark_under_review")}>
                    Mark under review
                  </Button>
                ) : null}
                <span title={!documentsReady ? verifyTooltip ?? undefined : undefined}>
                  <Button
                    type="button"
                    onClick={() => setConfirmAction("approve")}
                    disabled={!canVerify}
                    className={!canVerify ? "pointer-events-auto" : undefined}
                  >
                    {canReviewRenewal ? "Approve renewal" : "Verify"}
                  </Button>
                </span>
                {canReviewRenewal ? (
                  <Button type="button" variant="outline" onClick={() => setConfirmAction("reject_renewal")}>
                    Reject renewal
                  </Button>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={() => setConfirmAction("request_resubmission")}>
                      Request resubmission
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setConfirmAction("reject")}>
                      Reject
                    </Button>
                  </>
                )}
              </div>
              {!documentsReady && verifyTooltip ? (
                <p className="text-xs text-rose-700">{verifyTooltip}</p>
              ) : null}
              {actionError ? (
                <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-rose-700" />
                      <div>
                        <p className="text-sm font-semibold text-rose-900">{actionError.heading}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-rose-800">{actionError.message}</p>
                        <p className="mt-2 text-xs text-rose-700">
                          {new Date(actionError.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setActionError(null)}
                      aria-label="Dismiss action error"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => void copyActionError()}>
                      <Copy className="mr-1 h-4 w-4" />
                      Copy error
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setActionError(null)}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {canResendStatusEmail ? (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">Status email</h3>
              <p className="text-xs text-slate-600">
                Send the latest verification status email again to the applicant.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void resendStatusEmail()}
                disabled={resendingStatusEmail}
              >
                {resendingStatusEmail ? "Sending..." : "Resend status email"}
              </Button>
              {resendStatusMessage ? (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {resendStatusMessage}
                </p>
              ) : null}
              {!canReview && actionError ? (
                <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-rose-700" />
                      <div>
                        <p className="text-sm font-semibold text-rose-900">{actionError.heading}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-rose-800">{actionError.message}</p>
                        <p className="mt-2 text-xs text-rose-700">
                          {new Date(actionError.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setActionError(null)}
                      aria-label="Dismiss action error"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => void copyActionError()}>
                      <Copy className="mr-1 h-4 w-4" />
                      Copy error
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setActionError(null)}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Document status</h3>
            <p className="mt-1 text-xs text-slate-500">
              Required documents must be uploaded before verification can be completed.
            </p>
            <div className="mt-3">
              <VerificationDocumentStatus nurse={nurseDocuments} />
            </div>
            {!profileComplete ? (
              <p className="mt-3 text-xs text-slate-600">
                This nurse&apos;s profile is incomplete. They will be prompted to complete it after
                verification.
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Profile completeness</h3>
            <ul className="mt-3 space-y-2">
              {completenessFields.map((field) => (
                <li key={field.key} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{field.label}</span>
                  <span
                    className={
                      field.complete ? "font-medium text-emerald-700" : "font-medium text-amber-700"
                    }
                  >
                    {field.complete ? "Filled" : "Empty"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Document preview</h3>
            <p className="mt-1 text-xs text-slate-500">
              Enter each document&apos;s expiry date as printed on the certificate before verifying.
            </p>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              {isCaregiver ? (
                <div className="space-y-2">
                  <DocumentViewer label="TESDA NC II Certificate" url={tesdaSignedUrl} />
                  {tesdaCertificateNo ? (
                    <p className="text-xs text-slate-600">
                      Entered TESDA Certificate Number:{" "}
                      <span className="font-medium text-slate-900">{tesdaCertificateNo}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-amber-700">No TESDA certificate number entered.</p>
                  )}
                  <label className="block text-xs font-medium text-slate-600">
                    TESDA expiry date <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    type="date"
                    value={tesdaCertExpiry}
                    onChange={(e) => setTesdaCertExpiry(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <DocumentViewer label="PRC License" url={prcSignedUrl} />
                  {prcLicenseNo ? (
                    <p className="text-xs text-slate-600">
                      Entered PRC License Number:{" "}
                      <span className="font-medium text-slate-900">{prcLicenseNo}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-amber-700">No PRC license number entered.</p>
                  )}
                  <label className="block text-xs font-medium text-slate-600">
                    PRC license expiry date <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    type="date"
                    value={prcLicenseExpiry}
                    onChange={(e) => setPrcLicenseExpiry(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <DocumentViewer label="NBI Clearance" url={nbiSignedUrl} />
                <label className="block text-xs font-medium text-slate-600">
                  NBI clearance expiry date <span className="text-rose-600">*</span>
                </label>
                <Input type="date" value={nbiExpiry} onChange={(e) => setNbiExpiry(e.target.value)} />
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Activity log</h3>
        {auditLogs.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No review activity recorded yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {auditLogs.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{entry.admin_name}</span>
                  <span className="text-slate-500">{new Date(entry.created_at).toLocaleString()}</span>
                  <VerificationStatusBadge status={entry.new_status as VerificationStatus} />
                </div>
                <p className="mt-1 text-slate-600">
                  {entry.previous_status ?? "none"} → {entry.new_status} ({entry.action})
                </p>
                {entry.rejection_reason ? (
                  <p className="mt-1 text-xs text-rose-700">Reason: {entry.rejection_reason}</p>
                ) : null}
                {entry.review_notes ? (
                  <p className="mt-1 text-xs text-slate-500">Notes: {entry.review_notes}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <VerifyNurseDialog
        open={confirmAction === "approve"}
        fullName={fullName}
        providerType={providerType}
        reviewedDocuments={documentSlots}
        verificationNotes={verificationNotes}
        onVerificationNotesChange={setVerificationNotes}
        loading={loading}
        onConfirm={() => (canVerify ? void submitAction("approve") : undefined)}
        onCancel={() => setConfirmAction(null)}
      />

      <RejectNurseDialog
        open={confirmAction === "reject" || confirmAction === "reject_renewal"}
        fullName={fullName}
        reason={rejectionReason}
        details={rejectionDetails}
        onReasonChange={setRejectionReason}
        onDetailsChange={setRejectionDetails}
        loading={loading}
        onConfirm={() => {
          if (!rejectionReason) return;
          if (rejectionReason === "Other" && rejectionDetails.trim().length < 5) return;
          void submitAction(confirmAction === "reject_renewal" ? "reject_renewal" : "reject");
        }}
        onCancel={() => setConfirmAction(null)}
      />

      {confirmAction === "request_resubmission" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Request document resubmission?</h2>
            <p className="mt-2 text-sm text-slate-600">
              The applicant will be asked to upload updated documents and resubmit for review.
            </p>
            <div className="mt-4 space-y-2">
              <Textarea
                placeholder="Reason for resubmission request"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirmAction(null)} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void submitAction("request_resubmission")}
                disabled={loading || rejectionReason.trim().length < 5}
              >
                Request resubmission
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmAction === "mark_under_review" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Mark as under review?</h2>
            <p className="mt-2 text-sm text-slate-600">
              The applicant will be notified that an administrator is reviewing their documents.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirmAction(null)} disabled={loading}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void submitAction("mark_under_review")} disabled={loading}>
                Mark under review
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
