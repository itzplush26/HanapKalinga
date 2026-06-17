"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Textarea } from "@/components/ui/textarea";

interface SuspensionControlsProps {
  userId: string;
  fullName: string;
  suspended: boolean;
  suspensionReason?: string | null;
  onUpdated?: (nextSuspended: boolean) => void;
}

export function SuspensionControls({
  userId,
  fullName,
  suspended,
  suspensionReason,
  onUpdated
}: SuspensionControlsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(nextSuspended: boolean) {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/admin/suspend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        suspended: nextSuspended,
        reason: nextSuspended ? reason.trim() : undefined
      })
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setLoading(false);

    if (!response.ok) {
      setError(payload?.error ?? "Could not update suspension status.");
      return;
    }

    setOpen(false);
    setReason("");
    onUpdated?.(nextSuspended);
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
      <h3 className="text-sm font-semibold text-rose-900">Danger actions</h3>
      <p className="mt-1 text-xs text-rose-800">
        {suspended
          ? `${fullName} is currently suspended.`
          : "Suspending will immediately block this account from logging in."}
      </p>
      {suspensionReason ? (
        <p className="mt-2 rounded-lg bg-white/70 p-2 text-xs text-rose-900">
          <span className="font-semibold">Current reason:</span> {suspensionReason}
        </p>
      ) : null}
      <Button
        type="button"
        className="mt-3"
        variant={suspended ? "outline" : "destructive"}
        onClick={() => setOpen(true)}
      >
        {suspended ? "Unsuspend account" : "Suspend account"}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            {suspended ? (
              <>
                <h4 className="text-base font-semibold text-slate-900">Unsuspend this account?</h4>
                <p className="mt-2 text-sm text-slate-600">
                  This will restore their access immediately.
                </p>
                {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
                <div className="mt-4 flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                    Cancel
                  </Button>
                  <LoadingButton
                    type="button"
                    loading={loading}
                    loadingText="Unsuspending..."
                    onClick={() => void submit(false)}
                  >
                    Confirm unsuspend
                  </LoadingButton>
                </div>
              </>
            ) : (
              <>
                <h4 className="text-base font-semibold text-slate-900">Suspend account</h4>
                <p className="mt-2 text-sm text-slate-600">
                  Explain why this account is being suspended.
                </p>
                <div className="mt-3">
                  <Textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Required suspension reason"
                    rows={4}
                  />
                </div>
                {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
                <div className="mt-4 flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                    Cancel
                  </Button>
                  <LoadingButton
                    type="button"
                    variant="destructive"
                    loading={loading}
                    loadingText="Suspending..."
                    onClick={() => void submit(true)}
                    disabled={reason.trim().length < 5}
                  >
                    Confirm suspension
                  </LoadingButton>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
