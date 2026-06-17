import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const bodySchema = z.object({
  userId: z.string().uuid(),
  suspended: z.boolean(),
  reason: z.string().optional()
});

export async function POST(request: Request) {
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

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { userId, suspended, reason } = parsed.data;
    if (userId === auth.user.id) {
      return NextResponse.json({ error: "You cannot suspend your own account." }, { status: 400 });
    }

    if (suspended && (!reason || reason.trim().length < 5)) {
      return NextResponse.json(
        { error: "A suspension reason of at least 5 characters is required." },
        { status: 400 }
      );
    }

    const service = createServiceClient();
    const { data: target } = await service.from("profiles").select("id").eq("id", userId).maybeSingle();
    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const payload = suspended
      ? {
          suspended: true,
          suspended_at: new Date().toISOString(),
          suspension_reason: reason?.trim() ?? null
        }
      : {
          suspended: false,
          unsuspended_at: new Date().toISOString(),
          suspension_reason: null
        };

    const { error } = await service.from("profiles").update(payload).eq("id", userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, suspended });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
