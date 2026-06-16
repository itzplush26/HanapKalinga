"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/components/ui/loading-button";
import type { DocumentSlot } from "@/lib/admin/verification-documents";

interface VerifyNurseDialogProps {
  open: boolean;
  fullName: string;
  providerType: string;
  reviewedDocuments: DocumentSlot[];
  verificationNotes: string;
  onVerificationNotesChange: (value: string) => void;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function VerifyNurseDialog({
  open,
  fullName,
  providerType,
  reviewedDocuments,
  verificationNotes,
  onVerificationNotesChange,
  loading,
  onConfirm,
  onCancel
}: VerifyNurseDialogProps) {
  if (!open) return null;

  const providerLabel = providerType === "caregiver" ? "Caregiver" : "Nurse";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">Verify this nurse?</h2>
        <p className="mt-2 text-sm text-slate-600">
          {fullName} · {providerLabel}
        </p>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Documents reviewed</p>
          <ul className="mt-2 space-y-2">
            {reviewedDocuments
              .filter((slot) => slot.state === "uploaded" || slot.state === "expired")
              .map((slot) => (
                <li key={slot.key} className="flex items-center gap-2 text-sm text-slate-800">
                  <Check className="h-4 w-4 text-emerald-600" />
                  {slot.label}
                </li>
              ))}
          </ul>
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-xs font-medium text-slate-600">Verification notes (optional)</label>
          <Textarea
            placeholder="Internal notes — for example license expiry observations"
            value={verificationNotes}
            onChange={(event) => onVerificationNotesChange(event.target.value)}
            rows={3}
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <LoadingButton
            type="button"
            loading={loading}
            loadingText="Verifying..."
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={onConfirm}
          >
            Confirm verification
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}
