"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BookingStatusBadge } from "@/components/booking-status-badge";

type BookingStatus = "pending" | "accepted" | "declined" | "completed" | "cancelled";
import { BookingDetailsCard } from "@/components/booking-details-card";
import { Button } from "@/components/ui/button";
import { MessageThread } from "@/components/message-thread";

interface AdminBookingDetailPageProps {
  params: { id: string };
}

export default function AdminBookingDetailPage({ params }: AdminBookingDetailPageProps) {
  const supabase = createClient();
  const [booking, setBooking] = useState<{
    id: string;
    status: BookingStatus;
    requested_date: string;
    shift: string;
    notes: string | null;
    family_id: string;
    nurse_id: string;
  } | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? "");
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("id, status, requested_date, shift, notes, family_id, nurse_id")
        .eq("id", params.id)
        .single();
      setBooking(bookingData);
      const { data: messageData } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("booking_id", params.id)
        .order("created_at", { ascending: true });
      setMessages(messageData ?? []);

      if (bookingData) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", [bookingData.family_id, bookingData.nurse_id]);
        setSenderNames(
          Object.fromEntries(
            (profiles ?? []).map((p) => [p.id as string, (p.full_name as string) ?? "User"])
          )
        );
      }
    }
    load();
  }, [params.id, supabase]);

  async function markCompleted() {
    const response = await fetch(`/api/admin/bookings/${params.id}/complete`, { method: "POST" });
    if (!response.ok) return;
    setBooking((prev) => (prev ? { ...prev, status: "completed" } : prev));
  }

  if (!booking) {
    return (
      <main className="px-5 py-8">
        <p className="text-sm text-slate-600">Loading booking...</p>
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
        <BookingDetailsCard notes={booking.notes} />
        {booking.status !== "completed" && booking.status !== "cancelled" ? (
          <Button type="button" variant="outline" onClick={() => void markCompleted()}>
            Mark completed
          </Button>
        ) : null}
        {booking.status === "completed" ? (
          <p className="text-sm text-slate-500">
            Booking marked complete. Family will be prompted to leave a review.
          </p>
        ) : null}
        <MessageThread
          bookingId={booking.id}
          currentUserId={userId}
          initialMessages={messages}
          senderNames={senderNames}
          readOnly
        />
      </div>
    </main>
  );
}
