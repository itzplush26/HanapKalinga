import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { VerificationStatusBanner } from "@/components/verification-status-banner";
import { NotificationsPanel } from "@/components/notifications-panel";
import { Button } from "@/components/ui/button";
import type { VerificationStatus } from "@/lib/verification";

export default async function NurseDashboardPage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: nurse } = await supabase
    .from("nurses")
    .select("verification_status, rejection_reason")
    .eq("id", auth.user?.id ?? "")
    .single();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, status, requested_date")
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Nurse dashboard</h1>
          <p className="text-sm text-slate-600">Manage your profile, verification status, and bookings.</p>
        </div>
        <VerificationStatusBanner
          status={(nurse?.verification_status ?? "pending") as VerificationStatus}
          rejectionReason={nurse?.rejection_reason}
        />
        <NotificationsPanel />
        <div className="space-y-3">
          {(bookings ?? []).map((booking) => (
            <Link
              key={booking.id}
              href={`/dashboard/nurse/bookings/${booking.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-3 text-sm"
            >
              Booking {booking.requested_date} - {booking.status}
            </Link>
          ))}
          {bookings?.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
              No booking requests yet.
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button asChild>
            <Link href="/dashboard/nurse/profile">Edit profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/nurse/availability">Set availability</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
