"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { resolveAuthUserId } from "@/lib/auth-session";
import { MAX_DOCUMENT_SIZE_BYTES, MAX_DOCUMENT_SIZE_LABEL } from "@/lib/constants";
import { Button } from "@/components/ui/button";

type UploadState = "idle" | "uploading" | "uploaded" | "failed";

interface DocumentUploaderProps {
  label: string;
  pathPrefix: string;
  /** Pass during registration after email OTP — avoids false "sign in required" errors. */
  userId?: string | null;
  onUploaded: (storagePath: string) => void;
}

export function DocumentUploader({
  label,
  pathPrefix,
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

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      setStatus("failed");
      setErrorMessage(`File is too large. Maximum size is ${MAX_DOCUMENT_SIZE_LABEL}.`);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setStatus("failed");
      setErrorMessage("Use a JPG, PNG, WebP, or PDF file.");
      return;
    }

    setStatus("uploading");
    setFileName(file.name);

    const resolvedUserId = await resolveAuthUserId(supabase, userId);
    if (!resolvedUserId) {
      setStatus("failed");
      setErrorMessage(
        "Your verification session expired. Go back to step 2, re-enter your email code, then try uploading again."
      );
      return;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${resolvedUserId}/${pathPrefix}/${Date.now()}-${safeName}`;

    const { data, error } = await supabase.storage
      .from("nurse-docs")
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (error || !data) {
      setStatus("failed");
      setErrorMessage(error?.message ?? "Upload failed. Please try again.");
      return;
    }

    onUploaded(data.path);
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
            {status === "idle" && `PDF or image, max ${MAX_DOCUMENT_SIZE_LABEL}`}
            {status === "uploading" && "Uploading…"}
            {status === "uploaded" && "Uploaded. Under review."}
            {status === "failed" && (errorMessage ?? "Upload failed. Try again.")}
          </p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
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
