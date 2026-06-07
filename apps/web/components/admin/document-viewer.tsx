"use client";

import { useState } from "react";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentViewerProps {
  label: string;
  url: string | null;
}

export function DocumentViewer({ label, url }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);

  if (!url) {
    return (
      <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {label}: not uploaded
      </div>
    );
  }

  const content = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setZoom((z) => Math.max(50, z - 25))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setZoom((z) => Math.min(200, z + 25))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setFullscreen(true)}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button asChild size="sm" variant="ghost">
            <a href={url} target="_blank" rel="noopener noreferrer">
              Open in new tab
            </a>
          </Button>
        </div>
      </div>
      <div className="overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-2">
        <iframe
          title={label}
          src={url}
          className="h-80 w-full rounded-lg bg-white"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left", width: `${10000 / zoom}%` }}
        />
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black/80 p-4">
        <div className="mb-3 flex justify-end">
          <Button type="button" variant="outline" onClick={() => setFullscreen(false)}>
            Close fullscreen
          </Button>
        </div>
        <div className="flex-1 overflow-auto rounded-xl bg-white p-4">{content}</div>
      </div>
    );
  }

  return <div className="rounded-2xl border border-slate-200 bg-white p-4">{content}</div>;
}
