import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { ReportDetailActions } from "@/components/admin/report-detail-actions";

interface AdminReportDetailPageProps {
  params: { id: string };
}

export default async function AdminReportDetailPage({ params }: AdminReportDetailPageProps) {
  const supabase = createClient();
  const { data: report } = await supabase
    .from("incident_reports")
    .select("id, category, description, status, created_at, admin_notes, reporter_id, reported_user_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!report) {
    notFound();
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, suspended, suspension_reason")
    .in("id", [report.reporter_id, report.reported_user_id]);

  const profileById = new Map((profiles ?? []).map((item) => [item.id, item]));
  const reporter = profileById.get(report.reporter_id);
  const reported = profileById.get(report.reported_user_id);

  return (
    <main>
      <AdminPageHeader
        title="Incident report"
        description="Review report details and moderation actions."
        backHref="/admin/reports"
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Incident Reports", href: "/admin/reports" },
              { label: report.id }
            ]}
          />
        }
      />

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Category</dt>
            <dd className="font-medium text-slate-900">{report.category}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="font-medium text-slate-900">{report.status}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Reporter</dt>
            <dd className="font-medium text-slate-900">{reporter?.full_name ?? "Unknown User"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Reported user</dt>
            <dd className="font-medium text-slate-900">{reported?.full_name ?? "Unknown User"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-500">Description</dt>
            <dd className="mt-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-800">
              {report.description}
            </dd>
          </div>
          {report.admin_notes ? (
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Current admin notes</dt>
              <dd className="font-medium text-slate-900">{report.admin_notes}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <ReportDetailActions
        reportId={report.id}
        reportedUserId={report.reported_user_id}
        reportedUserName={reported?.full_name ?? "Reported user"}
        reportedUserSuspended={Boolean(reported?.suspended)}
        reportedUserSuspensionReason={reported?.suspension_reason ?? null}
      />
    </main>
  );
}
