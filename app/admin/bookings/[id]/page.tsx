"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { Button } from "@/components/ui/button";
import { MessageThread } from "@/components/message-thread";

interface AdminBookingDetailPageProps {
  params: { id: string };
}

export default function AdminBookingDetailPage({ params }: AdminBookingDetailPageProps) {
  const supabase = createClient();
  const [booking, setBooking] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
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

  async function markCompleted() {
    await supabase.from("bookings").update({ status: "completed" }).eq("id", params.id);
    setBooking((prev: any) => ({ ...prev, status: "completed" }));
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
        <Button type="button" variant="outline" onClick={markCompleted}>
          Mark completed
        </Button>
        <MessageThread bookingId={booking.id} currentUserId="admin" initialMessages={messages} />
      </div>
    </main>
  );
}
