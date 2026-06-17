import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isProviderRole } from "@/lib/provider-role";

export async function GET() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role, suspended")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const role = data?.role;
  const normalizedRole =
    role === "admin" || role === "family" || isProviderRole(role) ? role : null;

  return NextResponse.json({
    role: normalizedRole,
    suspended: Boolean(data?.suspended)
  });
}
