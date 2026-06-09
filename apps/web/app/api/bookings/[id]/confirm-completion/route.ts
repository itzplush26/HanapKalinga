import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendBookingCompletedEmails } from "@/lib/bookings/emails";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, family_id, status, nurse_marked_complete")
    .eq("id", params.id)
    .single();

  if (!booking || booking.family_id !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (booking.status !== "pending_completion" || !booking.nurse_marked_complete) {
    return NextResponse.json({ error: "Booking is not awaiting confirmation." }, { status: 400 });
  }

  const service = createServiceClient();
  const { error } = await service
    .from("bookings")
    .update({ family_marked_complete: true, status: "completed" })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void sendBookingCompletedEmails(params.id);
  await service.from("notifications").insert({
    user_id: booking.family_id,
    type: "review_prompt",
    title: "How was your experience?",
    body: "Your booking is complete. Leave a review to help other families.",
    metadata: { booking_id: params.id }
  });

  return NextResponse.json({ ok: true });
}
