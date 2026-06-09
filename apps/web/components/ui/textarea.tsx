import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[120px] w-full rounded-xl border border-border bg-surface px-3 py-2 text-base text-text-primary outline-none placeholder:text-text-muted focus:ring-2 focus:ring-border-focus",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
