"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const FAMILY_REASONS = [
  "Schedule changed",
  "Found another nurse",
  "Patient condition changed",
  "Booking made by mistake",
  "Other"
];

const NURSE_REASONS = [
  "Schedule conflict",
  "Personal emergency",
  "Patient needs exceed my scope",
  "Other"
];

interface CancelBookingButtonProps {
  bookingId: string;
  cancelledBy: "family" | "nurse";
  onCancelled: () => void;
}

export function CancelBookingButton({ bookingId, cancelledBy, onCancelled }: CancelBookingButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const reasons = cancelledBy === "family" ? FAMILY_REASONS : NURSE_REASONS;

  async function confirmCancel() {
    const finalReason = reason === "Other" ? customReason.trim() : reason;
    if (!finalReason) return;
    setLoading(true);
    const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancelledBy, reason: finalReason })
    });
    setLoading(false);
    if (response.ok) {
      setOpen(false);
      onCancelled();
    }
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Cancel booking
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-navy-900">Cancel booking?</h3>
            <p className="mt-2 text-sm text-slate-600">This action cannot be undone.</p>
            <div className="mt-4 space-y-3">
              <Select value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="">Select a reason</option>
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
              {reason === "Other" ? (
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Please specify"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                />
              ) : null}
            </div>
            <div className="mt-4 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Keep booking
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void confirmCancel()}
                disabled={loading || !reason || (reason === "Other" && !customReason.trim())}
              >
                Confirm cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
