"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";

interface CareRequestManageActionsProps {
  careRequestId: string;
  status: string;
}

export function CareRequestManageActions({ careRequestId, status }: CareRequestManageActionsProps) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "open") return null;

  async function handleClose() {
    if (
      !window.confirm(
        "Close this care request? It will be removed from the nurse job board and pending applications will be declined."
      )
    ) {
      return;
    }

    setError(null);
    setClosing(true);

    const response = await fetch(`/api/care-requests/${careRequestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close" })
    });

    const payload = (await response.json()) as { error?: string };
    setClosing(false);

    if (!response.ok) {
      setError(payload.error ?? "Could not close this care request.");
      return;
    }

    router.push(`/dashboard/family/care-requests/${careRequestId}?closed=1`);
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold text-text-primary">Manage listing</h2>
      <p className="text-xs text-text-muted">
        Edit your posting while it is open, or close it when you no longer need care.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/family/care-requests/${careRequestId}/edit`}>Edit posting</Link>
        </Button>
        <LoadingButton
          type="button"
          size="sm"
          variant="destructive"
          loading={closing}
          loadingText="Closing..."
          onClick={() => void handleClose()}
        >
          Close posting
        </LoadingButton>
      </div>
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
