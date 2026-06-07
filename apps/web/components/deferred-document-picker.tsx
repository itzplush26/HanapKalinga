"use client";

import { useRef, useState } from "react";
import { validateDocumentFile } from "@/lib/upload-nurse-document";
import { MAX_DOCUMENT_SIZE_LABEL } from "@/lib/constants";
import { Button } from "@/components/ui/button";

interface DeferredDocumentPickerProps {
  label: string;
  file: File | null;
  onFileSelected: (file: File | null) => void;
}

export function DeferredDocumentPicker({
  label,
  file,
  onFileSelected
}: DeferredDocumentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleFileSelected(selected: File | null) {
    if (!selected) return;
    const validationError = validateDocumentFile(selected);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    setErrorMessage(null);
    onFileSelected(selected);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">
            {file
              ? "Selected — uploads when you finish registration."
              : `PDF or image, max ${MAX_DOCUMENT_SIZE_LABEL}`}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="sr-only"
            onChange={(event) => {
              handleFileSelected(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
          {file ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onFileSelected(null)}>
              Remove
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            {file ? "Replace file" : "Select file"}
          </Button>
        </div>
      </div>
      {file ? <p className="mt-2 text-xs text-slate-600">{file.name}</p> : null}
      {errorMessage ? (
        <p className="mt-2 text-xs text-rose-600" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
