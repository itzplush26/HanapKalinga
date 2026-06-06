import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const { count: pendingCount } = await supabase
    .from("nurses")
    .select("id", { count: "exact", head: true })
    .eq("verification_status", "pending");
  const { count: bookingCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true });
  const { count: newSignupCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <div className="grid gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            Pending verifications: {pendingCount ?? 0}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            Total bookings: {bookingCount ?? 0}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            Total signups: {newSignupCount ?? 0}
          </div>
        </div>
        <div className="flex flex-col gap-2 text-sm text-brand-700">
          <Link href="/admin/verifications">Review verifications</Link>
          <Link href="/admin/nurses">View nurses</Link>
          <Link href="/admin/families">View families</Link>
          <Link href="/admin/bookings">View bookings</Link>
        </div>
      </div>
    </main>
  );
}
