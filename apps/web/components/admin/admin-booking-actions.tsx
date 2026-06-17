"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";

interface AdminBookingActionsProps {
  bookingId: string;
  status: string;
}

export function AdminBookingActions({ bookingId, status }: AdminBookingActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markCompleted() {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/admin/bookings/${bookingId}/complete`, { method: "POST" });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setLoading(false);

    if (!response.ok) {
      setError(payload?.error ?? "Could not mark booking as completed.");
      return;
    }

    router.refresh();
  }

  if (status === "completed" || status === "cancelled") {
    return null;
  }

  return (
    <div className="space-y-2">
      <LoadingButton
        type="button"
        variant="outline"
        loading={loading}
        loadingText="Updating..."
        onClick={() => void markCompleted()}
      >
        Mark completed
      </LoadingButton>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="button" variant="outline" onClick={() => window.history.back()}>
        Back
      </Button>
    </div>
  );
}
