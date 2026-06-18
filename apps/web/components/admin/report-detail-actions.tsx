"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Textarea } from "@/components/ui/textarea";
import { SuspensionControls } from "@/components/admin/suspension-controls";

interface ReportDetailActionsProps {
  reportId: string;
  reportedUserId: string;
  reportedUserName: string;
  reportedUserSuspended: boolean;
  reportedUserSuspensionReason?: string | null;
}

export function ReportDetailActions({
  reportId,
  reportedUserId,
  reportedUserName,
  reportedUserSuspended,
  reportedUserSuspensionReason
}: ReportDetailActionsProps) {
  const [notes, setNotes] = useState("");
  const [loadingStatus, setLoadingStatus] = useState<"reviewed" | "resolved" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function updateStatus(status: "reviewed" | "resolved") {
    setLoadingStatus(status);
    setMessage(null);
    const response = await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes: notes })
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setLoadingStatus(null);
    if (!response.ok) {
      setMessage(payload?.error ?? "Could not update report status.");
      return;
    }
    setMessage(status === "resolved" ? "Report marked resolved." : "Report marked reviewed.");
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Review actions</h2>
      <Textarea
        placeholder="Admin notes (optional)"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <LoadingButton
          type="button"
          variant="outline"
          loading={loadingStatus === "reviewed"}
          loadingText="Saving..."
          onClick={() => void updateStatus("reviewed")}
        >
          Mark reviewed
        </LoadingButton>
        <LoadingButton
          type="button"
          loading={loadingStatus === "resolved"}
          loadingText="Saving..."
          onClick={() => void updateStatus("resolved")}
        >
          Mark resolved
        </LoadingButton>
      </div>
      {message ? (
        <p className={message.includes("Could not") ? "text-sm text-rose-600" : "text-sm text-emerald-700"}>
          {message}
        </p>
      ) : null}

      <SuspensionControls
        userId={reportedUserId}
        fullName={reportedUserName}
        suspended={reportedUserSuspended}
        suspensionReason={reportedUserSuspensionReason ?? null}
      />

      <Button type="button" variant="outline" onClick={() => window.history.back()}>
        Back
      </Button>
    </section>
  );
}
