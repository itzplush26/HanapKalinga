"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProfileAvatar } from "@/components/profile-avatar";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import { VerificationDocumentStatus } from "@/components/admin/verification-document-status";
import { useToast } from "@/components/admin/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/loading-button";
import { PENDING_VERIFICATION_STATUSES } from "@/lib/admin/verification-queries";
import { ProviderTypeBadge } from "@/components/provider-type-badge";
import { resolveProfileDisplayName } from "@/lib/profile-display";
import { resolveProfilePhotoUrl } from "@/lib/storage/media-url";
import { getDocumentSlots, hasIncompleteDocuments } from "@/lib/admin/verification-documents";
import { isProfileComplete } from "@/lib/admin/nurse-profile-completeness";
import type { VerificationStatus } from "@/lib/verification";

export interface VerificationQueueNurse {
  id: string;
  provider_type: string | null;
  verification_status: VerificationStatus;
  submitted_at: string | null;
  profile_photo_url: string | null;
  prc_license_no: string | null;
  tesda_certificate_no: string | null;
  prc_document_url: string | null;
  tesda_document_url: string | null;
  nbi_document_url: string | null;
  prc_license_expiry: string | null;
  tesda_cert_expiry: string | null;
  nbi_expiry: string | null;
  bio: string | null;
  specializations: string[] | null;
  daily_rate_range: string | null;
  hourly_rate_range: string | null;
  email: string | null;
  profiles: {
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    city: string | null;
    region: string | null;
    profile_photo_url: string | null;
  } | null;
}

type QueueTab =
  | "all"
  | "pending"
  | "under_review"
  | "renewals"
  | "verified"
  | "rejected"
  | "incomplete";

const TAB_LABELS: Record<QueueTab, string> = {
  all: "All",
  pending: "Pending",
  under_review: "Under review",
  renewals: "Renewals",
  verified: "Verified",
  rejected: "Rejected",
  incomplete: "Incomplete"
};

