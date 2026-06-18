/** Server-side Supabase project URL; falls back to the public URL used by the browser client. */
export function resolveSupabaseUrl(): string | undefined {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    undefined
  );
}
