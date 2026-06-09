import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default async function FamilyCareRequestsPage() {
  const supabase = createClient();
  const { data: requests } = await supabase
    .from("care_requests")
    .select("id, title, status, created_at")
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
              <p className="text-xs text-slate-500">{request.status as string}</p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
