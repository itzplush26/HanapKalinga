import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BookingStatusBadge } from "@/components/booking-status-badge";

export default async function FamilyBookingsPage() {
  const supabase = createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, status, requested_date, shift")
    .order("created_at", { ascending: false });

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <h1 className="text-2xl font-semibold">Your bookings</h1>
        <div className="space-y-3">
          {(bookings ?? []).map((booking) => (
            <Link
              key={booking.id}
              href={`/dashboard/family/bookings/${booking.id}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-sm"
            >
              <div>
                <p className="font-semibold">{booking.requested_date}</p>
                <p className="text-xs text-slate-500">{booking.shift}</p>
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
      </div>
    </main>
  );
}
