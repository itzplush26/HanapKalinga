import { createClient } from "@/lib/supabase/server";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { MessageThread } from "@/components/message-thread";

interface BookingDetailPageProps {
  params: { id: string };
}

export default async function FamilyBookingDetailPage({ params }: BookingDetailPageProps) {
  const supabase = createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, requested_date, shift")
    .eq("id", params.id)
    .single();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at")
    .eq("booking_id", params.id)
    .order("created_at", { ascending: true });

  const { data: auth } = await supabase.auth.getUser();

  if (!booking) {
    return (
      <main className="px-5 py-8">
        <p className="text-sm text-slate-600">Booking not found.</p>
      </main>
    );
  }

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Booking {booking.requested_date}</h1>
            <p className="text-sm text-slate-600">Shift: {booking.shift}</p>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>
        <MessageThread
          bookingId={booking.id}
          currentUserId={auth.user?.id ?? ""}
          initialMessages={messages ?? []}
        />
      </div>
    </main>
  );
}
