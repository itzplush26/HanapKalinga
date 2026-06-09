import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({ blockedId: z.string().uuid() });

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  if (parsed.data.blockedId === auth.user.id) {
    return NextResponse.json({ error: "Cannot block yourself." }, { status: 400 });
  }

  const { error } = await supabase.from("user_blocks").insert({
    blocker_id: auth.user.id,
    blocked_id: parsed.data.blockedId
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const blockedId = searchParams.get("blockedId");
  if (!blockedId) return NextResponse.json({ error: "blockedId required." }, { status: 400 });

  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", auth.user.id)
    .eq("blocked_id", blockedId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
