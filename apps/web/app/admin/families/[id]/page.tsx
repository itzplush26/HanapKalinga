import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { SuspensionControls } from "@/components/admin/suspension-controls";

interface AdminFamilyDetailPageProps {
  params: { id: string };
}

export default async function AdminFamilyDetailPage({ params }: AdminFamilyDetailPageProps) {
  const supabase = createClient();
  const { data: family } = await supabase
    .from("families")
    .select("id, patient_name, patient_age, patient_condition, address, profiles(full_name, city, region, suspended, suspension_reason)")
    .eq("id", params.id)
    .maybeSingle();

  if (!family) {
    notFound();
  }

  const profile = Array.isArray(family.profiles) ? family.profiles[0] : family.profiles;

  return (
    <main>
      <AdminPageHeader
        title={profile?.full_name ?? "Family account"}
        description="Review account details and moderation actions."
        backHref="/admin/families"
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Families", href: "/admin/families" },
              { label: profile?.full_name ?? "Family details" }
            ]}
          />
        }
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Profile details</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Name</dt>
            <dd className="font-medium text-slate-900">{profile?.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Patient name</dt>
            <dd className="font-medium text-slate-900">{family.patient_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Patient age</dt>
            <dd className="font-medium text-slate-900">{family.patient_age ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Patient condition</dt>
            <dd className="font-medium text-slate-900">{family.patient_condition ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Region</dt>
            <dd className="font-medium text-slate-900">{profile?.region ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">City</dt>
            <dd className="font-medium text-slate-900">{profile?.city ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-500">Address</dt>
            <dd className="font-medium text-slate-900">{family.address ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-6">
        <SuspensionControls
          userId={family.id}
          fullName={profile?.full_name ?? "Family account"}
          suspended={Boolean(profile?.suspended)}
          suspensionReason={profile?.suspension_reason ?? null}
        />
      </div>
    </main>
  );
}
