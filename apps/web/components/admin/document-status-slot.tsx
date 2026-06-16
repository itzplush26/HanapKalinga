"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Circle, Minus } from "lucide-react";
import type { DocumentSlot } from "@/lib/admin/verification-documents";
import { cn } from "@/lib/utils";

interface DocumentStatusSlotProps {
  slot: DocumentSlot;
  compact?: boolean;
}

export function DocumentStatusSlot({ slot, compact = false }: DocumentStatusSlotProps) {
  const [loading, setLoading] = useState(false);

  async function openDocument() {
    if (!slot.documentPath) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/documents/view-url?path=${encodeURIComponent(slot.documentPath)}`);
      const payload = (await response.json()) as { url?: string; error?: string };
      if (response.ok && payload.url) {
        window.open(payload.url, "_blank", "noopener,noreferrer");
      }
    } finally {
      setLoading(false);
    }
  }

  const icon =
    slot.state === "uploaded" ? (
      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
    ) : slot.state === "missing" ? (
      <Circle className="h-4 w-4 shrink-0 text-rose-600" />
    ) : slot.state === "expired" ? (
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
    ) : (
      <Minus className="h-4 w-4 shrink-0 text-slate-400" />
    );

  const statusText =
    slot.state === "uploaded"
      ? "Uploaded"
      : slot.state === "missing"
        ? "Not uploaded"
        : slot.state === "expired"
          ? `Expired ${slot.expiryDate ? new Date(`${slot.expiryDate}T00:00:00`).toLocaleDateString("en-PH") : ""}`
          : "N/A";

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2",
        slot.state === "uploaded" && "border-emerald-200 bg-emerald-50",
        slot.state === "missing" && "border-rose-200 bg-rose-50",
        slot.state === "expired" && "border-amber-200 bg-amber-50",
        slot.state === "na" && "border-slate-200 bg-slate-50"
      )}
    >
      <div className="flex items-start gap-2">
        {icon}
        <div className="min-w-0 flex-1">
          <p className={cn("font-medium text-slate-900", compact ? "text-xs" : "text-sm")}>{slot.label}</p>
          <p className="text-xs text-slate-600">{statusText}</p>
          {slot.state === "expired" ? (
            <p className="mt-1 text-xs text-amber-800">Document expired — ask the nurse to re-upload.</p>
          ) : null}
          {slot.state === "uploaded" ? (
            <button
              type="button"
              onClick={() => void openDocument()}
              disabled={loading}
              className="mt-1 text-xs font-medium text-brand-700 underline disabled:opacity-60"
            >
              {loading ? "Opening..." : "View document"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
