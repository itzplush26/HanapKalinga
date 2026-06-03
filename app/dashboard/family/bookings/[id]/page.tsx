import { createClient } from "@/lib/supabase/server";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { BookingDetailsCard } from "@/components/booking-details-card";
import { MessageThread } from "@/components/message-thread";

interface BookingDetailPageProps {
  params: { id: string };
}

export default async function FamilyBookingDetailPage({ params }: BookingDetailPageProps) {
  const supabase = createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, requested_date, shift, notes, nurse_id")
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

  const participantIds = [auth.user?.id, booking.nurse_id].filter(Boolean) as string[];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", participantIds);

  const senderNames = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id as string, (p.full_name as string) ?? "User"])
  );

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
        <BookingDetailsCard notes={booking.notes} />
        <MessageThread
          bookingId={booking.id}
          currentUserId={auth.user?.id ?? ""}
          initialMessages={messages ?? []}
          senderNames={senderNames}
        />
      </div>
    </main>
  );
}
