import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SESSION_TOKEN_COOKIE } from "@/lib/session-lock";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: COOKIE_MAX_AGE
  };
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { token?: string };
  const token = body.token?.trim();

  if (!token) {
    return NextResponse.json({ error: "Session token is required." }, { status: 400 });
  }

  const deviceInfo = request.headers.get("user-agent") ?? "unknown";

  const { error } = await supabase.from("user_sessions").upsert({
    user_id: auth.user.id,
    session_token: token,
    device_info: deviceInfo,
    updated_at: new Date().toISOString()
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_TOKEN_COOKIE, token, cookieOptions());
  return response;
}

export async function DELETE() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (auth.user) {
    await supabase.from("user_sessions").delete().eq("user_id", auth.user.id);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_TOKEN_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
  return response;
}
