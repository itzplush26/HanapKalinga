import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendBookingCancelledEmail } from "@/lib/bookings/emails";
import { appUrl } from "@/lib/email/templates/layout";

const bodySchema = z.object({
  reason: z.string().min(1),
  cancelledBy: z.enum(["family", "nurse"])
});

const CANCELLABLE = new Set(["pending", "accepted"]);

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, family_id, nurse_id, status")
    .eq("id", params.id)
    .single();

  if (!booking) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { cancelledBy, reason } = parsed.data;
  const isFamily = cancelledBy === "family" && booking.family_id === auth.user.id;
  const isNurse = cancelledBy === "nurse" && booking.nurse_id === auth.user.id;
  if (!isFamily && !isNurse) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (!CANCELLABLE.has(booking.status)) {
    return NextResponse.json(
      { error: `This booking cannot be cancelled because it is currently ${booking.status}.` },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled", cancelled_by: cancelledBy, cancellation_reason: reason })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void sendBookingCancelledEmail(params.id, cancelledBy, reason);

  if (cancelledBy === "nurse") {
    const service = createServiceClient();
    await service.from("notifications").insert({
      user_id: booking.family_id,
      type: "booking_declined",
      title: "Booking cancelled by nurse",
      body: `Your nurse cancelled the booking. Reason: ${reason}`,
      metadata: { booking_id: params.id, link: appUrl("/nurses") }
    });
  }

  return NextResponse.json({ ok: true });
}
