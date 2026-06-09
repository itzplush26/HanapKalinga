"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { BookingDetailsCard } from "@/components/booking-details-card";
import { BookingPartyCard } from "@/components/booking-party-card";
import { Button } from "@/components/ui/button";
import { MessageThread } from "@/components/message-thread";
import { ScrollToHash } from "@/components/scroll-to-hash";
import { formatShiftLabel } from "@/lib/booking-notes";
import { PageHeader } from "@/components/page-header";
import { resolveProfilePhotoUrl } from "@/lib/storage/media-url";

type BookingStatus = "pending" | "accepted" | "declined" | "completed" | "cancelled";

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
  } | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const [familyName, setFamilyName] = useState("Unknown User");
  const [familyPhotoUrl, setFamilyPhotoUrl] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? "";
      setUserId(uid);
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("id, status, requested_date, shift, notes, family_id")
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

  async function handleStatusUpdate(status: "accepted" | "declined") {
    await supabase.from("bookings").update({ status }).eq("id", params.id);
    setBooking((prev) => (prev ? { ...prev, status } : prev));
  }

  if (!booking) {
    return (
      <main className="px-5 py-8">
        <p className="text-sm text-slate-600">Loading booking...</p>
      </main>
    );
  }

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
          <BookingStatusBadge status={booking.status} />
        </div>
        {booking.status === "pending" ? (
          <div className="flex gap-2">
            <Button type="button" onClick={() => handleStatusUpdate("accepted")}>
              Accept
            </Button>
            <Button type="button" variant="outline" onClick={() => handleStatusUpdate("declined")}>
              Decline
            </Button>
          </div>
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
