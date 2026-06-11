import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getManilaDateString } from "@/lib/date-format";
import {
  sendBookingCompletionRequestedEmail,
  sendBookingCompletedEmails
} from "@/lib/bookings/emails";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, nurse_id, family_id, status, requested_date, family_marked_complete")
    .eq("id", params.id)
    .single();

  if (!booking || booking.nurse_id !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (booking.status !== "accepted") {
    return NextResponse.json({ error: "Booking must be accepted to mark complete." }, { status: 400 });
  }

  if (booking.requested_date > getManilaDateString()) {
    return NextResponse.json({ error: "Cannot mark complete before shift date." }, { status: 400 });
  }

  const service = createServiceClient();
  const bothComplete = Boolean(booking.family_marked_complete);
  const newStatus = bothComplete ? "completed" : "pending_completion";

  const { error } = await service
    .from("bookings")
    .update({
      nurse_marked_complete: true,
      status: newStatus,
      ...(bothComplete ? { family_marked_complete: true } : {})
    })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (bothComplete) {
    void sendBookingCompletedEmails(params.id);
    await service.from("notifications").insert({
      user_id: booking.family_id,
      type: "review_prompt",
      title: "How was your experience?",
      body: "Your booking is complete. Leave a review to help other families.",
      metadata: { booking_id: params.id }
    });
  } else {
    void sendBookingCompletionRequestedEmail(params.id);
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
