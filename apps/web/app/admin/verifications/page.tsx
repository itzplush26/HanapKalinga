import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import {
  VERIFICATION_STATUS_LABELS,
  type VerificationStatus
} from "@/lib/verification";

const STATUS_TABS: { value: VerificationStatus | "all"; label: string }[] = [
  { value: "all", label: "All active" },
  { value: "pending", label: VERIFICATION_STATUS_LABELS.pending },
  { value: "under_review", label: VERIFICATION_STATUS_LABELS.under_review },
  { value: "verified", label: VERIFICATION_STATUS_LABELS.verified },
  { value: "rejected", label: VERIFICATION_STATUS_LABELS.rejected },
  { value: "resubmission_required", label: VERIFICATION_STATUS_LABELS.resubmission_required }
];

interface AdminVerificationsPageProps {
  searchParams?: { status?: string };
}

export default async function AdminVerificationsPage({ searchParams }: AdminVerificationsPageProps) {
  const service = createServiceClient();
  const statusFilter = searchParams?.status ?? "all";

  let query = service
    .from("nurses")
    .select(
      "id, provider_type, verification_status, submitted_at, profiles(full_name, city, region, phone)"
    )
    .order("submitted_at", { ascending: false });

  if (statusFilter === "all") {
    query = query.in("verification_status", ["pending", "under_review"]);
  } else {
    query = query.eq("verification_status", statusFilter);
  }

  const { data: nurses, error } = await query;

  if (error) {
    console.error("admin.verifications.list", error);
  }

  return (
    <main>
      <AdminPageHeader
        title="Verification management"
        description="Review applicant documents, update statuses, and track audit history."
        backHref="/admin"
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Verification Management" }
            ]}
          />
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.value;
          const href =
            tab.value === "all" ? "/admin/verifications" : `/admin/verifications?status=${tab.value}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={
                active
                  ? "rounded-full bg-brand-600 px-3 py-1.5 text-xs font-medium text-white"
                  : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="space-y-3">
        {(nurses ?? []).map((nurse) => {
          const profile = Array.isArray(nurse.profiles) ? nurse.profiles[0] : nurse.profiles;
          return (
            <Link
              key={nurse.id}
              href={`/admin/verifications/${nurse.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{profile?.full_name ?? "Applicant"}</p>
                    <VerificationStatusBadge status={nurse.verification_status as VerificationStatus} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {profile?.city ?? "—"} • {nurse.provider_type === "caregiver" ? "Caregiver" : "Nurse"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Submitted {nurse.submitted_at ? new Date(nurse.submitted_at).toLocaleString() : "—"}
                  </p>
                </div>
                <span className="text-sm font-medium text-brand-700">Review →</span>
              </div>
            </Link>
          );
        })}
        {(nurses ?? []).length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No applications in this queue.
          </div>
        ) : null}
      </div>
    </main>
  );
}
