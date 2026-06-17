"use client";

import { useState } from "react";
import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORT_EMAIL } from "@/lib/constants";

interface NurseMarkCompleteProps {
  bookingId: string;
  onUpdated: () => void;
}

export function NurseMarkCompleteButton({ bookingId, onUpdated }: NurseMarkCompleteProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function markComplete() {
    setLoading(true);
    const response = await fetch(`/api/bookings/${bookingId}/mark-complete`, { method: "POST" });
    setLoading(false);
    if (response.ok) {
      setDone(true);
      onUpdated();
    }
  }

  if (done) {
    return (
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
        You have marked this shift as complete. The family has 24 hours to confirm.
      </p>
    );
  }

  return (
    <LoadingButton type="button" loading={loading} loadingText="Submitting..." onClick={() => void markComplete()}>
      Mark shift complete
    </LoadingButton>
  );
}

interface FamilyCompletionActionsProps {
  bookingId: string;
  onUpdated: () => void;
}

export function FamilyCompletionActions({ bookingId, onUpdated }: FamilyCompletionActionsProps) {
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    const response = await fetch(`/api/bookings/${bookingId}/confirm-completion`, { method: "POST" });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setLoading(false);
    if (response.ok) {
      onUpdated();
      return;
    }
    setMessage(payload?.error ?? `Could not confirm completion. Contact ${SUPPORT_EMAIL}.`);
  }

  async function dispute() {
    if (description.trim().length < 10) return;
    setLoading(true);
    const response = await fetch(`/api/bookings/${bookingId}/dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: description.trim() })
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setLoading(false);
    if (response.ok) {
      setDisputeOpen(false);
      setMessage("Your dispute has been submitted. Admin will review within 24 hours.");
      onUpdated();
      return;
    }
    const backendError = payload?.error ?? "";
    if (backendError.toLowerCase().includes("already been marked as complete")) {
      setMessage(
        `The booking has already been marked as complete. Please contact ${SUPPORT_EMAIL} to raise a dispute after completion.`
      );
    } else {
      setMessage(backendError || `Could not submit dispute. Contact ${SUPPORT_EMAIL}.`);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-navy-900">The nurse marked this shift complete. Please confirm.</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => void confirm()} disabled={loading}>
          Confirm shift complete
        </Button>
        <Button type="button" variant="destructive" onClick={() => setDisputeOpen(true)} disabled={loading}>
          Dispute
        </Button>
      </div>
      {disputeOpen ? (
        <div className="space-y-2 border-t border-slate-200 pt-3">
          <Textarea
            placeholder="Describe the issue (required)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <Button type="button" variant="destructive" size="sm" onClick={() => void dispute()} disabled={loading}>
            Submit dispute
          </Button>
        </div>
      ) : null}
      {message ? <p className="text-sm text-amber-900">{message}</p> : null}
    </div>
  );
}
