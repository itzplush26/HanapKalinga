"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
    "approve" | "reject" | "request_resubmission" | "mark_under_review" | null
  >(null);
  const [prcLicenseExpiry, setPrcLicenseExpiry] = useState(initialPrcExpiry?.slice(0, 10) ?? "");
  const [tesdaCertExpiry, setTesdaCertExpiry] = useState(initialTesdaExpiry?.slice(0, 10) ?? "");
  const [nbiExpiry, setNbiExpiry] = useState(initialNbiExpiry?.slice(0, 10) ?? "");

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

  async function submitAction(
    action: "approve" | "reject" | "request_resubmission" | "mark_under_review"
  ) {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nurseId,
          action,
          rejectionReason:
            action === "reject" || action === "request_resubmission"
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
        emailSent?: boolean;
        emailError?: string;
      };

      if (!response.ok) {
        showToast(payload.error ?? "Action failed.", "error");
        return;
      }

      if (action === "approve") {
        showToast(
          payload.emailSent === false && payload.emailError
            ? `Nurse verified successfully. Email failed: ${payload.emailError}`
            : "Nurse verified successfully. Email notification sent.",
          payload.emailSent === false ? "error" : "success"
        );
      } else if (action === "reject") {
        showToast("Verification rejected. Nurse has been notified.", "success");
      } else {
        const emailNote =
          payload.emailSent === false && payload.emailError
            ? ` In-app notification saved, but email failed: ${payload.emailError}`
            : payload.emailSent
              ? " Email notification sent."
              : "";
        showToast(`Verification updated successfully.${emailNote}`, "success");
      }

      setConfirmAction(null);
      router.push("/admin/verifications");
      router.refresh();
    } catch {
      showToast("Unexpected error while updating verification.", "error");
    } finally {
      setLoading(false);
    }
  }

  const isCaregiver = providerType === "caregiver";
  const canReview = ["pending", "under_review", "resubmission_required"].includes(status);
  const canVerify =
    documentsReady &&
    Boolean(nbiExpiry) &&
    (isCaregiver ? Boolean(tesdaCertExpiry) : Boolean(prcLicenseExpiry));

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

          {canReview ? (
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
                    Verify
                  </Button>
                </span>
                <Button type="button" variant="outline" onClick={() => setConfirmAction("request_resubmission")}>
                  Request resubmission
                </Button>
                <Button type="button" variant="outline" onClick={() => setConfirmAction("reject")}>
                  Reject
                </Button>
              </div>
              {!documentsReady && verifyTooltip ? (
                <p className="text-xs text-rose-700">{verifyTooltip}</p>
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
        open={confirmAction === "reject"}
        fullName={fullName}
        reason={rejectionReason}
        details={rejectionDetails}
        onReasonChange={setRejectionReason}
        onDetailsChange={setRejectionDetails}
        loading={loading}
        onConfirm={() => {
          if (!rejectionReason) return;
          if (rejectionReason === "Other" && rejectionDetails.trim().length < 5) return;
          void submitAction("reject");
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
