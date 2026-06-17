"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { BookingDetailsCard } from "@/components/booking-details-card";
import { BookingPartyCard } from "@/components/booking-party-card";
import { LoadingButton } from "@/components/ui/loading-button";
import { NurseMarkCompleteButton } from "@/components/booking-completion-actions";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import { ReportUserMenu } from "@/components/report-user-menu";
import { MessageThread } from "@/components/message-thread";
import { getManilaDateString } from "@/lib/date-format";
import { ScrollToHash } from "@/components/scroll-to-hash";
import { formatShiftLabel } from "@/lib/booking-notes";
import { PageHeader } from "@/components/page-header";
import { resolveProfilePhotoUrl } from "@/lib/storage/media-url";
import { SUPPORT_EMAIL } from "@/lib/constants";

type BookingStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "completed"
  | "cancelled"
  | "pending_completion"
  | "disputed";

interface BookingDetailPageProps {
  params: { id: string };
}

export default function NurseBookingDetailPage({ params }: BookingDetailPageProps) {
  const supabase = createClient();
  const [booking, setBooking] = useState<{
    id: string;
    status: BookingStatus;
    requested_date: string;
    shift: string;
    notes: string | null;
    family_id: string;
    nurse_marked_complete?: boolean;
  } | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const [familyName, setFamilyName] = useState("Unknown User");
  const [familyPhotoUrl, setFamilyPhotoUrl] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? "";
      setUserId(uid);
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("id, status, requested_date, shift, notes, family_id, nurse_marked_complete")
        .eq("id", params.id)
        .single();
      setBooking(bookingData);
      const { data: messageData } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("booking_id", params.id)
        .order("created_at", { ascending: true });
      setMessages(messageData ?? []);

      if (bookingData && uid) {
        const [{ data: profiles }, { data: family }] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, profile_photo_url")
            .in("id", [uid, bookingData.family_id]),
          supabase.from("families").select("patient_name").eq("id", bookingData.family_id).maybeSingle()
        ]);

        setSenderNames(
          Object.fromEntries(
            (profiles ?? []).map((p) => [p.id as string, (p.full_name as string)?.trim() || "Unknown User"])
          )
        );
        const familyProfile = (profiles ?? []).find((p) => p.id === bookingData.family_id);
        setFamilyName(familyProfile?.full_name?.trim() || "Unknown User");
        setFamilyPhotoUrl(resolveProfilePhotoUrl(familyProfile?.profile_photo_url ?? null));
        setPatientName(family?.patient_name ?? null);
      }
    }
    load();
  }, [params.id, supabase]);

  async function reloadBooking() {
    const { data: bookingData } = await supabase
      .from("bookings")
      .select("id, status, requested_date, shift, notes, family_id, nurse_marked_complete")
      .eq("id", params.id)
      .single();
    setBooking(bookingData);
  }

  async function handleAccept() {
    setAccepting(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/bookings/${params.id}/accept`, { method: "POST" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        const backendError = payload?.error ?? "";
        if (backendError.toLowerCase().includes("cannot be accepted")) {
          setActionError(
            `This booking is no longer available to accept. The family may have cancelled their request. If you need help, contact ${SUPPORT_EMAIL}.`
          );
        } else if (backendError.toLowerCase().includes("forbidden")) {
          setActionError(
            `This booking is no longer available to accept. The family may have cancelled their request. If you need help, contact ${SUPPORT_EMAIL}.`
          );
        } else {
          setActionError(backendError || `Could not accept this booking. Contact ${SUPPORT_EMAIL}.`);
        }
        await reloadBooking();
        return;
      }
      await reloadBooking();
    } finally {
      setAccepting(false);
    }
  }

  async function handleDecline() {
    setDeclining(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/bookings/${params.id}/decline`, { method: "POST" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        const backendError = payload?.error ?? "";
        if (backendError.toLowerCase().includes("cannot be declined")) {
          setActionError(`${backendError} If you need help, contact ${SUPPORT_EMAIL}.`);
        } else {
          const status = booking?.status ?? "unknown";
          setActionError(
            `This booking is currently ${status} and can no longer be declined. If you need help, contact ${SUPPORT_EMAIL}.`
          );
        }
        await reloadBooking();
        return;
      }
      await reloadBooking();
    } finally {
      setDeclining(false);
    }
  }

  if (!booking) {
    return (
      <main className="px-5 py-8">
        <p className="text-sm text-slate-600">Loading booking...</p>
      </main>
    );
  }

  const canMarkComplete =
    booking.status === "accepted" &&
    !booking.nurse_marked_complete &&
    booking.requested_date <= getManilaDateString();

  return (
    <>
      <PageHeader title={familyName} />
      <main className="px-5 py-6">
      <ScrollToHash hash="chat" />
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <BookingPartyCard
          name={familyName}
          subtitle={patientName ? `Patient: ${patientName}` : "Booking request"}
          imageUrl={familyPhotoUrl}
        />
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Booking {booking.requested_date}</h2>
            <p className="text-sm text-slate-600">{formatShiftLabel(booking.shift, booking.notes)}</p>
          </div>
          <div className="flex items-center gap-2">
            <BookingStatusBadge status={booking.status} />
            <ReportUserMenu
              reportedUserId={booking.family_id}
              reportedUserName={familyName}
              bookingId={booking.id}
            />
          </div>
        </div>
        {booking.status === "pending" ? (
          <div className="flex gap-2">
            <LoadingButton
              type="button"
              loading={accepting}
              loadingText="Accepting..."
              onClick={() => void handleAccept()}
            >
              Accept
            </LoadingButton>
            <LoadingButton
              type="button"
              variant="outline"
              loading={declining}
              loadingText="Declining..."
              onClick={() => void handleDecline()}
            >
              Decline
            </LoadingButton>
          </div>
        ) : null}
        {actionError ? <p className="text-sm text-rose-600">{actionError}</p> : null}
        {canMarkComplete ? (
          <NurseMarkCompleteButton bookingId={booking.id} onUpdated={() => void reloadBooking()} />
        ) : null}
        {booking.status === "pending" || booking.status === "accepted" ? (
          <CancelBookingButton
            bookingId={booking.id}
            cancelledBy="nurse"
            onCancelled={() => void reloadBooking()}
          />
        ) : null}
        <BookingDetailsCard notes={booking.notes} />
        <MessageThread
          bookingId={booking.id}
          currentUserId={userId}
          initialMessages={messages}
          senderNames={senderNames}
        />
      </div>
    </main>
    </>
  );
}
