import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  coverMessage: z.string().min(50),
  proposedRateBand: z.string().optional()
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Cover message must be at least 50 characters." }, { status: 400 });
  }

  const { error } = await supabase.from("care_request_applications").insert({
    care_request_id: params.id,
    nurse_id: auth.user.id,
    cover_message: parsed.data.coverMessage,
    proposed_rate_band: parsed.data.proposedRateBand ?? null
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
