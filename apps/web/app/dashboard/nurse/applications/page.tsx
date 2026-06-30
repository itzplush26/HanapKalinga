import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";

export default async function NurseApplicationsPage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: applications } = await supabase
    .from("care_request_applications")
    .select("id, status, created_at, care_requests(title, city)")
    .eq("nurse_id", auth.user?.id ?? "")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="My applications" />
      <main className="px-5 py-6">
        <div className="mx-auto flex max-w-md flex-col gap-3">
          {(applications ?? []).map((app) => {
            const request = Array.isArray(app.care_requests) ? app.care_requests[0] : app.care_requests;
            return (
              <div key={app.id as string} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                <p className="font-semibold">{request?.title ?? "Care request"}</p>
                <p className="text-slate-600">{request?.city}</p>
                <p className="mt-1 text-xs text-slate-500">Status: {app.status as string}</p>
              </div>
            );
          })}
          {!applications?.length ? (
            <p className="text-sm text-slate-600">
              No applications yet.{" "}
              <Link href="/dashboard/nurse/bookings?tab=find-work" className="text-brand-600 underline">
                Browse care requests
              </Link>
            </p>
          ) : null}
        </div>
      </main>
    </>
  );
}
