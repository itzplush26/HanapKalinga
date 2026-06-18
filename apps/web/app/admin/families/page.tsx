import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";

export default async function AdminFamiliesPage() {
  const supabase = createClient();
  const { data: families } = await supabase
    .from("families")
    .select("id, patient_name, profiles(full_name, city, suspended)")
    .order("patient_name", { ascending: true });

  return (
    <main>
      <AdminPageHeader
        title="All families"
        description="Review family accounts and moderation status."
        backHref="/admin"
        breadcrumbs={
          <AdminBreadcrumbs items={[{ label: "Dashboard", href: "/admin" }, { label: "Families" }]} />
        }
      />
      <div className="space-y-3 text-sm">
        {(families ?? []).map((family) => {
          const profile = Array.isArray(family.profiles) ? family.profiles[0] : family.profiles;
          return (
            <Link
              key={family.id}
              href={`/admin/families/${family.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-3 hover:border-brand-200"
            >
              <div className="flex items-center gap-2">
                <p className="font-semibold">{profile?.full_name ?? "Family"}</p>
                {profile?.suspended ? (
                  <Badge className="bg-rose-100 text-rose-800">Suspended</Badge>
                ) : null}
              </div>
              <p className="text-slate-500">{family.patient_name ?? "Patient"}</p>
              <p className="text-xs text-slate-500">{profile?.city ?? ""}</p>
            </Link>
          );
        })}
        {families?.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600">
            No families found.
          </p>
        ) : null}
      </div>
    </main>
  );
}
