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
