import { createClient } from "@/lib/supabase/server";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { BookingDetailsCard } from "@/components/booking-details-card";
import { BookingPartyCard } from "@/components/booking-party-card";
import { BookingReviewForm } from "@/components/booking-review-form";
import { StarDisplay } from "@/components/star-display";
import { MessageThread } from "@/components/message-thread";
import { ScrollToHash } from "@/components/scroll-to-hash";
import { formatShiftLabel } from "@/lib/booking-notes";
import { resolveProfileCity } from "@/lib/profile-display";
import { resolveProfilePhotoUrl } from "@/lib/storage/media-url";
import { PageHeader } from "@/components/page-header";
import { FamilyBookingDetailActions } from "@/components/family-booking-detail-actions";

interface BookingDetailPageProps {
  params: { id: string };
}

export default async function FamilyBookingDetailPage({ params }: BookingDetailPageProps) {
  const supabase = createClient();
  const [{ data: booking }, { data: messages }, { data: auth }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, status, requested_date, shift, notes, nurse_id, nurses(provider_type, profile_photo_url, profiles!nurses_id_fkey(full_name, city))"
      )
      .eq("id", params.id)
      .single(),
    supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("booking_id", params.id)
      .order("created_at", { ascending: true }),
    supabase.auth.getUser()
  ]);

  if (!booking) {
    return (
      <main className="px-5 py-8">
        <p className="text-sm text-slate-600">Booking not found.</p>
      </main>
    );
  }

  const nurse = Array.isArray(booking.nurses) ? booking.nurses[0] : booking.nurses;
  const nurseProfile = Array.isArray(nurse?.profiles) ? nurse?.profiles[0] : nurse?.profiles;

  const participantIds = [auth.user?.id, booking.nurse_id].filter(Boolean) as string[];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", participantIds);

  const senderNames = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id as string, (p.full_name as string)?.trim() || "Unknown User"])
  );

  const nurseName =
    nurseProfile?.full_name?.trim() || senderNames[booking.nurse_id] || "Unknown User";

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at")
    .eq("booking_id", booking.id)
    .maybeSingle();

  const showReviewForm =
    booking.status === "completed" && !existingReview && auth.user?.id;

  return (
    <>
      <PageHeader title={nurseName} />
      <main className="px-5 py-6">
      <ScrollToHash hash="chat" />
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <BookingPartyCard
          name={nurseName}
          subtitle={resolveProfileCity(nurseProfile?.city)}
          imageUrl={resolveProfilePhotoUrl(nurse?.profile_photo_url)}
        />
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Booking {booking.requested_date}</h2>
            <p className="text-sm text-slate-600">{formatShiftLabel(booking.shift, booking.notes)}</p>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>
        <BookingDetailsCard notes={booking.notes} />
        <FamilyBookingDetailActions
          bookingId={booking.id}
          status={booking.status}
          nurseId={booking.nurse_id}
          nurseName={nurseName}
        />
        {showReviewForm ? (
          <BookingReviewForm
            bookingId={booking.id}
            nurseId={booking.nurse_id}
            nurseName={nurseName}
          />
        ) : null}
        {existingReview ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <h3 className="text-sm font-semibold text-emerald-900">Your review</h3>
            <StarDisplay rating={existingReview.rating as number} className="mt-2" />
            {existingReview.comment ? (
              <p className="mt-2 text-sm text-emerald-800">{existingReview.comment}</p>
            ) : null}
            <p className="mt-2 text-xs text-emerald-700">
              Submitted {new Date(existingReview.created_at as string).toLocaleDateString()}
            </p>
          </div>
        ) : null}
        <MessageThread
          bookingId={booking.id}
          currentUserId={auth.user?.id ?? ""}
          initialMessages={messages ?? []}
          senderNames={senderNames}
        />
      </div>
    </main>
    </>
  );
}
