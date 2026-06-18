import { createClient } from "@supabase/supabase-js";

/** Server-side Supabase project URL; falls back to the public URL used by the browser client. */
export function resolveSupabaseUrl(): string | undefined {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    undefined
  );
}

export function isSupabaseServiceRoleConfigured(): boolean {
  return Boolean(
    resolveSupabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

export function createServiceClient() {
  const url = resolveSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase service role configuration.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
