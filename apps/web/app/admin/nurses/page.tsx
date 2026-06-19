import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import type { VerificationStatus } from "@/lib/verification";

export default async function AdminNursesPage() {
  const supabase = createClient();
  const { data: nurses } = await supabase
    .from("nurses")
    .select("id, verification_status, profiles!nurses_id_fkey(full_name, city, suspended)")
    .order("verification_status", { ascending: true });

  return (
    <main>
      <AdminPageHeader
        title="All nurses and caregivers"
        description="Browse registered providers and their verification status."
        backHref="/admin"
        breadcrumbs={
          <AdminBreadcrumbs items={[{ label: "Dashboard", href: "/admin" }, { label: "Nurses" }]} />
        }
      />
      <div className="space-y-3">
        {(nurses ?? []).map((nurse) => {
          const profile = Array.isArray(nurse.profiles) ? nurse.profiles[0] : nurse.profiles;
          return (
            <Link
              key={nurse.id}
              href={`/admin/verifications/${nurse.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-200"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-900">{profile?.full_name ?? "Provider"}</p>
                <VerificationStatusBadge status={nurse.verification_status as VerificationStatus} />
                {profile?.suspended ? (
                  <Badge className="bg-rose-100 text-rose-800">Suspended</Badge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-slate-500">{profile?.city ?? ""}</p>
            </Link>
          );
        })}
        {nurses?.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No nurses found.
          </p>
        ) : null}
      </div>
    </main>
  );
}