function parseInitialTab(value?: string): QueueTab {
  if (
    value === "all" ||
    value === "pending" ||
    value === "verified" ||
    value === "rejected" ||
    value === "incomplete" ||
    value === "under_review" ||
    value === "renewals"
  ) {
    return value;
  }
  return "pending";
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

interface VerificationQueueProps {
  initialNurses: VerificationQueueNurse[];
  initialTab?: string;
}

export function VerificationQueue({ initialNurses, initialTab }: VerificationQueueProps) {
  const nurses = initialNurses;
  const [activeTab, setActiveTab] = useState<QueueTab>(() => parseInitialTab(initialTab));
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sendingReminders, setSendingReminders] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);
  const { showToast, Toast } = useToast();

  const counts = useMemo(
    () => ({
      all: nurses.length,
      pending: nurses.filter((nurse) =>
        PENDING_VERIFICATION_STATUSES.includes(
          nurse.verification_status as (typeof PENDING_VERIFICATION_STATUSES)[number]
        )
      ).length,
      under_review: nurses.filter((nurse) => nurse.verification_status === "under_review").length,
      renewals: nurses.filter((nurse) => nurse.verification_status === "renewal_under_review").length,
      verified: nurses.filter((nurse) => nurse.verification_status === "verified").length,
      rejected: nurses.filter((nurse) =>
        ["rejected", "resubmission_required"].includes(nurse.verification_status)
      ).length,
      incomplete: nurses.filter((nurse) => hasIncompleteDocuments(nurse)).length
    }),
    [nurses]
  );

  const filteredNurses = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();

    return nurses.filter((nurse) => {
      const profile = nurse.profiles;
      const matchesTab =
        activeTab === "all"
          ? true
          : activeTab === "pending"
            ? PENDING_VERIFICATION_STATUSES.includes(
                nurse.verification_status as (typeof PENDING_VERIFICATION_STATUSES)[number]
              )
            : activeTab === "under_review"
              ? nurse.verification_status === "under_review"
            : activeTab === "renewals"
              ? nurse.verification_status === "renewal_under_review"
            : activeTab === "verified"
              ? nurse.verification_status === "verified"
              : activeTab === "rejected"
                ? ["rejected", "resubmission_required"].includes(nurse.verification_status)
                : hasIncompleteDocuments(nurse);

      if (!matchesTab) return false;
      if (!query) return true;

      const haystack = [
        resolveProfileDisplayName(profile, ""),
        profile?.city,
        profile?.region,
        nurse.provider_type === "caregiver" ? "caregiver" : "nurse",
        nurse.email
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [activeTab, debouncedSearch, nurses]);

  const selectableIds = filteredNurses
    .filter((nurse) => nurse.verification_status === "pending" || hasIncompleteDocuments(nurse))
    .map((nurse) => nurse.id);
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds((current) => current.filter((id) => !selectableIds.includes(id)));
      return;
    }
    setSelectedIds((current) => [...new Set([...current, ...selectableIds])]);
  }

  async function sendReminderEmails() {
    if (selectedIds.length === 0) return;
    setSendingReminders(true);
    try {
      const response = await fetch("/api/admin/verification/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nurseIds: selectedIds })
      });
      const payload = (await response.json()) as {
        error?: string;
        sent?: number;
        failures?: string[];
      };
      if (!response.ok) {
        showToast(payload.error ?? "Failed to send reminders.", "error");
        return;
      }
      showToast(
        `Reminder emails sent to ${payload.sent ?? 0} nurse${payload.sent === 1 ? "" : "s"}.`,
        "success"
      );
      setSelectedIds([]);
    } catch {
      showToast("Failed to send reminder emails.", "error");
    } finally {
      setSendingReminders(false);
    }
  }

  return (
    <>
      {Toast}
      <div className="mb-4">
        <Input
          placeholder="Search by name, email, city, or provider type"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(Object.keys(TAB_LABELS) as QueueTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              activeTab === tab
                ? "rounded-full bg-brand-600 px-3 py-1.5 text-xs font-medium text-white"
                : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            }
          >
            {TAB_LABELS[tab]} ({counts[tab]})
          </button>
        ))}
      </div>

      {selectedIds.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
          <span className="text-sm text-slate-700">{selectedIds.length} selected</span>
          <LoadingButton
            type="button"
            size="sm"
            loading={sendingReminders}
            loadingText="Sending..."
            onClick={() => void sendReminderEmails()}
          >
            Send reminder email
          </LoadingButton>
          <Button type="button" size="sm" variant="outline" onClick={() => setSelectedIds([])}>
            Deselect all
          </Button>
        </div>
      ) : null}

      <div className="mb-3 flex items-center gap-2 px-1">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleSelectAll}
          aria-label="Select all nurses"
          className="h-4 w-4 rounded border-slate-300"
        />
        <span className="text-xs text-slate-500">Select all in this view</span>
      </div>

      <div className="space-y-3">
        {filteredNurses.map((nurse) => {
          const profile = nurse.profiles;
          const profileComplete = isProfileComplete(nurse);
          const showCheckbox =
            nurse.verification_status === "pending" || hasIncompleteDocuments(nurse);
          const renewalDocuments = getDocumentSlots(nurse).filter(
            (slot) => slot.state === "expiring_soon" || slot.state === "expired"
          );
          const earliestRenewalDate =
            renewalDocuments
              .map((slot) => slot.expiryDate)
              .filter((date): date is string => Boolean(date))
              .sort()[0] ?? null;
          const submittedBeforeExpiryDays =
            nurse.submitted_at && earliestRenewalDate
              ? Math.floor(
                  (new Date(`${earliestRenewalDate}T00:00:00`).getTime() -
                    new Date(nurse.submitted_at).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : null;

          return (
            <div
              key={nurse.id}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start gap-3">
                {showCheckbox ? (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(nurse.id)}
                    onChange={(event) => {
                      setSelectedIds((current) =>
                        event.target.checked
                          ? [...current, nurse.id]
                          : current.filter((id) => id !== nurse.id)
                      );
                    }}
                    aria-label={`Select ${resolveProfileDisplayName(profile, "Applicant")}`}
                    className="mt-2 h-4 w-4 rounded border-slate-300"
                  />
                ) : (
                  <span className="w-4" />
                )}
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <ProfileAvatar
                        src={resolveProfilePhotoUrl(nurse.profile_photo_url ?? profile?.profile_photo_url)}
                        name={resolveProfileDisplayName(profile, "Applicant")}
                        size="sm"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {resolveProfileDisplayName(profile, "Applicant")}
                          </p>
                          <VerificationStatusBadge status={nurse.verification_status} />
                          <ProviderTypeBadge providerType={nurse.provider_type} />
                          <span
                            className={
                              profileComplete
                                ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800"
                                : "rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800"
                            }
                          >
                            {profileComplete ? "Profile complete" : "Profile incomplete"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {profile?.city ?? "—"} • {nurse.provider_type === "caregiver" ? "Caregiver" : "Nurse"}
                        </p>
                        {nurse.email ? (
                          <p className="mt-1 text-xs text-slate-500">{nurse.email}</p>
                        ) : null}
                        {nurse.provider_type === "caregiver" && nurse.tesda_certificate_no ? (
                          <p className="mt-1 text-xs text-slate-600">
                            Entered TESDA Certificate Number:{" "}
                            <span className="font-medium">{nurse.tesda_certificate_no}</span>
                          </p>
                        ) : null}
                        {nurse.provider_type !== "caregiver" && nurse.prc_license_no ? (
                          <p className="mt-1 text-xs text-slate-600">
                            Entered PRC License Number:{" "}
                            <span className="font-medium">{nurse.prc_license_no}</span>
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-slate-500">
                          Submitted {nurse.submitted_at ? new Date(nurse.submitted_at).toLocaleString() : "—"}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/admin/verifications/${nurse.id}`}
                      className="text-sm font-medium text-brand-700"
                    >
                      Review →
                    </Link>
                  </div>

                  <VerificationDocumentStatus nurse={nurse} compact />

                  {nurse.verification_status === "renewal_under_review" ? (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                      <p className="font-medium">
                        This nurse is currently verified. Renewal submitted for:{" "}
                        {renewalDocuments.length > 0
                          ? renewalDocuments.map((slot) => slot.label).join(", ")
                          : "Document update"}
                        .
                      </p>
                      {submittedBeforeExpiryDays != null ? (
                        <p className="mt-1">
                          Renewal was submitted{" "}
                          {submittedBeforeExpiryDays >= 0
                            ? `${submittedBeforeExpiryDays} day(s) before expiry`
                            : `${Math.abs(submittedBeforeExpiryDays)} day(s) after expiry`}
                          .
                        </p>
                      ) : null}
                      <div className="mt-2 flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/verifications/${nurse.id}`}>Approve renewal</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/verifications/${nurse.id}`}>Reject renewal</Link>
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {!profileComplete ? (
                    <p className="text-xs text-slate-600">
                      This nurse&apos;s profile is incomplete. They will be prompted to complete it after
                      verification.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        {filteredNurses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No applications in this queue.
          </div>
        ) : null}
      </div>
    </>
  );
}
