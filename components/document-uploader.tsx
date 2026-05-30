"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type UploadState = "idle" | "uploading" | "uploaded" | "failed";

interface DocumentUploaderProps {
  label: string;
  pathPrefix: string;
  onUploaded: (url: string) => void;
}

export function DocumentUploader({
  label,
  pathPrefix,
  onUploaded
}: DocumentUploaderProps) {
  const [status, setStatus] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const supabase = createClient();

  async function handleUpload(file: File | null) {
    if (!file) return;
    setStatus("uploading");
    setFileName(file.name);

    const filePath = `${pathPrefix}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("nurse-docs")
      .upload(filePath, file, { upsert: true });

    if (error || !data) {
      setStatus("failed");
      return;
    }

    const { data: signed } = await supabase.storage
      .from("nurse-docs")
      .createSignedUrl(data.path, 60 * 60);

    if (!signed?.signedUrl) {
      setStatus("failed");
      return;
    }

    onUploaded(signed.signedUrl);
    setStatus("uploaded");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">
            {status === "idle" && "Upload a clear scan"}
            {status === "uploading" && "Uploading..."}
            {status === "uploaded" && "Uploaded. Under review."}
            {status === "failed" && "Upload failed. Try again."}
          </p>
        </div>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(event) => handleUpload(event.target.files?.[0] ?? null)}
          />
          <Button type="button" variant="outline">
            Select file
          </Button>
        </label>
      </div>
      {fileName ? <p className="mt-2 text-xs text-slate-500">{fileName}</p> : null}
    </div>
  );
}
