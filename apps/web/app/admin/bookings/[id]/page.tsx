import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { BookingDetailsCard } from "@/components/booking-details-card";
import { MessageThread } from "@/components/message-thread";
import { AdminBookingActions } from "@/components/admin/admin-booking-actions";

interface AdminBookingDetailPageProps {
  params: { id: string };
}

type AdminBookingMessage = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default async function AdminBookingDetailPage({ params }: AdminBookingDetailPageProps) {
  const supabase = createClient();
  const [{ data: auth }, { data: booking }, { data: messages }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("bookings")
      .select("id, status, requested_date, shift, notes, family_id, nurse_id")
      .eq("id", params.id)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("booking_id", params.id)
      .order("created_at", { ascending: true })
  ]);

  if (!booking) notFound();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", [booking.family_id, booking.nurse_id]);

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
        <AdminBookingActions bookingId={booking.id} status={booking.status} />
        {booking.status === "completed" ? (
          <p className="text-sm text-slate-500">
            Booking marked complete. Family will be prompted to leave a review.
          </p>
        ) : null}
        <MessageThread
          bookingId={booking.id}
          currentUserId={auth.user?.id ?? ""}
          initialMessages={(messages ?? []) as AdminBookingMessage[]}
          senderNames={senderNames}
          readOnly
        />
      </div>
    </main>
  );
}
