import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import { Button } from "@/components/ui/button";
import { formatDateOfBirth } from "@/lib/validation/date-of-birth";
import type { VerificationStatus } from "@/lib/verification";

interface AdminNurseDetailPageProps {
  params: { id: string };
}

export default async function AdminNurseDetailPage({ params }: AdminNurseDetailPageProps) {
  const supabase = createClient();

  const { data: nurse } = await supabase
    .from("nurses")
    .select(
      "id, provider_type, verification_status, submitted_at, prc_license_no, tesda_certificate_no, profiles!nurses_id_fkey(full_name, first_name, last_name, city, region, barangay, phone)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!nurse) {
    notFound();
  }

  const profile = Array.isArray(nurse.profiles) ? nurse.profiles[0] : nurse.profiles;
  const { data: dateOfBirth } = await supabase.rpc("get_profile_date_of_birth_for_admin", {
    p_user_id: params.id
  });
  const displayName = profile?.full_name?.trim() || "Nurse";
  const providerLabel = nurse.provider_type === "caregiver" ? "Caregiver" : "Nurse";

  return (
    <main>
      <AdminPageHeader
        title={displayName}
        description="Read-only provider profile details for support and account review."
        backHref="/admin/nurses"
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Nurses", href: "/admin/nurses" },
              { label: displayName }
            ]}
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold text-slate-900">{displayName}</p>
            <VerificationStatusBadge status={nurse.verification_status as VerificationStatus} />
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {providerLabel}
            </span>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">First name</dt>
              <dd className="font-medium text-slate-900">{profile?.first_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Last name</dt>
              <dd className="font-medium text-slate-900">{profile?.last_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Date of birth</dt>
              <dd className="font-medium text-slate-900">{formatDateOfBirth(dateOfBirth)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Phone</dt>
              <dd className="font-medium text-slate-900">{profile?.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Location</dt>
              <dd className="font-medium text-slate-900">
                {[profile?.barangay, profile?.city, profile?.region].filter(Boolean).join(", ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Submitted</dt>
              <dd className="font-medium text-slate-900">
                {nurse.submitted_at ? new Date(nurse.submitted_at).toLocaleString() : "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Credential reference</h2>
          <dl className="mt-4 space-y-2 text-sm">
            {nurse.provider_type === "caregiver" ? (
              <div>
                <dt className="text-slate-500">TESDA certificate number</dt>
                <dd className="font-medium text-slate-900">{nurse.tesda_certificate_no ?? "—"}</dd>
              </div>
            ) : (
              <div>
                <dt className="text-slate-500">PRC license number</dt>
                <dd className="font-medium text-slate-900">{nurse.prc_license_no ?? "—"}</dd>
              </div>
            )}
          </dl>
          <div className="mt-5">
            <Button asChild>
              <Link href={`/admin/verifications/${nurse.id}`}>Open verification review</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
