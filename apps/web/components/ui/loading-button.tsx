"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ className, children, loading = false, loadingText, disabled, ...props }, ref) => {
    const label = loading ? (loadingText ?? children) : children;

    return (
      <Button
        ref={ref}
        className={cn("relative", className)}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        <span className="inline-flex min-w-[8rem] items-center justify-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : null}
          <span>{label}</span>
        </span>
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";
