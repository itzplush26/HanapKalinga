import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bookingRequestSchema } from "@/lib/validations/booking";
import { sendBookingRequestReceivedEmail } from "@/lib/bookings/emails";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const values = parsed.data;
  const structuredRequest = {
    patientCondition: values.patientCondition,
    requiredSkills: values.requiredSkills,
    budgetRange: values.budgetRange,
    additionalInstructions: values.additionalInstructions ?? "",
    ...(values.shift === "custom"
      ? { customStartTime: values.customStartTime, customEndTime: values.customEndTime }
      : {})
  };

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      family_id: auth.user.id,
      nurse_id: values.nurseId,
      requested_date: values.requestedDate,
      shift: values.shift,
      notes: JSON.stringify(structuredRequest)
    })
    .select("id")
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: error?.message ?? "Failed to create booking." }, { status: 500 });
  }

  void sendBookingRequestReceivedEmail(booking.id);

  return NextResponse.json({ bookingId: booking.id });
}
