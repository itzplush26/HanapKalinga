export async function parseUploadJsonResponse(
  response: Response
): Promise<{ path?: string; error?: string }> {
  const raw = await response.text();

  if (!raw.trim()) {
    return {
      error: response.ok
        ? "Upload failed — empty response from server."
        : `Upload failed (${response.status}). Please try again.`
    };
  }

  try {
    return JSON.parse(raw) as { path?: string; error?: string };
  } catch {
    if (response.status === 413) {
      return { error: "File too large — maximum size is 5MB." };
    }
    if (response.status === 401) {
      return { error: "Your session expired. Please sign in and try again." };
    }
    return { error: "Upload failed — please check your file and try again." };
  }
}

export function mapUploadErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("too large") || lower.includes("5 mb") || lower.includes("5mb")) {
    return "File too large — maximum size is 5MB.";
  }
  if (lower.includes("jpg") || lower.includes("pdf") || lower.includes("file type") || lower.includes("webp")) {
    return "Invalid file type — please upload a PDF or image.";
  }
  if (lower.includes("not configured") || lower.includes("missing")) {
    return "Upload is temporarily unavailable. Please try again later or contact support.";
  }
  return message || "Upload failed — please check your file and try again.";
}
