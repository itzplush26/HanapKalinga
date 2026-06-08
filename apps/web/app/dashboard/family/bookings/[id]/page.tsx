import { createClient } from "@/lib/supabase/server";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { BookingDetailsCard } from "@/components/booking-details-card";
import { BookingPartyCard } from "@/components/booking-party-card";
import { BookingReviewForm } from "@/components/booking-review-form";
import { MessageThread } from "@/components/message-thread";
import { ScrollToHash } from "@/components/scroll-to-hash";
import { formatShiftLabel } from "@/lib/booking-notes";
import { resolveProfilePhotoUrl } from "@/lib/storage/r2";

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

  const { data: nurse } = await supabase
    .from("nurses")
    .select("provider_type, profile_photo_url, profiles(full_name, city)")
    .eq("id", booking.nurse_id)
    .maybeSingle();

  const nurseProfile = Array.isArray(nurse?.profiles) ? nurse?.profiles[0] : nurse?.profiles;

  const participantIds = [auth.user?.id, booking.nurse_id].filter(Boolean) as string[];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", participantIds);

  const senderNames = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id as string, (p.full_name as string) ?? "User"])
  );

  const nurseName = nurseProfile?.full_name ?? senderNames[booking.nurse_id] ?? "Nurse";

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", booking.id)
    .maybeSingle();

  const showReviewForm =
    booking.status === "completed" && !existingReview && auth.user?.id;

  return (
    <main className="px-5 py-8">
      <ScrollToHash hash="chat" />
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <BookingPartyCard
          name={nurseName}
          subtitle={nurseProfile?.city ?? "Philippines"}
          imageUrl={resolveProfilePhotoUrl(nurse?.profile_photo_url)}
          badgeLabel={nurse?.provider_type === "caregiver" ? "Caregiver" : "Nurse"}
        />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Booking {booking.requested_date}</h1>
            <p className="text-sm text-slate-600">{formatShiftLabel(booking.shift, booking.notes)}</p>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>
        <BookingDetailsCard notes={booking.notes} />
        {showReviewForm ? (
          <BookingReviewForm
            bookingId={booking.id}
            nurseId={booking.nurse_id}
            nurseName={nurseName}
            reviewerId={auth.user!.id}
          />
        ) : null}
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
