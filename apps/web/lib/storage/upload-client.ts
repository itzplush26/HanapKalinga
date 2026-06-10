import { validateDocumentFile } from "@/lib/storage/validate-document";
import { mapUploadErrorMessage, parseUploadJsonResponse } from "@/lib/storage/parse-upload-response";

export async function uploadDocumentViaApi(
  file: File,
  documentType: string,
  nurseId: string
): Promise<{ path: string } | { error: string }> {
  const validationError = validateDocumentFile(file);
  if (validationError) {
    return { error: mapUploadErrorMessage(validationError) };
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", documentType);
  formData.append("nurseId", nurseId);

  let response: Response;
  try {
    response = await fetch("/api/upload/document", {
      method: "POST",
      body: formData
    });
  } catch (error) {
    console.error("[upload/document] network error", error);
    return { error: "Upload failed — please check your connection and try again." };
  }

  const payload = await parseUploadJsonResponse(response);

  if (!response.ok || !payload.path) {
    return { error: mapUploadErrorMessage(payload.error ?? "Upload failed.") };
  }

  return { path: payload.path };
}

export async function uploadPhotoViaApi(
  file: File
): Promise<{ url: string; path: string } | { error: string }> {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Invalid file type — please upload a PDF or image." };
  }

  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch("/api/upload/photo", {
      method: "POST",
      body: formData
    });
  } catch (error) {
    console.error("[upload/photo] network error", error);
    return { error: "Upload failed — please check your connection and try again." };
  }

  const raw = await response.text();
  let payload: { url?: string; path?: string; error?: string };
  try {
    payload = JSON.parse(raw) as { url?: string; path?: string; error?: string };
  } catch {
    return { error: mapUploadErrorMessage("Upload failed — please check your file and try again.") };
  }

  if (!response.ok || !payload.url) {
    return { error: mapUploadErrorMessage(payload.error ?? "Upload failed.") };
  }

  return { url: payload.url, path: payload.path ?? payload.url };
}
