"use client";

import { useCallback, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

interface TurnstileWidgetProps {
  onToken: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  className?: string;
}

export function TurnstileWidget({ onToken, onExpire, onError, className }: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [loadFailed, setLoadFailed] = useState(false);

  const handleError = useCallback(() => {
    setLoadFailed(true);
    onError?.();
  }, [onError]);

  if (!siteKey) {
    return (
      <p className="rounded-xl border border-warning-border bg-warning-bg px-3 py-2 text-xs text-warning">
        Verification is not configured. Add NEXT_PUBLIC_TURNSTILE_SITE_KEY to enable sign-in protection.
      </p>
    );
  }

  if (loadFailed) {
    return (
      <p className="rounded-xl border border-error-border bg-error-bg px-3 py-2 text-sm text-error">
        Unable to load verification. Please check your connection and refresh the page.
      </p>
    );
  }

  return (
    <div className={className}>
      <Turnstile
        siteKey={siteKey}
        options={{ theme: "auto", size: "flexible" }}
        onSuccess={onToken}
        onExpire={() => {
          onExpire?.();
        }}
        onError={handleError}
        onUnsupported={() => handleError()}
        onTimeout={() => handleError()}
      />
    </div>
  );
}
