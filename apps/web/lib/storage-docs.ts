import { getSignedDocumentUrl, normalizeStoragePath } from "@/lib/storage/r2";

/** Value may be a storage path or legacy Supabase signed URL — returns a viewable signed URL. */
export async function resolveDocumentViewUrl(
  storedValue: string | null | undefined
): Promise<string | null> {
  if (!storedValue?.trim()) return null;

  try {
    const path = normalizeStoragePath(storedValue);
    return await getSignedDocumentUrl(path);
  } catch {
    return null;
  }
}
