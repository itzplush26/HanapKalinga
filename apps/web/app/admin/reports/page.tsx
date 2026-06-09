import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/admin-shell";

export default async function AdminReportsPage() {
  const supabase = createClient();
  const { data: reports } = await supabase
    .from("incident_reports")
    .select("id, category, status, created_at, reporter:reporter_id(full_name), reported:reported_user_id(full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main>
      <AdminPageHeader title="Incident reports" description="Review and resolve user reports." />
      <div className="space-y-3">
        {(reports ?? []).map((report) => {
          const reporter = Array.isArray(report.reporter) ? report.reporter[0] : report.reporter;
          const reported = Array.isArray(report.reported) ? report.reported[0] : report.reported;
          return (
            <Link
              key={report.id as string}
              href={`/admin/reports/${report.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-brand-200"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy-900">{report.category as string}</p>
                  <p className="text-sm text-slate-600">
                    {reporter?.full_name ?? "Reporter"} → {reported?.full_name ?? "Reported user"}
                  </p>
                </div>
                <span className="text-xs text-slate-500">{report.status as string}</span>
              </div>
            </Link>
          );
        })}
        {!reports?.length ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No incident reports yet.
          </p>
        ) : null}
      </div>
    </main>
  );
}
