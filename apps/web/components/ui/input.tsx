import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border border-border bg-surface px-3 text-base text-text-primary outline-none placeholder:text-text-muted focus:ring-2 focus:ring-border-focus",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
