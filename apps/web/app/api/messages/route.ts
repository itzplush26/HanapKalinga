import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { maskProfanity } from "@/lib/validation/sanitize";
import { checkRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  bookingId: z.string().uuid(),
  content: z.string().min(1).max(2000)
});

async function resolveConversationContext(supabase: ReturnType<typeof createClient>, bookingId: string, userId: string) {
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, family_id, nurse_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) return { error: "Booking not found.", status: 404 as const };

  const isParty = booking.family_id === userId || booking.nurse_id === userId;
  if (!isParty) return { error: "Forbidden.", status: 403 as const };

  const otherPartyId = booking.family_id === userId ? booking.nurse_id : booking.family_id;
  const { data: blockRows } = await supabase
    .from("user_blocks")
    .select("id")
    .or(
      `and(blocker_id.eq.${userId},blocked_id.eq.${otherPartyId}),and(blocker_id.eq.${otherPartyId},blocked_id.eq.${userId})`
    )
    .limit(1);

  return {
    booking,
    otherPartyId,
    blocked: (blockRows ?? []).length > 0
  };
}

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const bookingId = new URL(request.url).searchParams.get("bookingId");
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required." }, { status: 400 });
  }

  const context = await resolveConversationContext(supabase, bookingId, auth.user.id);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  return NextResponse.json({ blocked: context.blocked });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message payload." }, { status: 400 });
  }

  const { bookingId, content } = parsed.data;
  const messageRate = checkRateLimit(`messages:${auth.user.id}`, 20, 60_000);
  if (!messageRate.allowed) {
    return NextResponse.json(
      { error: "Too many messages sent. Please wait before sending again." },
      { status: 429 }
    );
  }

  const context = await resolveConversationContext(supabase, bookingId, auth.user.id);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  if (context.blocked) {
    return NextResponse.json({ error: "Messaging is unavailable for this conversation." }, { status: 403 });
  }

  const maskedContent = maskProfanity(content.trim());

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      booking_id: bookingId,
      sender_id: auth.user.id,
      content: maskedContent
    })
    .select("id, sender_id, content, created_at")
    .single();

  if (error || !message) {
    return NextResponse.json({ error: error?.message ?? "Failed to send message." }, { status: 500 });
  }

  return NextResponse.json({ message });
}
