"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { ProfileAvatar } from "@/components/profile-avatar";
import { getDailyRateBand } from "@/lib/data/rates";
import { cn } from "@/lib/utils";

export interface CareRequestApplicationItem {
  id: string;
  status: string;
  coverMessage: string;
  proposedRateBand: string | null;
  createdAt: string;
  nurseId: string;
  nurseName: string;
  nurseCity: string | null;
  providerType: string | null;
  profilePhotoUrl: string | null;
  profileSlug: string | null;
  specializations: string[];
}

interface CareRequestApplicationsPanelProps {
  careRequestId: string;
  careRequestStatus: string;
  applications: CareRequestApplicationItem[];
}

function applicationStatusBadgeClass(status: string) {
  switch (status) {
    case "accepted":
      return "border border-success-border bg-success-bg text-success";
    case "declined":
      return "border border-error-border bg-error-bg text-error";
    case "withdrawn":
      return "border border-border bg-surface-alt text-text-muted";
    default:
      return "border border-warning-border bg-warning-bg text-warning";
  }
}

function formatStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function providerLabel(providerType: string | null) {
  if (providerType === "caregiver") return "Caregiver";
  if (providerType === "nurse") return "Nurse";
  return "Provider";
}

export function CareRequestApplicationsPanel({
  careRequestId,
  careRequestStatus,
  applications
}: CareRequestApplicationsPanelProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = applications.filter((item) => item.status === "pending");
  const decided = applications.filter((item) => item.status !== "pending");

  async function updateApplication(applicationId: string, action: "accept" | "decline") {
    if (
      action === "accept" &&
      !window.confirm(
        "Accept this applicant? Your care request will be marked as filled and other pending applications will be declined."
      )
    ) {
      return;
    }

    setError(null);
    setActiveId(applicationId);

    const response = await fetch(
      `/api/care-requests/${careRequestId}/applications/${applicationId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      }
    );

    const payload = (await response.json()) as { error?: string };
    setActiveId(null);

    if (!response.ok) {
      setError(payload.error ?? "Could not update this application.");
      return;
    }

    router.refresh();
  }

  function renderApplication(item: CareRequestApplicationItem, showActions: boolean) {
    const profileHref = item.profileSlug ? `/nurses/${item.profileSlug}` : null;
    const proposedRate = getDailyRateBand(item.proposedRateBand ?? "")?.label;

    return (
      <article
        key={item.id}
        className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <ProfileAvatar
            src={item.profilePhotoUrl}
            name={item.nurseName}
            size="sm"
            className="h-12 w-12 text-sm"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                {profileHref ? (
                  <Link href={profileHref} className="font-semibold text-text-primary underline-offset-2 hover:underline">
                    {item.nurseName}
                  </Link>
                ) : (
                  <p className="font-semibold text-text-primary">{item.nurseName}</p>
                )}
                <p className="text-sm text-text-secondary">
                  {[providerLabel(item.providerType), item.nurseCity].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Badge className={cn("shrink-0", applicationStatusBadgeClass(item.status))}>
                {formatStatusLabel(item.status)}
              </Badge>
            </div>

            {item.specializations.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {item.specializations.map((spec) => (
                  <Badge key={spec} className="border border-border bg-primary-light text-primary">
                    {spec}
                  </Badge>
                ))}
              </div>
            ) : null}

            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
              {item.coverMessage}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
              {proposedRate ? <span>Proposed rate: {proposedRate}</span> : null}
              <span>Applied {new Date(item.createdAt).toLocaleDateString()}</span>
            </div>

            {showActions && item.status === "pending" && careRequestStatus === "open" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <LoadingButton
                  type="button"
                  size="sm"
                  loading={activeId === item.id}
                  loadingText="Accepting..."
                  onClick={() => void updateApplication(item.id, "accept")}
                >
                  Accept
                </LoadingButton>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={activeId === item.id}
                  onClick={() => void updateApplication(item.id, "decline")}
                >
                  Decline
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  if (!applications.length) {
    return (
      <section className="rounded-2xl border border-border bg-surface-alt p-4">
        <h2 className="text-sm font-semibold text-text-primary">Applications</h2>
        <p className="mt-2 text-sm text-text-secondary">
          No applications yet. Verified nurses and caregivers in your area will be notified when you
          post a request.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-text-primary">Applications</h2>
        <p className="mt-1 text-xs text-text-muted">
          {pending.length} pending · {applications.length} total
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-error-border bg-error-bg px-3 py-2 text-sm text-error">
          {error}
        </p>
      ) : null}

      {careRequestStatus === "filled" ? (
        <p className="rounded-xl border border-success-border bg-success-bg px-3 py-2 text-sm text-success">
          You accepted an applicant. This care request is marked as filled.
        </p>
      ) : null}

      {pending.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-text-muted">Pending review</h3>
          {pending.map((item) => renderApplication(item, true))}
        </div>
      ) : null}

      {decided.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-text-muted">Decided</h3>
          {decided.map((item) => renderApplication(item, false))}
        </div>
      ) : null}
    </section>
  );
}
