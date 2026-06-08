import { validateDocumentFile } from "@/lib/storage/validate-document";

export async function uploadDocumentViaApi(
  file: File,
  documentType: string,
  nurseId: string
): Promise<{ path: string } | { error: string }> {
  const validationError = validateDocumentFile(file);
  if (validationError) {
    return { error: validationError };
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", documentType);
  formData.append("nurseId", nurseId);

  const response = await fetch("/api/upload/document", {
    method: "POST",
    body: formData
  });

  const payload = (await response.json()) as { path?: string; error?: string };

  if (!response.ok || !payload.path) {
    return { error: payload.error ?? "Upload failed." };
  }

  return { path: payload.path };
}

export async function uploadPhotoViaApi(
  file: File
): Promise<{ url: string; path: string } | { error: string }> {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Use a JPG, PNG, or WebP image." };
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload/photo", {
    method: "POST",
    body: formData
  });

  const payload = (await response.json()) as { url?: string; path?: string; error?: string };

  if (!response.ok || !payload.url) {
    return { error: payload.error ?? "Upload failed." };
  }

  return { url: payload.url, path: payload.path! };
}
