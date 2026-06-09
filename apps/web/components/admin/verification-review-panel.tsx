"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useToast } from "@/components/admin/use-toast";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import { DocumentViewer } from "@/components/admin/document-viewer";
import { Badge } from "@/components/ui/badge";
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
  prcSignedUrl: string | null;
  tesdaSignedUrl: string | null;
  nbiSignedUrl: string | null;
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
  prcSignedUrl,
  tesdaSignedUrl,
  nbiSignedUrl,
  prcLicenseExpiry: initialPrcExpiry,
  tesdaCertExpiry: initialTesdaExpiry,
  nbiExpiry: initialNbiExpiry,
  auditLogs
}: VerificationReviewPanelProps) {
  const router = useRouter();
  const { showToast, Toast } = useToast();
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | "request_resubmission" | "mark_under_review" | null
  >(null);
  const [prcLicenseExpiry, setPrcLicenseExpiry] = useState(initialPrcExpiry?.slice(0, 10) ?? "");
  const [tesdaCertExpiry, setTesdaCertExpiry] = useState(initialTesdaExpiry?.slice(0, 10) ?? "");
  const [nbiExpiry, setNbiExpiry] = useState(initialNbiExpiry?.slice(0, 10) ?? "");

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
          rejectionReason: rejectionReason.trim() || undefined,
          reviewNotes: reviewNotes.trim() || undefined,
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

      const emailNote =
        payload.emailSent === false && payload.emailError
          ? ` In-app notification saved, but email failed: ${payload.emailError}`
          : payload.emailSent
            ? " Email notification sent."
            : "";

      showToast(`Verification updated successfully.${emailNote}`, "success");
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
  const canApprove =
    Boolean(nbiExpiry) && (isCaregiver ? Boolean(tesdaCertExpiry) : Boolean(prcLicenseExpiry));

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
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Review actions</h3>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">
                  Reason for rejection / resubmission request
                </label>
                <Textarea
                  placeholder="Required when rejecting or requesting resubmission"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Internal review notes (optional)</label>
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
                <Button type="button" onClick={() => setConfirmAction("approve")} disabled={!canApprove}>
                  Approve
                </Button>
                <Button type="button" variant="outline" onClick={() => setConfirmAction("request_resubmission")}>
                  Request resubmission
                </Button>
                <Button type="button" variant="outline" onClick={() => setConfirmAction("reject")}>
                  Reject
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Uploaded documents</h3>
          <p className="text-xs text-slate-500">
            Enter each document&apos;s expiry date as printed on the certificate before approving.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {isCaregiver ? (
              <div className="space-y-2">
                <DocumentViewer label="TESDA NC II Certificate" url={tesdaSignedUrl} />
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

      <ConfirmDialog
        open={confirmAction === "approve"}
        title="Approve this application?"
        description="Document expiry dates will be saved and used for renewal reminders. The applicant will be verified and notified."
        confirmLabel="Approve"
        loading={loading}
        onConfirm={() => (canApprove ? submitAction("approve") : undefined)}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === "reject"}
        title="Reject this application?"
        description="The applicant will be notified with your rejection reason. This action requires a reason."
        confirmLabel="Reject"
        destructive
        loading={loading}
        onConfirm={() => submitAction("reject")}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === "request_resubmission"}
        title="Request document resubmission?"
        description="The applicant will be asked to upload updated documents and resubmit for review."
        confirmLabel="Request resubmission"
        loading={loading}
        onConfirm={() => submitAction("request_resubmission")}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === "mark_under_review"}
        title="Mark as under review?"
        description="The applicant will be notified that an administrator is reviewing their documents."
        confirmLabel="Mark under review"
        loading={loading}
        onConfirm={() => submitAction("mark_under_review")}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}
