import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendBookingAcceptedEmail } from "@/lib/bookings/emails";
import { hasExpiredDocuments } from "@/lib/license-expiry";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, nurse_id, status")
    .eq("id", params.id)
    .single();

  if (!booking || booking.nurse_id !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (booking.status !== "pending") {
    return NextResponse.json(
      { error: `This booking is currently ${booking.status} and cannot be accepted.` },
      { status: 400 }
    );
  }

  const { data: nurse } = await supabase
    .from("nurses")
    .select("provider_type, prc_license_expiry, tesda_cert_expiry, nbi_expiry")
    .eq("id", auth.user.id)
    .single();

  if (nurse && hasExpiredDocuments(nurse)) {
    return NextResponse.json(
      { error: "Your documents have expired. Upload renewed documents on your profile first." },
      { status: 403 }
    );
  }

  const { error } = await supabase.from("bookings").update({ status: "accepted" }).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void sendBookingAcceptedEmail(params.id);

  return NextResponse.json({ ok: true });
}
