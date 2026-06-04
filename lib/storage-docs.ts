import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "nurse-docs";

/** Value may be a storage path or legacy full URL — returns a viewable signed URL. */
export async function resolveDocumentViewUrl(
  supabase: SupabaseClient,
  storedValue: string | null | undefined
): Promise<string | null> {
  if (!storedValue?.trim()) return null;

  let path = storedValue.trim();
  if (path.startsWith("http")) {
    const marker = `/object/sign/${BUCKET}/`;
    const idx = path.indexOf(marker);
    if (idx === -1) return path;
    path = path.slice(idx + marker.length).split("?")[0] ?? path;
  }

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
