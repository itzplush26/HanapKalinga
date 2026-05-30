"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { Button } from "@/components/ui/button";
import { MessageThread } from "@/components/message-thread";

interface BookingDetailPageProps {
  params: { id: string };
}

export default function NurseBookingDetailPage({ params }: BookingDetailPageProps) {
  const supabase = createClient();
  const [booking, setBooking] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? "");
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("id, status, requested_date, shift")
        .eq("id", params.id)
        .single();
      setBooking(bookingData);
      const { data: messageData } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("booking_id", params.id)
        .order("created_at", { ascending: true });
      setMessages(messageData ?? []);
    }
    load();
  }, [params.id, supabase]);

  async function handleStatusUpdate(status: "accepted" | "declined") {
    await supabase.from("bookings").update({ status }).eq("id", params.id);
    setBooking((prev: any) => ({ ...prev, status }));
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
        <div className="flex gap-2">
          <Button type="button" onClick={() => handleStatusUpdate("accepted")}>Accept</Button>
          <Button type="button" variant="outline" onClick={() => handleStatusUpdate("declined")}>Decline</Button>
        </div>
        <MessageThread bookingId={booking.id} currentUserId={userId} initialMessages={messages} />
      </div>
    </main>
  );
}
