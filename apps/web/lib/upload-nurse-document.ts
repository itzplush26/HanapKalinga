import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_DOCUMENT_SIZE_BYTES } from "@/lib/constants";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function validateDocumentFile(file: File): string | null {
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return "File is too large. Maximum size is 5 MB.";
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Use a JPG, PNG, WebP, or PDF file.";
  }
  return null;
}

export async function uploadNurseDocument(
  supabase: SupabaseClient,
  userId: string,
  file: File,
  pathPrefix: string
): Promise<{ path: string } | { error: string }> {
  const validationError = validateDocumentFile(file);
  if (validationError) {
    return { error: validationError };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${userId}/${pathPrefix}/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from("nurse-docs")
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (error || !data) {
    const message = error?.message ?? "Upload failed.";
    return {
      error: message.includes("row-level security")
        ? "Upload blocked by storage permissions. Contact support if this persists."
        : message
    };
  }

  return { path: data.path };
}
