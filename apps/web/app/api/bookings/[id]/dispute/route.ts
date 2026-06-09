import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendDisputeAdminEmail } from "@/lib/bookings/emails";

const bodySchema = z.object({ description: z.string().min(10) });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Description of at least 10 characters is required." }, { status: 400 });
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, family_id, status")
    .eq("id", params.id)
    .single();

  if (!booking || booking.family_id !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { error } = await supabase.from("bookings").update({ status: "disputed" }).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void sendDisputeAdminEmail(params.id, parsed.data.description);

  return NextResponse.json({ ok: true });
}
