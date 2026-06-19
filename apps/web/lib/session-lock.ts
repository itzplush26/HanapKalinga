import type { SupabaseClient } from "@supabase/supabase-js";
import { clearSignupStage } from "@/lib/signup-stage";
import { clearTermsAcceptanceSession } from "@/lib/terms-acceptance";

export const SESSION_TOKEN_COOKIE = "hk_session_token";
export const SESSION_TOKEN_STORAGE_KEY = "hk_session_token";

export async function registerUserSession(
  supabase: SupabaseClient,
  userId: string,
  deviceInfo?: string
): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || auth.user.id !== userId) {
    throw new Error("Cannot register session lock without an authenticated user.");
  }

  const token = crypto.randomUUID();

  const { error } = await supabase.from("user_sessions").upsert({
    user_id: userId,
    session_token: token,
    device_info: deviceInfo ?? null,
    updated_at: new Date().toISOString()
  });

  if (error) {
    throw error;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
  }

  return token;
}

/** Registers the session row and syncs the httpOnly cookie via the API route. */
export async function establishUserSession(
  supabase: SupabaseClient,
  userId: string,
  deviceInfo?: string
): Promise<string | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || auth.user.id !== userId) {
    return null;
  }

  const token = await registerUserSession(supabase, userId, deviceInfo);

  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  });

  return token;
}

export async function clearUserSession(supabase: SupabaseClient, userId: string): Promise<void> {
  await supabase.from("user_sessions").delete().eq("user_id", userId);

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
  }
}

export function getClientSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
}

export async function validateClientSession(
  supabase: SupabaseClient,
  userId: string
): Promise<"valid" | "conflict" | "missing"> {
  const clientToken = getClientSessionToken();
  if (!clientToken) return "missing";

  const { data, error } = await supabase
    .from("user_sessions")
    .select("session_token")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.session_token) return "missing";
  if (data.session_token !== clientToken) return "conflict";
  return "valid";
}

export async function signOutWithSessionCleanup(
  supabase: SupabaseClient,
  options?: { redirectTo?: string }
): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;

  if (userId) {
    await clearUserSession(supabase, userId);
  }

  await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
  await supabase.auth.signOut();

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
    clearSignupStage();
    clearTermsAcceptanceSession();
    window.location.href = options?.redirectTo ?? "/login";
  }
}

export async function handleSessionConflict(supabase: SupabaseClient): Promise<void> {
  await signOutWithSessionCleanup(supabase, {
    redirectTo: "/login?reason=session_conflict"
  });
}
