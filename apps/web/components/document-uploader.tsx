"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { resolveAuthUserId } from "@/lib/auth-session";
import { uploadDocumentViaApi, uploadPhotoViaApi } from "@/lib/storage/upload-client";
import { MAX_DOCUMENT_SIZE_BYTES, MAX_DOCUMENT_SIZE_LABEL } from "@/lib/constants";
import { Button } from "@/components/ui/button";

type UploadState = "idle" | "uploading" | "uploaded" | "failed";
type UploadVariant = "document" | "photo";

interface DocumentUploaderProps {
  label: string;
  pathPrefix: string;
  variant?: UploadVariant;
  /** Pass during registration after email OTP — avoids false "sign in required" errors. */
  userId?: string | null;
  onUploaded: (value: string) => void;
}

export function DocumentUploader({
  label,
  pathPrefix,
  variant = "document",
  userId,
  onUploaded
}: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const supabase = createClient();

  async function handleUpload(file: File | null) {
    if (!file) return;

    setErrorMessage(null);

    if (variant === "document" && file.size > MAX_DOCUMENT_SIZE_BYTES) {
      setStatus("failed");
      setErrorMessage(`File is too large. Maximum size is ${MAX_DOCUMENT_SIZE_LABEL}.`);
      return;
    }

    const allowedTypes =
      variant === "photo"
        ? ["image/jpeg", "image/png", "image/webp"]
        : ["image/jpeg", "image/png", "image/webp", "application/pdf"];

    if (!allowedTypes.includes(file.type)) {
      setStatus("failed");
      setErrorMessage(
        variant === "photo" ? "Use a JPG, PNG, or WebP image." : "Use a JPG, PNG, WebP, or PDF file."
      );
      return;
    }

    setStatus("uploading");
    setFileName(file.name);

    if (variant === "photo") {
      const result = await uploadPhotoViaApi(file);
      if ("error" in result) {
        setStatus("failed");
        setErrorMessage(result.error);
        return;
      }
      onUploaded(result.url);
      setStatus("uploaded");
      return;
    }

    const resolvedUserId = await resolveAuthUserId(supabase, userId);
    if (!resolvedUserId) {
      setStatus("failed");
      setErrorMessage(
        "Your verification session expired. Go back to step 2, re-enter your email code, then try uploading again."
      );
      return;
    }

    const result = await uploadDocumentViaApi(file, pathPrefix, resolvedUserId);
    if ("error" in result) {
      setStatus("failed");
      setErrorMessage(result.error);
      return;
    }

    onUploaded(result.path);
    setStatus("uploaded");
  }

  function openFilePicker() {
    inputRef.current?.click();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">
            {status === "idle" &&
              (variant === "photo"
                ? "JPG, PNG, or WebP — compressed automatically"
                : `PDF or image, max ${MAX_DOCUMENT_SIZE_LABEL}`)}
            {status === "uploading" && "Uploading…"}
            {status === "uploaded" && "Uploaded. Under review."}
            {status === "failed" && (errorMessage ?? "Upload failed. Try again.")}
          </p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={
              variant === "photo"
                ? "image/jpeg,image/png,image/webp"
                : "image/jpeg,image/png,image/webp,application/pdf"
            }
            className="sr-only"
            onChange={(event) => {
              void handleUpload(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={status === "uploading"}
            onClick={openFilePicker}
          >
            {status === "uploading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Uploading…
              </>
            ) : (
              "Select file"
            )}
          </Button>
        </div>
      </div>
      {fileName ? <p className="mt-2 text-xs text-slate-500">{fileName}</p> : null}
      {status === "failed" && errorMessage ? (
        <p className="mt-2 text-xs text-rose-600" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
