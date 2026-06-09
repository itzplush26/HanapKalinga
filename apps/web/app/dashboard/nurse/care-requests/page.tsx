import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDailyRateBand } from "@/lib/data/rates";

export default async function NurseCareRequestsPage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: requests } = await supabase
    .from("care_requests")
    .select("id, title, city, region, care_type, budget_band, start_date, created_at, required_specializations")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const { data: applications } = auth.user
    ? await supabase.from("care_request_applications").select("care_request_id").eq("nurse_id", auth.user.id)
    : { data: [] };
  const appliedIds = new Set((applications ?? []).map((a) => a.care_request_id));

  return (
    <>
      <PageHeader title="Find work" />
      <main className="px-5 py-6">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/nurse/applications">My applications</Link>
          </Button>
          {(requests ?? []).map((request) => (
            <div key={request.id as string} className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="font-semibold text-navy-900">{request.title as string}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {[request.city, request.region].filter(Boolean).join(", ")}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge className="bg-brand-50 text-brand-800">{(request.care_type as string).replace("_", " ")}</Badge>
                {(request.required_specializations as string[]).map((s) => (
                  <Badge key={s} className="bg-slate-100 text-slate-700">
                    {s}
                  </Badge>
                ))}
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Budget: {getDailyRateBand(request.budget_band as string)?.label ?? "Open"}
              </p>
              {appliedIds.has(request.id) ? (
                <p className="mt-3 text-sm font-medium text-emerald-700">Applied</p>
              ) : (
                <Button asChild size="sm" className="mt-3">
                  <Link href={`/dashboard/nurse/care-requests/${request.id}`}>Apply</Link>
                </Button>
              )}
            </div>
          ))}
          {!requests?.length ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              No open care requests right now. Check back soon.
            </p>
          ) : null}
        </div>
      </main>
    </>
  );
}
