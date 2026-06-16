import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePublicNursePages } from "@/lib/nurses/revalidate-public";

export async function POST() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: nurse } = await supabase
    .from("nurses")
    .select("id, profile_slug")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!nurse) {
    return NextResponse.json({ error: "Nurse profile not found." }, { status: 404 });
  }

  revalidatePublicNursePages(nurse.profile_slug, nurse.id);
  return NextResponse.json({ ok: true });
}
