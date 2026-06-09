import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-border bg-surface px-6 py-10 text-center",
        compact && "px-4 py-6",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-surface-alt",
          compact ? "h-9 w-9" : "h-12 w-12"
        )}
      >
        <Icon
          className={cn("text-text-muted", compact ? "h-4 w-4" : "h-6 w-6")}
          strokeWidth={1.75}
        />
      </div>
      <h3 className={cn("font-semibold text-text-primary", compact ? "mt-2 text-sm" : "mt-4 text-base")}>
        {title}
      </h3>
      {description ? (
        <p className={cn("max-w-sm text-text-secondary", compact ? "mt-1 text-xs" : "mt-2 text-sm")}>
          {description}
        </p>
      ) : null}
      {action ? <div className={compact ? "mt-2" : "mt-4"}>{action}</div> : null}
    </div>
  );
}
