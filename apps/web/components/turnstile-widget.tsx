"use client";

import { useCallback, useMemo, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

interface TurnstileWidgetProps {
  onToken: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  className?: string;
}

function turnstileErrorMessage(code?: string): string {
  switch (code) {
    case "110200":
      return "This domain is not authorized for the Turnstile site key. Add the exact hostname (including www) in Cloudflare → Turnstile → Hostname management.";
    case "110100":
    case "110110":
    case "400020":
      return "The Turnstile site key is invalid or does not match your Cloudflare widget. In Vercel, set NEXT_PUBLIC_TURNSTILE_SITE_KEY to the Site Key from the same widget (not the Secret Key).";
    case "400070":
      return "This Turnstile widget is disabled in Cloudflare. Re-enable it or create a new widget.";
    default:
      return "Verification could not load. Confirm the site key in Vercel matches Cloudflare Turnstile, disable ad blockers, and refresh.";
  }
}

export function TurnstileWidget({ onToken, onExpire, onError, className }: TurnstileWidgetProps) {
  const siteKey = useMemo(
    () => process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
    []
  );
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const handleError = useCallback(
    (code?: string) => {
      if (code) {
        console.error("[Turnstile]", code);
        setErrorCode(code);
      }
      onError?.();
    },
    [onError]
  );

  if (!siteKey) {
    return (
      <p className="rounded-xl border border-warning-border bg-warning-bg px-3 py-2 text-xs text-warning">
        Verification is not configured. Add NEXT_PUBLIC_TURNSTILE_SITE_KEY to enable sign-in protection.
      </p>
    );
  }

  if (errorCode) {
    return (
      <p className="rounded-xl border border-error-border bg-error-bg px-3 py-2 text-sm text-error">
        {turnstileErrorMessage(errorCode)}
      </p>
    );
  }

  return (
    <div className={className}>
      <Turnstile
        siteKey={siteKey}
        options={{ theme: "auto", size: "normal" }}
        onSuccess={onToken}
        onExpire={() => {
          onExpire?.();
        }}
        onError={handleError}
        onUnsupported={() => handleError("unsupported")}
        onTimeout={() => handleError("timeout")}
      />
    </div>
  );
}
