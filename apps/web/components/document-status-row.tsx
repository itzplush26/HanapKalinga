"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, FileText } from "lucide-react";

interface DocumentStatusRowProps {
  label: string;
  path: string | null | undefined;
  submittedAt?: string | null;
}

export function DocumentStatusRow({ label, path, submittedAt }: DocumentStatusRowProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);

  useEffect(() => {
    if (!path?.trim()) {
      setPreviewUrl(null);
      return;
    }

    const lower = path.toLowerCase();
    const imageLike = /\.(jpg|jpeg|png|webp)$/i.test(lower) || lower.includes("image");
    setIsImage(imageLike);

    async function loadPreview() {
      const response = await fetch(`/api/documents/view-url?path=${encodeURIComponent(path!)}`);
      const payload = (await response.json()) as { url?: string };
      if (response.ok && payload.url) {
        setPreviewUrl(payload.url);
      }
    }

    void loadPreview();
  }, [path]);

  if (!path?.trim()) return null;

  const submittedLabel = submittedAt
    ? new Date(submittedAt).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" })
    : null;

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-start gap-3">
        {previewUrl && isImage ? (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-emerald-200 bg-white">
            <Image src={previewUrl} alt={label} fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-700">
            <FileText className="h-7 w-7" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-900">
            <Check className="h-4 w-4" />
            {label} — Uploaded &amp; Submitted
          </p>
          {submittedLabel ? (
            <p className="mt-1 text-xs text-emerald-800">Submitted on {submittedLabel}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
