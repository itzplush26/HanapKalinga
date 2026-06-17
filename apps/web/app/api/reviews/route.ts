import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendEmailSafe } from "@/lib/email/send-safe";
import { getUserEmail } from "@/lib/email/user-email";
import { reviewSubmittedEmail } from "@/lib/email/templates/review-submitted";

const bodySchema = z.object({
  bookingId: z.string().uuid(),
  nurseId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional()
});

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { bookingId, nurseId, rating, comment } = parsed.data;

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, family_id, nurse_id, status")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 403 });
  }

  if (booking.family_id !== auth.user.id) {
    return NextResponse.json({ error: "You can only review your own bookings." }, { status: 403 });
  }

  if (booking.nurse_id !== nurseId) {
    return NextResponse.json({ error: "Review target does not match the booking provider." }, { status: 403 });
  }

  if (booking.status !== "completed") {
    return NextResponse.json({ error: "Reviews can only be submitted for completed bookings." }, { status: 403 });
  }

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("reviewer_id", auth.user.id)
    .maybeSingle();

  if (existingReview) {
    return NextResponse.json({ error: "You have already submitted a review for this booking." }, { status: 403 });
  }

  const { error } = await supabase.from("reviews").insert({
    booking_id: bookingId,
    reviewer_id: auth.user.id,
    reviewee_id: nurseId,
    rating,
    comment: comment?.trim() || null
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const nurseEmail = await getUserEmail(nurseId);
  const { data: nurseProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", nurseId)
    .maybeSingle();

  if (nurseEmail) {
    const { subject, html } = reviewSubmittedEmail({
      nurseName: nurseProfile?.full_name?.trim() || "Nurse",
      rating,
      comment
    });
    sendEmailSafe({ to: nurseEmail, subject, html });
  }

  return NextResponse.json({ ok: true });
}
