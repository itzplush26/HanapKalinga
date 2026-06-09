import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { createServiceClient } from "@/lib/supabase/service";
import { sendBookingCompletedEmails } from "@/lib/bookings/emails";

export async function GET(request: Request) {
  const denied = authorizeCron(request);
  if (denied) return denied;

  const service = createServiceClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: bookings } = await service
    .from("bookings")
    .select("id, family_id")
    .eq("status", "pending_completion")
    .eq("nurse_marked_complete", true)
    .eq("family_marked_complete", false)
    .lt("updated_at", cutoff);

  let completed = 0;
  for (const booking of bookings ?? []) {
    const { error } = await service
      .from("bookings")
      .update({ family_marked_complete: true, status: "completed" })
      .eq("id", booking.id);

    if (!error) {
      completed += 1;
      void sendBookingCompletedEmails(booking.id);
      await service.from("notifications").insert({
        user_id: booking.family_id,
        type: "review_prompt",
        title: "How was your experience?",
        body: "Your booking was auto-completed. Leave a review to help other families.",
        metadata: { booking_id: booking.id }
      });
    }
  }

  return NextResponse.json({ ok: true, completed });
}
