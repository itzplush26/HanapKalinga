import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseTooltipsDismissed, type FamilyTooltipKey } from "@/lib/family-onboarding";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("dismiss_checklist") }),
  z.object({ action: z.literal("dismiss_welcome") }),
  z.object({ action: z.literal("mark_browsed") }),
  z.object({
    action: z.literal("dismiss_tooltip"),
    tooltip: z.enum(["browse", "booking", "messages"])
  })
]);

async function ensureFamilyRow(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data: existing } = await supabase.from("families").select("id").eq("id", userId).maybeSingle();
  if (existing) return;

  await supabase.from("families").upsert({ id: userId });
}

export async function PATCH(request: Request) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profile?.role !== "family") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  await ensureFamilyRow(supabase, auth.user.id);

  if (parsed.data.action === "dismiss_checklist") {
    const { error } = await supabase
      .from("families")
      .update({ checklist_dismissed: true })
      .eq("id", auth.user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "dismiss_welcome") {
    const { error } = await supabase
      .from("families")
      .update({ welcome_seen: true })
      .eq("id", auth.user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "mark_browsed") {
    const { error } = await supabase
      .from("families")
      .update({ has_browsed: true })
      .eq("id", auth.user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const tooltip = parsed.data.tooltip as FamilyTooltipKey;
  const { data: family } = await supabase
    .from("families")
    .select("tooltips_dismissed")
    .eq("id", auth.user.id)
    .maybeSingle();

  const current = parseTooltipsDismissed(family?.tooltips_dismissed);
  const next = { ...current, [tooltip]: true };

  const { error } = await supabase
    .from("families")
    .update({ tooltips_dismissed: next })
    .eq("id", auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
