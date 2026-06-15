import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDailyRateBand } from "@/lib/data/rates";

export default async function FamilyCareRequestsPage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: requests } = await supabase
    .from("care_requests")
    .select("id, title, status, created_at, city, region")
    .eq("family_id", auth.user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Care requests" />
      <main className="px-5 py-6">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          <Button asChild>
            <Link href="/dashboard/family/care-requests/new">Post a care request</Link>
          </Button>
          {(requests ?? []).map((request) => (
            <Link
              key={request.id as string}
              href={`/dashboard/family/care-requests/${request.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <p className="font-semibold text-navy-900">{request.title as string}</p>
              <p className="mt-1 text-xs text-slate-500">
                {[request.city, request.region].filter(Boolean).join(", ")}
              </p>
              <Badge className="mt-2 bg-slate-100 text-slate-700">{request.status as string}</Badge>
            </Link>
          ))}
          {!requests?.length ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              You have not posted any care requests yet.
            </p>
          ) : null}
        </div>
      </main>
    </>
  );
}
