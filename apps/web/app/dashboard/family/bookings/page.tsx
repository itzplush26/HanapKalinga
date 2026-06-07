import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { fetchUnreadCountByBooking } from "@/lib/messages";

export default async function FamilyBookingsPage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? "";

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, status, requested_date, shift")
    .order("created_at", { ascending: false });

  const bookingIds = (bookings ?? []).map((b) => b.id);
  const unreadMap = userId
    ? await fetchUnreadCountByBooking(supabase, bookingIds, userId)
    : new Map<string, number>();

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <h1 className="text-2xl font-semibold">Your bookings</h1>
        <div className="space-y-3">
          {(bookings ?? []).map((booking) => {
            const unread = unreadMap.get(booking.id) ?? 0;
            return (
              <Link
                key={booking.id}
                href={`/dashboard/family/bookings/${booking.id}`}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-sm"
              >
                <div>
                  <p className="font-semibold">
                    {booking.requested_date}
                    {unread > 0 ? (
                      <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                        {unread}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-slate-500">{booking.shift}</p>
                </div>
                <BookingStatusBadge status={booking.status} />
              </Link>
            );
          })}
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
