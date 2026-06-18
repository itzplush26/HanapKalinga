import { createClient } from "@supabase/supabase-js";
import { resolveSupabaseUrl } from "@/lib/supabase/project-url";

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
