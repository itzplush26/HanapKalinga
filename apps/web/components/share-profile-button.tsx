"use client";

import { useState } from "react";
import { Share2, Copy, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareProfileButtonProps {
  profileUrl: string;
  nurseName: string;
  variant?: "button" | "card";
}

export function ShareProfileButton({ profileUrl, nurseName, variant = "button" }: ShareProfileButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareText = `Check out this verified nurse on HanapKalinga — ${nurseName}`;

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: nurseName, text: shareText, url: profileUrl });
        return;
      } catch {
        // fall through to popover
      }
    }
    setOpen(true);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const mailto = `mailto:?subject=${encodeURIComponent(`${nurseName} on HanapKalinga`)}&body=${encodeURIComponent(`${shareText}\n${profileUrl}`)}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;

  if (variant === "card") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-navy-900">Share your profile</h3>
        <p className="mt-1 text-xs text-slate-500">
          Sharing on Facebook nursing groups can help you find more clients.
        </p>
        <div className="mt-3 flex gap-2">
          <input readOnly value={profileUrl} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs" />
          <Button type="button" size="sm" variant="outline" onClick={() => void copyLink()}>
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <div className="mt-2 flex gap-2">
          <a href={facebook} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">
            Share on Facebook
          </a>
          <a href={mailto} className="text-xs text-brand-600 hover:underline">
            Share via email
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button type="button" variant="outline" size="sm" onClick={() => void handleShare()}>
        <Share2 className="mr-1.5 h-4 w-4" />
        Share
      </Button>
      {open ? (
        <div className="absolute right-0 z-10 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <button type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50" onClick={() => void copyLink()}>
            <Copy className="h-4 w-4" />
            {copied ? "Copied!" : "Copy link"}
          </button>
          <a href={facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
            Facebook
          </a>
          <a href={mailto} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
            <Mail className="h-4 w-4" />
            Email
          </a>
          <button type="button" className="mt-1 w-full text-center text-xs text-slate-400" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
