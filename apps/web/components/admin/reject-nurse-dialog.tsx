"use client";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/components/ui/loading-button";

export const REJECTION_REASON_OPTIONS = [
  "Document not readable or too blurry",
  "Document appears to be expired",
  "Document does not match the nurse's name",
  "Suspected fraudulent document",
  "Wrong document type uploaded",
  "NBI clearance missing",
  "Other"
] as const;

interface RejectNurseDialogProps {
  open: boolean;
  fullName: string;
  reason: string;
  details: string;
  onReasonChange: (value: string) => void;
  onDetailsChange: (value: string) => void;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RejectNurseDialog({
  open,
  fullName,
  reason,
  details,
  onReasonChange,
  onDetailsChange,
  loading,
  onConfirm,
  onCancel
}: RejectNurseDialogProps) {
  if (!open) return null;

  const requiresDetails = reason === "Other";
  const canConfirm = Boolean(reason) && (!requiresDetails || details.trim().length >= 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">Reject verification request?</h2>
        <p className="mt-2 text-sm text-slate-600">{fullName}</p>

        <div className="mt-4 space-y-2">
          <label className="text-xs font-medium text-slate-600">
            Rejection reason <span className="text-rose-600">*</span>
          </label>
          <Select value={reason} onChange={(event) => onReasonChange(event.target.value)}>
            <option value="">Select a reason</option>
            {REJECTION_REASON_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-xs font-medium text-slate-600">
            Additional details {requiresDetails ? <span className="text-rose-600">*</span> : "(optional)"}
          </label>
          <Textarea
            placeholder="Explain what the nurse should fix before resubmitting"
            value={details}
            onChange={(event) => onDetailsChange(event.target.value)}
            rows={4}
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <LoadingButton
            type="button"
            variant="destructive"
            loading={loading}
            loadingText="Rejecting..."
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            Confirm rejection
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}
