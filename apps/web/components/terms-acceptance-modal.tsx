"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TermsContent, TERMS_LAST_UPDATED, TERMS_SUMMARY } from "@/lib/legal/terms-content";
import { LoadingButton } from "@/components/ui/loading-button";
import { cn } from "@/lib/utils";

interface TermsAcceptanceModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function TermsAcceptanceModal({ open, onAccept, onDecline }: TermsAcceptanceModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasRead, setHasRead] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const checkScrollPosition = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (remaining <= 100) {
      setHasRead(true);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setHasRead(false);
      setAccepting(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      checkScrollPosition();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, checkScrollPosition]);

  if (!open) return null;

  async function handleAccept() {
    setAccepting(true);
    onAccept();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
      >
        <div className="border-b border-border px-5 py-4">
          <h2 id="terms-modal-title" className="text-lg font-semibold text-text-primary">
            Terms of Service
          </h2>
          <p className="mt-1 text-xs text-text-muted">Last updated: {TERMS_LAST_UPDATED}</p>
          <p className="mt-3 text-sm text-text-secondary">{TERMS_SUMMARY}</p>
        </div>

        <div className="relative flex-1 min-h-0">
          <div
            ref={scrollRef}
            onScroll={checkScrollPosition}
            className="h-64 overflow-y-auto px-5 py-4 sm:h-72"
          >
            <TermsContent />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-surface to-transparent"
            aria-hidden
          />
        </div>

        <div className="space-y-3 border-t border-border px-5 py-4">
          <p className={cn("text-xs", hasRead ? "text-success" : "text-text-muted")}>
            {hasRead ? "You have reached the end of the terms." : "Scroll through the full terms to continue."}
          </p>

          <div className="group relative">
            <LoadingButton
              type="button"
              className="w-full"
              loading={accepting}
              loadingText="Continuing..."
              disabled={!hasRead}
              onClick={() => void handleAccept()}
              title={hasRead ? undefined : "Please scroll through the terms to continue"}
            >
              I have read and agree to the Terms of Service and Privacy Policy
            </LoadingButton>
          </div>

          <p className="text-center text-xs">
            <Link
              href="/privacy"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2"
            >
              Read full Privacy Policy
            </Link>
          </p>

          <button
            type="button"
            onClick={onDecline}
            className="w-full text-center text-sm text-text-muted underline underline-offset-2 hover:text-text-secondary"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
