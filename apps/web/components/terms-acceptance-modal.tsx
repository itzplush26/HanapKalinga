"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { TermsContent, TERMS_LAST_UPDATED, TERMS_SUMMARY } from "@/lib/legal/terms-content";
import { PrivacyContent, PRIVACY_LAST_UPDATED, PRIVACY_SUMMARY } from "@/lib/legal/privacy-content";
import { LoadingButton } from "@/components/ui/loading-button";
import { cn } from "@/lib/utils";

interface TermsAcceptanceModalProps {
  open: boolean;
  onAccept: () => void;
  onClose: () => void;
  alreadyAccepted?: boolean;
}

function ConsentCheckbox({
  id,
  checked,
  onChange,
  children
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm text-text-secondary">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
      />
      <span>{children}</span>
    </label>
  );
}

export function TermsAcceptanceModal({
  open,
  onAccept,
  onClose,
  alreadyAccepted = false
}: TermsAcceptanceModalProps) {
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const canContinue = agreedPrivacy && agreedTerms;

  useEffect(() => {
    if (open) {
      setAgreedPrivacy(alreadyAccepted);
      setAgreedTerms(alreadyAccepted);
      setAccepting(false);
      return;
    }

    setAgreedPrivacy(false);
    setAgreedTerms(false);
    setAccepting(false);
  }, [open, alreadyAccepted]);

  if (!open) return null;

  function handleAccept() {
    if (!canContinue) return;
    setAccepting(true);
    onAccept();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-xl sm:rounded-2xl"
        style={{ maxHeight: "85vh" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="terms-modal-title" className="text-lg font-semibold text-text-primary">
                Terms &amp; Privacy
              </h2>
              <p className="mt-1 text-xs text-text-muted">Review and accept to continue</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-1 text-text-muted hover:bg-slate-100 hover:text-text-primary"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <section className="mb-8">
            <h3 className="text-sm font-semibold text-text-primary">Privacy Policy</h3>
            <p className="mt-1 text-xs text-text-muted">Last updated: {PRIVACY_LAST_UPDATED}</p>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">{PRIVACY_SUMMARY}</p>
            <div className="mt-4">
              <PrivacyContent />
            </div>
          </section>

          <section className="border-t border-border pt-8">
            <h3 className="text-sm font-semibold text-text-primary">Terms of Service</h3>
            <p className="mt-1 text-xs text-text-muted">Last updated: {TERMS_LAST_UPDATED}</p>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">{TERMS_SUMMARY}</p>
            <div className="mt-4">
              <TermsContent />
            </div>
          </section>
        </div>

        <div className="shrink-0 space-y-3 border-t border-border px-5 py-4">
          <ConsentCheckbox id="consent-privacy" checked={agreedPrivacy} onChange={setAgreedPrivacy}>
            I have read and agree to the{" "}
            <Link
              href="/privacy"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2"
              onClick={(event) => event.stopPropagation()}
            >
              Privacy Policy
            </Link>
          </ConsentCheckbox>

          <ConsentCheckbox id="consent-terms" checked={agreedTerms} onChange={setAgreedTerms}>
            I have read and agree to the{" "}
            <Link
              href="/terms"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2"
              onClick={(event) => event.stopPropagation()}
            >
              Terms of Service
            </Link>
          </ConsentCheckbox>

          <LoadingButton
            type="button"
            className={cn("w-full", !canContinue && "opacity-50")}
            loading={accepting}
            loadingText="Continuing..."
            disabled={!canContinue}
            onClick={handleAccept}
          >
            Continue
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}
