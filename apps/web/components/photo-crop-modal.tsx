"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { getCroppedImageBlob } from "@/lib/image-crop";

interface PhotoCropModalProps {
  imageSrc: string;
  onCancel: () => void;
  onCropped: (file: File) => void;
}

export function PhotoCropModal({ imageSrc, onCancel, onCropped }: PhotoCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  async function handleSave() {
    if (!croppedAreaPixels) return;
    setIsSaving(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      const file = new File([blob], "profile-photo.jpg", { type: blob.type || "image/jpeg" });
      onCropped(file);
    } catch {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-4 shadow-xl">
        <p className="text-sm font-semibold text-slate-900">Crop profile photo</p>
        <div className="relative h-64 w-full overflow-hidden rounded-xl bg-slate-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="w-full"
          aria-label="Zoom"
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" className="flex-1" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? "Saving…" : "Use photo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
