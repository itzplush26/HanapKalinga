import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking-status-badge";

export default async function FamilyDashboardPage() {
  const supabase = createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, status, requested_date")
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Family dashboard</h1>
          <p className="text-sm text-slate-600">Your latest booking activity.</p>
        </div>
        <Link
          href="/nurses"
          className="block rounded-2xl border border-brand-200 bg-brand-50 p-4 transition hover:bg-brand-100"
        >
          <h3 className="text-base font-semibold text-brand-900">Find a nurse or caregiver</h3>
          <p className="mt-1 text-sm text-brand-800">
            Browse verified professionals available in your area
          </p>
          <span className="mt-2 inline-block text-sm font-medium text-brand-700">Browse now →</span>
        </Link>
        <div className="space-y-3">
          {(bookings ?? []).map((booking) => (
            <Link
              key={booking.id}
              href={`/dashboard/family/bookings/${booking.id}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-sm"
            >
              <div>
                <p className="font-semibold">Booking {booking.requested_date}</p>
                <p className="text-xs text-slate-500">Request pending</p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </Link>
          ))}
          {bookings?.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
              No bookings yet.
            </p>
          ) : null}
        </div>
        <Button asChild>
          <Link href="/dashboard/family/bookings/new">Request a booking</Link>
        </Button>
      </div>
    </main>
  );
}
