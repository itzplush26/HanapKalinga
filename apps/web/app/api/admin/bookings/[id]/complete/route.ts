import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

interface RouteContext {
  params: { id: string };
}

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const service = createServiceClient();

    const { data: booking, error: bookingError } = await service
      .from("bookings")
      .select("id, status, family_id, nurse_id, requested_date")
      .eq("id", params.id)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (booking.status === "completed") {
      return NextResponse.json({ ok: true, alreadyCompleted: true });
    }

    const { error: updateError } = await service
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", params.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { data: nurse } = await service
      .from("nurses")
      .select("profiles(full_name)")
      .eq("id", booking.nurse_id)
      .maybeSingle();

    const nurseProfile = Array.isArray(nurse?.profiles) ? nurse?.profiles[0] : nurse?.profiles;
    const nurseName = nurseProfile?.full_name?.trim() || "your nurse";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hanapkalinga.com";
    const bookingUrl = `${appUrl}/dashboard/family/bookings/${booking.id}`;

    await service.from("notifications").insert({
      user_id: booking.family_id,
      type: "review_prompt",
      title: "How was your experience?",
      body: `Your booking on ${booking.requested_date} with ${nurseName} is complete. Leave a review to help other families.`,
      metadata: {
        booking_id: booking.id,
        nurse_id: booking.nurse_id,
        link: bookingUrl
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
