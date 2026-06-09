"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/profile-avatar";
import { PhotoCropModal } from "@/components/photo-crop-modal";
import { uploadPhotoViaApi } from "@/lib/storage/upload-client";

interface ProfilePhotoUploaderProps {
  photoUrl: string | null;
  displayName: string;
  onPhotoChange: (url: string) => void | Promise<void>;
}

export function ProfilePhotoUploader({
  photoUrl,
  displayName,
  onPhotoChange
}: ProfilePhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function openFilePicker() {
    inputRef.current?.click();
  }

  function closeCropModal() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setErrorMessage(null);

    const result = await uploadPhotoViaApi(file);
    if ("error" in result) {
      setErrorMessage(result.error);
      setUploading(false);
      return;
    }

    await onPhotoChange(result.url);
    setUploading(false);
  }

  function handleFileSelected(file: File | null) {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Use a JPG, PNG, or WebP image.");
      return;
    }

    setErrorMessage(null);
    setCropSrc(URL.createObjectURL(file));
  }

  const buttonLabel = photoUrl ? "Change photo" : "Upload photo";

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={openFilePicker}
          disabled={uploading}
          className="group relative shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label={buttonLabel}
        >
          <ProfileAvatar src={photoUrl} name={displayName} size="lg" />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition group-hover:bg-black/35 group-focus-visible:bg-black/35">
            <Camera className="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100 sm:opacity-0" />
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white shadow sm:flex">
            <Camera className="h-3.5 w-3.5" aria-hidden />
          </span>
        </button>

        <div className="flex flex-col gap-2">
          <div>
            <p className="text-sm font-medium text-slate-900">Profile photo</p>
            <p className="text-xs text-slate-500">JPG, PNG, or WebP — cropped to a circle.</p>
          </div>
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={openFilePicker}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Uploading…
              </>
            ) : (
              buttonLabel
            )}
          </Button>
          {errorMessage ? (
            <p className="text-xs text-rose-600" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          handleFileSelected(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />

      {cropSrc ? (
        <PhotoCropModal
          imageSrc={cropSrc}
          onCancel={closeCropModal}
          onCropped={(file) => {
            closeCropModal();
            void uploadFile(file);
          }}
        />
      ) : null}
    </>
  );
}
