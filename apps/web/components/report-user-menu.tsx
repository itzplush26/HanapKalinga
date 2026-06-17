"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

const CATEGORIES = [
  "Inappropriate behavior",
  "No-show or abandonment",
  "Suspected fraud or fake profile",
  "Harassment or threatening messages",
  "Theft or property damage",
  "Clinical negligence or unsafe practice",
  "Other"
];

interface ReportUserMenuProps {
  reportedUserId: string;
  reportedUserName: string;
  bookingId?: string;
}

export function ReportUserMenu({ reportedUserId, reportedUserName, bookingId }: ReportUserMenuProps) {
  const [open, setOpen] = useState<"menu" | "report" | "block" | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submitReport() {
    if (description.trim().length < 50) return;
    setLoading(true);
    setMessage(null);
    const response = await fetch("/api/incident-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportedUserId,
        bookingId,
        category,
        description: description.trim()
      })
    });
    setLoading(false);
    if (response.ok) {
      setMessage("Your report has been submitted. Our team will review it within 48 hours.");
      setDescription("");
      setOpen(null);
      return;
    }

    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    setMessage(data?.error ?? "Could not submit report. Please try again.");
  }

  async function blockUser() {
    setLoading(true);
    const response = await fetch("/api/user-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockedId: reportedUserId })
    });
    setLoading(false);
    if (response.ok) {
      setMessage(`${reportedUserName} has been blocked. You will no longer see each other on the platform.`);
      setOpen(null);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(open === "menu" ? null : "menu")}
        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label="More options"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {open === "menu" ? (
        <div className="absolute right-0 z-10 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen("report")}
          >
            Report this user
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen("block")}
          >
            Block this user
          </button>
        </div>
      ) : null}
      {open === "report" || open === "block" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            {open === "report" ? (
              <>
                <h3 className="text-base font-semibold text-navy-900">Report {reportedUserName}</h3>
                <div className="mt-4 space-y-3">
                  <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                  <Textarea
                    placeholder="Describe what happened (min 50 characters)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(null)}>
                    Cancel
                  </Button>
                  <LoadingButton
                    type="button"
                    loading={loading}
                    loadingText="Submitting..."
                    onClick={() => void submitReport()}
                    disabled={description.trim().length < 50}
                  >
                    Submit report
                  </LoadingButton>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-navy-900">Block {reportedUserName}?</h3>
                <p className="mt-2 text-sm text-slate-600">
                  You will no longer see each other in search or messaging.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(null)}>
                    Cancel
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => void blockUser()} disabled={loading}>
                    Block user
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
      {message ? (
        <p className={`mt-2 text-xs ${message.includes("submitted") ? "text-emerald-700" : "text-rose-600"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
