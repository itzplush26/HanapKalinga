import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendBookingDeclinedEmail } from "@/lib/bookings/emails";

const bodySchema = z.object({ reason: z.string().optional() });

export async function POST(request: Request, { params }: { params: { id: string } }) {
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
      { error: `This booking is currently ${booking.status} and cannot be declined.` },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  const reason = parsed.success ? parsed.data.reason : undefined;

  const { error } = await supabase.from("bookings").update({ status: "declined" }).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void sendBookingDeclinedEmail(params.id, reason);

  return NextResponse.json({ ok: true });
}
